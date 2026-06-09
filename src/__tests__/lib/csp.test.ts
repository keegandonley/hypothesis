import { describe, expect, it } from "vitest";

import {
  analyzeCsp,
  auditCsp,
  buildEffective,
  parseCsp,
} from "@/lib/csp";

// ---------------------------------------------------------------------------
// parseCsp
// ---------------------------------------------------------------------------

describe("parseCsp", () => {
  it("returns empty array for empty string", () => {
    expect(parseCsp("")).toEqual([]);
  });

  it("returns empty array for whitespace-only input", () => {
    expect(parseCsp("   ")).toEqual([]);
  });

  it("parses a minimal policy", () => {
    const result = parseCsp("default-src 'self'");

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "default-src",
      sources: ["'self'"],
      duplicate: false,
    });
  });

  it("parses multiple directives separated by semicolons", () => {
    const result = parseCsp("default-src 'self'; script-src 'self' cdn.example.com");

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("default-src");
    expect(result[1].name).toBe("script-src");
    expect(result[1].sources).toEqual(["'self'", "cdn.example.com"]);
  });

  it("handles a trailing semicolon", () => {
    const result = parseCsp("default-src 'self';");

    expect(result).toHaveLength(1);
  });

  it("normalises directive names to lowercase", () => {
    const result = parseCsp("Default-Src 'self'");

    expect(result[0].name).toBe("default-src");
  });

  it("marks the second occurrence of a directive as duplicate", () => {
    const result = parseCsp("script-src 'self'; script-src 'unsafe-inline'");

    expect(result[0].duplicate).toBe(false);
    expect(result[1].duplicate).toBe(true);
  });

  it("first occurrence is not a duplicate even when a later one is", () => {
    const result = parseCsp("script-src 'self'; img-src *; script-src 'none'");

    expect(result[0].duplicate).toBe(false); // first script-src
    expect(result[1].duplicate).toBe(false); // img-src — different name
    expect(result[2].duplicate).toBe(true);  // second script-src
  });

  it("strips the Content-Security-Policy: header prefix", () => {
    const result = parseCsp("Content-Security-Policy: default-src 'self'");

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("default-src");
  });

  it("strips the Content-Security-Policy-Report-Only: header prefix", () => {
    const result = parseCsp("Content-Security-Policy-Report-Only: default-src 'self'");

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("default-src");
  });

  it("handles extra whitespace between tokens", () => {
    const result = parseCsp("script-src   'self'   cdn.example.com");

    expect(result[0].sources).toEqual(["'self'", "cdn.example.com"]);
  });

  it("handles a directive with no sources", () => {
    const result = parseCsp("upgrade-insecure-requests");

    expect(result[0].sources).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// buildEffective
// ---------------------------------------------------------------------------

describe("buildEffective", () => {
  it("returns 'explicit' for a directive that is present", () => {
    const directives = parseCsp("script-src 'self'");
    const effective = buildEffective(directives);
    const entry = effective.find((e) => e.directive === "script-src")!;

    expect(entry.via).toBe("explicit");
    expect(entry.sources).toEqual(["'self'"]);
  });

  it("returns 'default-src' for a fetch directive that falls back", () => {
    const directives = parseCsp("default-src 'self'");
    const effective = buildEffective(directives);
    const entry = effective.find((e) => e.directive === "script-src")!;

    expect(entry.via).toBe("default-src");
    expect(entry.sources).toEqual(["'self'"]);
  });

  it("returns 'unrestricted' for a fetch directive with no default-src", () => {
    const directives = parseCsp("img-src *");
    const effective = buildEffective(directives);
    const entry = effective.find((e) => e.directive === "script-src")!;

    expect(entry.via).toBe("unrestricted");
    expect(entry.sources).toEqual([]);
  });

  it("returns 'unrestricted' for base-uri when absent (non-fallback directive)", () => {
    const directives = parseCsp("default-src 'self'");
    const effective = buildEffective(directives);
    const entry = effective.find((e) => e.directive === "base-uri")!;

    expect(entry.via).toBe("unrestricted");
  });

  it("uses first occurrence when a directive appears more than once", () => {
    const directives = parseCsp("script-src 'self'; script-src 'unsafe-inline'");
    const effective = buildEffective(directives);
    const entry = effective.find((e) => e.directive === "script-src")!;

    expect(entry.sources).toEqual(["'self'"]);
  });

  it("returns 'explicit' for form-action when present", () => {
    const directives = parseCsp("form-action 'self'");
    const effective = buildEffective(directives);
    const entry = effective.find((e) => e.directive === "form-action")!;

    expect(entry.via).toBe("explicit");
  });
});

// ---------------------------------------------------------------------------
// auditCsp — script-src execution risks
// ---------------------------------------------------------------------------

describe("auditCsp – script-src risks", () => {
  function findBySeverity(policy: string, severity: string) {
    return auditCsp(parseCsp(policy)).filter((f) => f.severity === severity);
  }

  function findByTitle(policy: string, titleSubstring: string) {
    return auditCsp(parseCsp(policy)).find((f) =>
      f.title.includes(titleSubstring),
    );
  }

  it("flags 'unsafe-inline' as high when no nonce/hash present", () => {
    const finding = findByTitle(
      "script-src 'self' 'unsafe-inline'",
      "'unsafe-inline' allows inline script",
    );

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("high");
  });

  it("downgrades 'unsafe-inline' to info when nonce is also present", () => {
    const finding = findByTitle(
      "script-src 'nonce-abc123' 'unsafe-inline'",
      "'unsafe-inline' is present but ignored",
    );

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("info");
  });

  it("downgrades 'unsafe-inline' to info when hash is also present", () => {
    const finding = findByTitle(
      "script-src 'sha256-abc=' 'unsafe-inline'",
      "'unsafe-inline' is present but ignored",
    );

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("info");
  });

  it("downgrades 'unsafe-inline' to info when strict-dynamic is also present", () => {
    const finding = findByTitle(
      "script-src 'strict-dynamic' 'unsafe-inline'",
      "'unsafe-inline' is present but ignored",
    );

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("info");
  });

  it("flags 'unsafe-eval' as high", () => {
    const finding = findByTitle(
      "script-src 'self' 'unsafe-eval'",
      "'unsafe-eval'",
    );

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("high");
    expect(finding!.directive).toBe("script-src");
  });

  it("flags 'unsafe-hashes' as medium", () => {
    const finding = findByTitle(
      "script-src 'self' 'unsafe-hashes'",
      "'unsafe-hashes'",
    );

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("medium");
  });

  it("flags wildcard * in script-src as high", () => {
    const finding = findByTitle("script-src *", "Wildcard *");

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("high");
    expect(finding!.directive).toBe("script-src");
  });

  it("attributes wildcard * to default-src when script-src falls back", () => {
    const finding = findByTitle("default-src *", "Wildcard *");

    expect(finding!.directive).toBe("default-src");
  });

  it("flags https: scheme in script-src as high", () => {
    const finding = findByTitle("script-src https:", "Scheme source https:");

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("high");
  });

  it("flags http: scheme in script-src as high", () => {
    const finding = findByTitle("script-src http:", "Scheme source http:");

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("high");
  });

  it("flags data: scheme in script-src as high", () => {
    const finding = findByTitle("script-src data:", "Scheme source data:");

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("high");
  });

  it("emits an info finding for 'strict-dynamic'", () => {
    const finding = findByTitle(
      "script-src 'nonce-abc' 'strict-dynamic'",
      "'strict-dynamic' is in use",
    );

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("info");
  });

  it("emits an info finding when a nonce is present", () => {
    const finding = findByTitle(
      "script-src 'nonce-abc123'",
      "Nonce-based script-src",
    );

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("info");
  });
});

// ---------------------------------------------------------------------------
// auditCsp — missing-protection findings
// ---------------------------------------------------------------------------

describe("auditCsp – missing protections", () => {
  function findByTitle(policy: string, titleSubstring: string) {
    return auditCsp(parseCsp(policy)).find((f) =>
      f.title.includes(titleSubstring),
    );
  }

  it("flags missing default-src as medium", () => {
    const finding = findByTitle("script-src 'self'", "No default-src");

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("medium");
  });

  it("does not flag missing default-src when it is present", () => {
    const finding = findByTitle("default-src 'self'", "No default-src");

    expect(finding).toBeUndefined();
  });

  it("flags object-src not set to 'none' as medium", () => {
    const finding = findByTitle(
      "default-src 'self'",
      "object-src is not locked down",
    );

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("medium");
  });

  it("does not flag object-src when set to 'none'", () => {
    const finding = findByTitle(
      "default-src 'self'; object-src 'none'",
      "object-src is not locked down",
    );

    expect(finding).toBeUndefined();
  });

  it("flags missing base-uri as medium", () => {
    const finding = findByTitle("default-src 'self'", "No base-uri");

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("medium");
  });

  it("does not flag base-uri when present", () => {
    const finding = findByTitle(
      "default-src 'self'; base-uri 'self'",
      "No base-uri",
    );

    expect(finding).toBeUndefined();
  });

  it("flags missing frame-ancestors as medium (clickjacking)", () => {
    const finding = findByTitle("default-src 'self'", "No frame-ancestors");

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("medium");
  });

  it("does not flag frame-ancestors when present", () => {
    const finding = findByTitle(
      "default-src 'self'; frame-ancestors 'none'",
      "No frame-ancestors",
    );

    expect(finding).toBeUndefined();
  });

  it("flags missing form-action as low", () => {
    const finding = findByTitle("default-src 'self'", "No form-action");

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("low");
  });

  it("does not flag form-action when present", () => {
    const finding = findByTitle(
      "default-src 'self'; form-action 'self'",
      "No form-action",
    );

    expect(finding).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// auditCsp — style-src
// ---------------------------------------------------------------------------

describe("auditCsp – style-src", () => {
  function findByTitle(policy: string, titleSubstring: string) {
    return auditCsp(parseCsp(policy)).find((f) =>
      f.title.includes(titleSubstring),
    );
  }

  it("flags 'unsafe-inline' in style-src as low", () => {
    const finding = findByTitle(
      "default-src 'self'; style-src 'unsafe-inline'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
      "'unsafe-inline' allows inline styles",
    );

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("low");
  });

  it("does not flag style-src 'unsafe-inline' when a nonce is also present", () => {
    const finding = findByTitle(
      "default-src 'self'; style-src 'nonce-abc' 'unsafe-inline'",
      "'unsafe-inline' allows inline styles",
    );

    expect(finding).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// auditCsp — hygiene findings
// ---------------------------------------------------------------------------

describe("auditCsp – hygiene", () => {
  function findByTitle(policy: string, titleSubstring: string) {
    return auditCsp(parseCsp(policy)).find((f) =>
      f.title.includes(titleSubstring),
    );
  }

  it("flags report-uri alone as info (deprecated)", () => {
    const finding = findByTitle(
      "default-src 'self'; report-uri /csp-report",
      "report-uri is deprecated",
    );

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("info");
    expect(finding!.title).not.toContain("report-to also present");
  });

  it("flags report-uri as deprecated-with-upgrade when report-to is also present", () => {
    const finding = findByTitle(
      "default-src 'self'; report-uri /csp; report-to csp-endpoint",
      "report-uri is deprecated (report-to also present)",
    );

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("info");
  });

  it("emits info for upgrade-insecure-requests", () => {
    const finding = findByTitle(
      "default-src 'self'; upgrade-insecure-requests",
      "upgrade-insecure-requests is enabled",
    );

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("info");
  });

  it("flags an unknown directive as medium", () => {
    const finding = findByTitle(
      "default-src 'self'; typo-src 'self'",
      'Unknown directive "typo-src"',
    );

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("medium");
  });

  it("flags a duplicate directive as low", () => {
    const finding = findByTitle(
      "script-src 'self'; script-src 'none'",
      'Duplicate directive "script-src" is ignored',
    );

    expect(finding).toBeDefined();
    expect(finding!.severity).toBe("low");
  });

  it("prepends a clean-bill-of-health info finding when no high/medium issues exist", () => {
    const policy =
      "default-src 'none'; script-src 'nonce-abc'; style-src 'nonce-abc'; " +
      "img-src 'self'; object-src 'none'; base-uri 'none'; " +
      "frame-ancestors 'none'; form-action 'self'";
    const findings = auditCsp(parseCsp(policy));

    expect(findings[0].title).toContain("No high or medium severity issues");
    expect(findings[0].severity).toBe("info");
  });

  it("does not prepend clean finding when high-severity issues exist", () => {
    const findings = auditCsp(parseCsp("script-src 'unsafe-eval'"));

    expect(findings[0].title).not.toContain("No high or medium severity");
  });
});

// ---------------------------------------------------------------------------
// analyzeCsp — integration
// ---------------------------------------------------------------------------

describe("analyzeCsp", () => {
  it("returns empty arrays for empty input", () => {
    const result = analyzeCsp("");

    expect(result.directives).toEqual([]);
    expect(result.findings).toEqual([]);
    expect(result.effective).toEqual([]);
  });

  it("returns directives, findings, and effective for a valid policy", () => {
    const result = analyzeCsp("default-src 'self'; script-src 'self'");

    expect(result.directives.length).toBeGreaterThan(0);
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.effective.length).toBeGreaterThan(0);
  });

  it("strips the CSP header name in the full pipeline", () => {
    const result = analyzeCsp("Content-Security-Policy: default-src 'self'");

    expect(result.directives[0].name).toBe("default-src");
  });
});
