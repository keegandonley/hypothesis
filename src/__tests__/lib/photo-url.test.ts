import { describe, expect, it } from "vitest";

import {
  buildGenPhotoPath,
  buildIdPhotoPath,
  extensionForFormat,
  MAX_SIZE,
  parsePhotoRequest,
  type ParsedPhotoRequest,
} from "@/lib/photo-url";

type PhotoImagePlan = Extract<ParsedPhotoRequest, { kind: "image" }>;

/** Narrow to a render plan, failing loudly when the parser errored instead. */
function expectImage(parsed: ParsedPhotoRequest): PhotoImagePlan {
  if (parsed.kind !== "image") {
    throw new Error(
      `expected an image plan, got ${parsed.kind}${
        parsed.kind === "error" ? `: ${parsed.message}` : ""
      }`,
    );
  }

  return parsed;
}

function parse(
  path: string,
  query: Record<string, string> = {},
): ParsedPhotoRequest {
  return parsePhotoRequest(path.split("/").filter(Boolean), query);
}

// ---------------------------------------------------------------------------
// photo mode (regression cover for the pre-existing grammar)
// ---------------------------------------------------------------------------

describe("parsePhotoRequest — photo mode", () => {
  it("treats a bare size as a random request", () => {
    expect(parse("600/400")).toMatchObject({
      kind: "redirect-random",
      width: 600,
      height: 400,
      format: "jpeg",
    });
  });

  it("parses id and seed selectors", () => {
    expect(expectImage(parse("id/7/300")).selector).toEqual({
      type: "id",
      id: 7,
    });
    expect(expectImage(parse("seed/hero/300")).selector).toEqual({
      type: "seed",
      seed: "hero",
    });
  });

  it("defaults to jpeg and honours .webp", () => {
    expect(expectImage(parse("id/7/300")).format).toBe("jpeg");
    expect(expectImage(parse("id/7/300.webp")).format).toBe("webp");
  });

  it("rejects sizes outside the bounds", () => {
    expect(parse(`id/7/${MAX_SIZE + 1}`)).toMatchObject({
      kind: "error",
      status: 400,
    });
    expect(parse("id/7/0")).toMatchObject({ kind: "error", status: 400 });
  });
});

// ---------------------------------------------------------------------------
// gen mode
// ---------------------------------------------------------------------------

