// Content-Security-Policy parser + audit engine. Pure, dependency-free, and
// runs identically in the browser and in the Node API route.

export type Severity = "high" | "medium" | "low" | "info";

export interface Directive {
  name: string;
  sources: string[];
  /** True when an earlier directive of the same name already appeared — the
   * browser uses the first occurrence and ignores this one. */
  duplicate: boolean;
}

export interface Finding {
  severity: Severity;
  /** Directive the finding relates to, when applicable. */
  directive?: string;
  title: string;
  detail: string;
}

export interface EffectiveEntry {
  directive: string;
  sources: string[];
  /** How the value was resolved: "explicit", "default-src", or "unrestricted". */
  via: "explicit" | "default-src" | "unrestricted";
}

export interface CspAnalysis {
  directives: Directive[];
  findings: Finding[];
  effective: EffectiveEntry[];
}

// Fetch directives that fall back to `default-src` when omitted.
const FETCH_DIRECTIVES = new Set([
  "child-src",
  "connect-src",
  "font-src",
  "frame-src",
  "img-src",
  "manifest-src",
  "media-src",
  "object-src",
  "script-src",
  "script-src-elem",
  "script-src-attr",
  "style-src",
  "style-src-elem",
  "style-src-attr",
  "worker-src",
]);

// Directives that do NOT fall back to default-src — a common source of bugs.
const NON_FALLBACK_DIRECTIVES = new Set([
  "base-uri",
  "form-action",
  "frame-ancestors",
  "navigate-to",
  "report-uri",
  "report-to",
  "sandbox",
  "upgrade-insecure-requests",
  "block-all-mixed-content",
  "require-trusted-types-for",
  "trusted-types",
  "plugin-types",
]);

const KNOWN_DIRECTIVES = new Set([
  ...FETCH_DIRECTIVES,
  ...NON_FALLBACK_DIRECTIVES,
  "default-src",
]);

// Directives whose resolved value we surface in the "effective policy" view.
const EFFECTIVE_DIRECTIVES = [
  "script-src",
  "style-src",
  "img-src",
  "connect-src",
  "font-src",
  "frame-src",
  "object-src",
  "base-uri",
  "form-action",
  "frame-ancestors",
];

function isNonce(source: string): boolean {
  return /^'nonce-/i.test(source);
}

function isHash(source: string): boolean {
  return /^'sha(256|384|512)-/i.test(source);
}

/** Strip an optional `Content-Security-Policy:` header prefix and whitespace. */
function stripHeaderName(raw: string): string {
  return raw
    .trim()
    .replace(/^content-security-policy(-report-only)?\s*:/i, "")
    .trim();
}

export function parseCsp(raw: string): Directive[] {
  const policy = stripHeaderName(raw);

  if (!policy) return [];

  const seen = new Set<string>();

  return policy
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const tokens = segment.split(/\s+/);
      const name = tokens[0].toLowerCase();
      const duplicate = seen.has(name);

      seen.add(name);

      return { name, sources: tokens.slice(1), duplicate };
    });
}

function directiveMap(directives: Directive[]): Map<string, Directive> {
  const map = new Map<string, Directive>();

  // First occurrence wins (matches browser behaviour).
  for (const d of directives) if (!map.has(d.name)) map.set(d.name, d);

  return map;
}

/** Resolve a fetch directive's effective sources, applying default-src fallback. */
function resolveEffective(
  name: string,
  map: Map<string, Directive>,
): EffectiveEntry {
  const explicit = map.get(name);

  if (explicit) {
    return { directive: name, sources: explicit.sources, via: "explicit" };
  }

  if (FETCH_DIRECTIVES.has(name)) {
    const fallback = map.get("default-src");

    if (fallback) {
      return {
        directive: name,
        sources: fallback.sources,
        via: "default-src",
      };
    }
  }

  return { directive: name, sources: [], via: "unrestricted" };
}

export function buildEffective(directives: Directive[]): EffectiveEntry[] {
  const map = directiveMap(directives);

  return EFFECTIVE_DIRECTIVES.map((name) => resolveEffective(name, map));
}