describe("parsePhotoRequest — gen mode", () => {
  it("parses a seeded square and a seeded rectangle", () => {
    const square = expectImage(parse("gen/hero/400"));

    expect(square.selector).toEqual({
      type: "gen",
      seed: "hero",
      style: "gradient",
    });
    expect(square.width).toBe(400);
    expect(square.height).toBe(400);

    const rect = expectImage(parse("gen/hero/600/400"));

    expect(rect.width).toBe(600);
    expect(rect.height).toBe(400);
  });

  it("defaults to svg and honours raster extensions", () => {
    expect(expectImage(parse("gen/hero/400")).format).toBe("svg");
    expect(expectImage(parse("gen/hero/400.svg")).format).toBe("svg");
    expect(expectImage(parse("gen/hero/400.jpg")).format).toBe("jpeg");
    expect(expectImage(parse("gen/hero/400.webp")).format).toBe("webp");
  });

  it("requires a seed — there is no random gen form", () => {
    expect(parse("gen")).toMatchObject({ kind: "error", status: 400 });
    // `gen/400` reads as seed "400" with no size segment, which is still an
    // error — the arity is what makes the grammar unambiguous.
    expect(parse("gen/400")).toMatchObject({ kind: "error", status: 400 });
  });

  it("treats a numeric seed as a seed, never as a size", () => {
    const parsed = expectImage(parse("gen/600/400/300"));

    expect(parsed.selector).toMatchObject({ type: "gen", seed: "600" });
    expect(parsed.width).toBe(400);
    expect(parsed.height).toBe(300);
  });

  it("reads ?style and defaults to gradient", () => {
    expect(expectImage(parse("gen/hero/400")).selector).toMatchObject({
      style: "gradient",
    });

    for (const style of ["gradient", "label", "bauhaus", "noise"]) {
      expect(
        expectImage(parse("gen/hero/400", { style })).selector,
      ).toMatchObject({ style });
    }
  });

  it("accepts a style in any case and rejects an unknown one", () => {
    expect(
      expectImage(parse("gen/hero/400", { style: "BAUHAUS" })).selector,
    ).toMatchObject({ style: "bauhaus" });

    expect(parse("gen/hero/400", { style: "spirograph" })).toMatchObject({
      kind: "error",
      status: 400,
    });
  });

  it("does not echo the rejected style value back to the caller", () => {
    const parsed = parse("gen/hero/400", {
      style: "<script>alert(1)</script>",
    });

    expect(parsed.kind).toBe("error");
    expect(parsed.kind === "error" && parsed.message).not.toContain("script");
  });

  it("still applies grayscale and blur", () => {
    const parsed = expectImage(
      parse("gen/hero/400", { grayscale: "", blur: "5" }),
    );

    expect(parsed.grayscale).toBe(true);
    expect(parsed.blur).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// svg is gen-only
// ---------------------------------------------------------------------------

describe("the .svg extension", () => {
  it("is rejected on photo-mode URLs", () => {
    for (const path of ["id/7/300.svg", "seed/hero/300.svg", "300.svg"]) {
      expect(parse(path)).toMatchObject({ kind: "error", status: 400 });
    }
  });

  it("explains itself when rejected", () => {
    const parsed = parse("id/7/300.svg");

    expect(parsed.kind === "error" && parsed.message).toMatch(/procedural/i);
  });

  it("round-trips through extensionForFormat", () => {
    expect(extensionForFormat("svg")).toBe("svg");
    expect(extensionForFormat("webp")).toBe("webp");
    expect(extensionForFormat("jpeg")).toBe("jpg");
  });
});

// ---------------------------------------------------------------------------
// seed handling
// ---------------------------------------------------------------------------

describe("gen seed sanitization", () => {
  it("caps the seed by codepoint", () => {
    const parsed = expectImage(parse(`gen/${"a".repeat(500)}/400`));

    expect(parsed.selector.type === "gen" && parsed.selector.seed.length).toBe(
      100,
    );
  });

  it("drops lone surrogates so the seed stays encodable", () => {
    const parsed = expectImage(parse("gen/a\ud800b/400"));
    const seed = parsed.selector.type === "gen" ? parsed.selector.seed : "";

    expect(seed).toBe("ab");
    expect(() => encodeURIComponent(seed)).not.toThrow();
  });

  it("keeps astral characters intact", () => {
    const parsed = expectImage(parse("gen/a\u{1f600}b/400"));

    expect(parsed.selector.type === "gen" && parsed.selector.seed).toBe(
      "a\u{1f600}b",
    );
  });
});

// ---------------------------------------------------------------------------
// path builders
// ---------------------------------------------------------------------------

describe("buildGenPhotoPath", () => {
  const target = { width: 600, height: 400 } as const;

  it("builds a canonical gen URL", () => {
    expect(buildGenPhotoPath("hero", { ...target, format: "svg" })).toBe(
      "/photo/gen/hero/600/400.svg",
    );
    expect(buildGenPhotoPath("hero", { ...target, format: "jpeg" })).toBe(
      "/photo/gen/hero/600/400.jpg",
    );
  });

  it("encodes seeds that need it", () => {
    expect(buildGenPhotoPath("a b/c?d", { ...target, format: "svg" })).toBe(
      "/photo/gen/a%20b%2Fc%3Fd/600/400.svg",
    );
  });

  it("carries query params across, minus Next's catch-all key", () => {
    const built = buildGenPhotoPath(
      "hero",
      { ...target, format: "svg" },
      {
        style: "noise",
        grayscale: "",
        path: ["gen", "hero", "600", "400"],
      },
    );

    expect(built).toContain("style=noise");
    expect(built).toContain("grayscale");
    expect(built).not.toContain("path=");
  });

  it("round-trips back through the parser", () => {
    const built = buildGenPhotoPath("hero", { ...target, format: "jpeg" });
    const parsed = expectImage(
      parse(built.replace("/photo/", ""), { style: "bauhaus" }),
    );

    expect(parsed.selector).toEqual({
      type: "gen",
      seed: "hero",
      style: "bauhaus",
    });
    expect(parsed.format).toBe("jpeg");
  });
});

describe("buildIdPhotoPath", () => {
  it("is unaffected by the gen grammar", () => {
    expect(
      buildIdPhotoPath(3, { width: 600, height: 400, format: "jpeg" }),
    ).toBe("/photo/id/3/600/400.jpg");
  });
});

// ---------------------------------------------------------------------------
// raster sizes
// ---------------------------------------------------------------------------

describe("gen raster sizes", () => {
  it("accepts every style as a raster at the global maximum", () => {
    for (const style of ["gradient", "label", "bauhaus", "noise"]) {
      expect(
        expectImage(parse("gen/hero/1600/1600.jpg", { style })).format,
      ).toBe("jpeg");
      expect(
        expectImage(parse("gen/hero/1600/1600.webp", { style })).format,
      ).toBe("webp");
    }
  });

  it("still enforces the global size bound", () => {
    expect(parse("gen/hero/1601/1601.jpg", { style: "noise" })).toMatchObject({
      kind: "error",
      status: 400,
    });
  });
});