export function auditCsp(directives: Directive[]): Finding[] {
  const map = directiveMap(directives);
  const findings: Finding[] = [];

  const hasDefault = map.has("default-src");
  const scriptSrc = resolveEffective("script-src", map);
  const styleSrc = resolveEffective("style-src", map);

  const scriptHasNonce = scriptSrc.sources.some(isNonce);
  const scriptHasHash = scriptSrc.sources.some(isHash);
  const scriptHasStrictDynamic = scriptSrc.sources.includes("'strict-dynamic'");
  const scriptNeutralizesInline =
    scriptHasNonce || scriptHasHash || scriptHasStrictDynamic;

  // --- script-src execution risks ---
  if (scriptSrc.sources.includes("'unsafe-inline'")) {
    if (scriptNeutralizesInline) {
      findings.push({
        severity: "info",
        directive: "script-src",
        title: "'unsafe-inline' is present but ignored by modern browsers",
        detail:
          "Because a nonce, hash, or 'strict-dynamic' is also present, browsers that support them ignore 'unsafe-inline'. It only serves as a fallback for legacy browsers.",
      });
    } else {
      findings.push({
        severity: "high",
        directive: "script-src",
        title: "'unsafe-inline' allows inline script execution",
        detail:
          "Inline <script> blocks and event-handler attributes can run, which defeats most XSS protection. Replace it with per-response nonces or hashes.",
      });
    }
  }

  if (scriptSrc.sources.includes("'unsafe-eval'")) {
    findings.push({
      severity: "high",
      directive: "script-src",
      title: "'unsafe-eval' allows eval() and string-to-code APIs",
      detail:
        "eval(), new Function(), and setTimeout('...') become available, widening the XSS attack surface. Remove it unless a dependency strictly requires it.",
    });
  }

  if (scriptSrc.sources.includes("'unsafe-hashes'")) {
    findings.push({
      severity: "medium",
      directive: "script-src",
      title: "'unsafe-hashes' permits hashed inline event handlers",
      detail:
        "This relaxes the policy to allow inline event-handler attributes (onclick=…) that match a hash. Prefer moving handlers into external scripts.",
    });
  }

  if (scriptSrc.sources.includes("*")) {
    findings.push({
      severity: "high",
      directive: scriptSrc.via === "default-src" ? "default-src" : "script-src",
      title: "Wildcard * allows scripts from any origin",
      detail:
        "Any HTTPS origin can serve executable script, which provides essentially no protection. Restrict to an explicit allowlist, nonces, or hashes.",
    });
  }

  for (const scheme of ["https:", "http:", "data:"]) {
    if (scriptSrc.sources.includes(scheme)) {
      findings.push({
        severity: "high",
        directive:
          scriptSrc.via === "default-src" ? "default-src" : "script-src",
        title: `Scheme source ${scheme} allows scripts from any ${scheme.replace(":", "")} origin`,
        detail:
          scheme === "data:"
            ? "data: URLs in script-src let an attacker inject and execute arbitrary code via a data: URI. Remove it."
            : `Allowing the bare ${scheme} scheme trusts every ${scheme.replace(":", "")} host. Use an explicit host allowlist instead.`,
      });
    }
  }

  if (scriptHasStrictDynamic) {
    findings.push({
      severity: "info",
      directive: "script-src",
      title: "'strict-dynamic' is in use",
      detail:
        "Trust propagates to scripts loaded by an already-trusted script, and plain host/scheme allowlist entries are ignored. This is the recommended modern pattern when paired with nonces or hashes.",
    });
  }

  if (scriptHasNonce) {
    findings.push({
      severity: "info",
      directive: "script-src",
      title: "Nonce-based script-src detected",
      detail:
        "Ensure the nonce is regenerated per response from a cryptographically secure source — a static or reused nonce provides no protection (not verifiable statically).",
    });
  }

  // --- missing protections ---
  if (!hasDefault) {
    findings.push({
      severity: "medium",
      title: "No default-src fallback",
      detail:
        "Without default-src, any fetch directive you didn't specify is unrestricted. Set default-src 'self' (or 'none') as a baseline and override per directive.",
    });
  }

  const objectSrc = resolveEffective("object-src", map);

  if (!objectSrc.sources.includes("'none'")) {
    findings.push({
      severity: "medium",
      directive: "object-src",
      title: "object-src is not locked down to 'none'",
      detail:
        "Plugins and <object>/<embed> can be an injection vector. Set object-src 'none' unless you specifically need legacy plugin content.",
    });
  }

  if (!map.has("base-uri")) {
    findings.push({
      severity: "medium",
      title: "No base-uri directive",
      detail:
        "base-uri does not fall back to default-src. Without it, an injected <base> tag can rewrite the resolution of relative URLs and bypass nonce-based policies. Set base-uri 'self' or 'none'.",
    });
  }

  if (!map.has("frame-ancestors")) {
    findings.push({
      severity: "medium",
      title: "No frame-ancestors directive (clickjacking)",
      detail:
        "frame-ancestors does not fall back to default-src. Set frame-ancestors 'none' or 'self' to prevent your page being embedded in a malicious frame. It supersedes the legacy X-Frame-Options header.",
    });
  }

  if (!map.has("form-action")) {
    findings.push({
      severity: "low",
      title: "No form-action directive",
      detail:
        "Without form-action, an injected <form> can post to an attacker-controlled endpoint. Set form-action 'self' to restrict form submission targets.",
    });
  }

  // --- style-src ---
  if (
    styleSrc.sources.includes("'unsafe-inline'") &&
    !styleSrc.sources.some(isNonce) &&
    !styleSrc.sources.some(isHash)
  ) {
    findings.push({
      severity: "low",
      directive: "style-src",
      title: "'unsafe-inline' allows inline styles",
      detail:
        "Lower risk than inline script, but inline styles can still enable some data exfiltration and UI redressing. Prefer nonces/hashes where practical.",
    });
  }

  // --- hygiene ---
  if (map.has("report-uri")) {
    if (map.has("report-to")) {
      findings.push({
        severity: "info",
        directive: "report-uri",
        title: "report-uri is deprecated (report-to also present)",
        detail:
          "report-uri is being replaced by report-to. Since both are present, you can drop report-uri once your target browsers support report-to.",
      });
    } else {
      findings.push({
        severity: "info",
        directive: "report-uri",
        title: "report-uri is deprecated",
        detail:
          "report-uri is being replaced by report-to (with a Reporting-Endpoints header). Specify both for the widest browser coverage during the transition.",
      });
    }
  }

  if (map.has("upgrade-insecure-requests")) {
    findings.push({
      severity: "info",
      directive: "upgrade-insecure-requests",
      title: "upgrade-insecure-requests is enabled",
      detail:
        "Insecure HTTP subresource requests are automatically upgraded to HTTPS. Good practice.",
    });
  }

  for (const d of directives) {
    if (!KNOWN_DIRECTIVES.has(d.name)) {
      findings.push({
        severity: "medium",
        directive: d.name,
        title: `Unknown directive "${d.name}"`,
        detail:
          "Browsers silently ignore directives they don't recognise, so a typo here means the protection you intended is not applied. Check the spelling.",
      });
    }

    if (d.duplicate) {
      findings.push({
        severity: "low",
        directive: d.name,
        title: `Duplicate directive "${d.name}" is ignored`,
        detail:
          "Only the first occurrence of a directive in a policy takes effect; this later copy is discarded by the browser.",
      });
    }
  }

  if (!findings.some((f) => f.severity === "high" || f.severity === "medium")) {
    findings.unshift({
      severity: "info",
      title: "No high or medium severity issues found",
      detail:
        "This policy avoids the common CSP weaknesses checked here. Review the effective policy below to confirm it matches your intent.",
    });
  }

  return findings;
}

export function analyzeCsp(raw: string): CspAnalysis {
  const directives = parseCsp(raw);

  return {
    directives,
    findings: directives.length ? auditCsp(directives) : [],
    effective: directives.length ? buildEffective(directives) : [],
  };
}

export const SEVERITY_ORDER: Record<Severity, number> = {
  high: 0,
  medium: 1,
  low: 2,
  info: 3,
};
