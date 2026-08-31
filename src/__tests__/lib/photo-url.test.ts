import { describe, expect, it } from "vitest";
import {
  buildIdPhotoPath,
  buildSeededPhotoPath,
  extensionForFormat,
  hashSeed,
  MAX_SEED_LENGTH,
  MAX_SIZE,
  parsePhotoRequest,
  photoIndexForSeed,
  USAGE_MESSAGE,
  type ParsedPhotoRequest,
} from "@/lib/photo-url";

function expectImage(
  result: ParsedPhotoRequest,
): Extract<ParsedPhotoRequest, { kind: "image" }> {
  if (result.kind !== "image") {
    throw new Error(`expected an image result, got ${result.kind}`);
  }

  return result;
}

function expectSeed(result: ParsedPhotoRequest): string {
  const { selector } = expectImage(result);

  if (selector.type !== "seed") {
    throw new Error(`expected a seed selector, got ${selector.type}`);
  }

  return selector.seed;
}

function expectId(result: ParsedPhotoRequest): number {
  const { selector } = expectImage(result);

  if (selector.type !== "id") {
    throw new Error(`expected an id selector, got ${selector.type}`);
  }

  return selector.id;
}

function expectRedirect(
  result: ParsedPhotoRequest,
): Extract<ParsedPhotoRequest, { kind: "redirect-random" }> {
  if (result.kind !== "redirect-random") {
    throw new Error(`expected a redirect result, got ${result.kind}`);
  }

  return result;
}

function expectError(
  result: ParsedPhotoRequest,
): Extract<ParsedPhotoRequest, { kind: "error" }> {
  if (result.kind !== "error") {
    throw new Error(`expected an error result, got ${result.kind}`);
  }

  return result;
}

describe("parsePhotoRequest — random (unselected) forms", () => {
  it("treats a single size as a square redirect", () => {
    const result = expectRedirect(parsePhotoRequest(["300"]));

    expect(result).toEqual({
      kind: "redirect-random",
      width: 300,
      height: 300,
      format: "jpeg",
    });
  });

  it("parses width and height", () => {
    const result = expectRedirect(parsePhotoRequest(["300", "200"]));

    expect(result.width).toBe(300);
    expect(result.height).toBe(200);
  });

  it("keeps the extension", () => {
    expect(expectRedirect(parsePhotoRequest(["300.webp"])).format).toBe("webp");
  });

  it("carries no render options — the route rebuilds them from the query", () => {
    const result = expectRedirect(
      parsePhotoRequest(["300"], { grayscale: "", blur: "4" }),
    );

    expect(result).not.toHaveProperty("grayscale");
    expect(result).not.toHaveProperty("blur");
  });
});

describe("parsePhotoRequest — id forms", () => {
  it("parses a square id request", () => {
    const result = expectImage(parsePhotoRequest(["id", "7", "300"]));

    expect(result).toEqual({
      kind: "image",
      selector: { type: "id", id: 7 },
      width: 300,
      height: 300,
      format: "jpeg",
      grayscale: false,
      blur: null,
    });
  });

  it("parses an id request with width and height", () => {
    const result = expectImage(parsePhotoRequest(["id", "0", "640", "480"]));

    expect(result.width).toBe(640);
    expect(result.height).toBe(480);
  });

  it("accepts id 0", () => {
    expect(expectId(parsePhotoRequest(["id", "0", "100"]))).toBe(0);
  });

  it("accepts leading zeros", () => {
    expect(expectId(parsePhotoRequest(["id", "007", "100"]))).toBe(7);
  });

  it("matches the id keyword case-insensitively", () => {
    expect(expectId(parsePhotoRequest(["ID", "3", "100"]))).toBe(3);
  });

  it("carries render options", () => {
    const result = expectImage(
      parsePhotoRequest(["id", "3", "100.webp"], { grayscale: "", blur: "2" }),
    );

    expect(result.format).toBe("webp");
    expect(result.grayscale).toBe(true);
    expect(result.blur).toBe(2);
  });

  it.each(["abc", "-1", "1.5", "1e3", " 2"])("rejects id %j", (id) => {
    const result = expectError(parsePhotoRequest(["id", id, "100"]));

    expect(result.status).toBe(400);
    expect(result.message).toContain("whole number");
  });

  it("rejects a bare /id", () => {
    expect(expectError(parsePhotoRequest(["id"])).status).toBe(400);
  });

  it("rejects an id request with no size", () => {
    expect(expectError(parsePhotoRequest(["id", "3"])).status).toBe(400);
  });

  it("rejects an unsafe integer id", () => {
    expect(
      expectError(parsePhotoRequest(["id", "9".repeat(30), "100"])).status,
    ).toBe(400);
  });
});

describe("parsePhotoRequest — seeded forms", () => {
  it("parses a square seeded request", () => {
    const result = expectImage(parsePhotoRequest(["seed", "abc", "300"]));

    expect(result).toEqual({
      kind: "image",
      selector: { type: "seed", seed: "abc" },
      width: 300,
      height: 300,
      format: "jpeg",
      grayscale: false,
      blur: null,
    });
  });

  it("parses a seeded width/height request", () => {
    const result = expectImage(
      parsePhotoRequest(["seed", "abc", "640", "480"]),
    );

    expect(result.width).toBe(640);
    expect(result.height).toBe(480);
  });

  it("accepts any characters in a seed", () => {
    expect(expectSeed(parsePhotoRequest(["seed", "a b/💡!$-_.~", "100"]))).toBe(
      "a b/💡!$-_.~",
    );
  });

  it("caps the seed at 100 characters", () => {
    expect(
      expectSeed(parsePhotoRequest(["seed", "x".repeat(250), "100"])),
    ).toHaveLength(MAX_SEED_LENGTH);
  });

  it("caps by codepoint, not UTF-16 code unit", () => {
    const seed = expectSeed(
      parsePhotoRequest(["seed", "💡".repeat(150), "100"]),
    );

    expect(Array.from(seed)).toHaveLength(MAX_SEED_LENGTH);
    // Each astral char is two code units, and none was cut in half.
    expect(seed).toHaveLength(MAX_SEED_LENGTH * 2);
    expect(seed.endsWith("💡")).toBe(true);
  });

  it("leaves a truncated astral seed safe to rebuild into a URL", () => {
    const seed = expectSeed(
      // An odd codepoint count so a code-unit slice would land mid-surrogate.
      parsePhotoRequest(["seed", `x${"💡".repeat(150)}`, "100"]),
    );

    expect(() => encodeURIComponent(seed)).not.toThrow();
    expect(
      buildSeededPhotoPath(seed, {
        width: 100,
        height: 100,
        format: "jpeg",
      }),
    ).toContain(encodeURIComponent(seed));
  });

  it("leaves a short seed untouched", () => {
    expect(expectSeed(parsePhotoRequest(["seed", "💡💡", "100"]))).toBe("💡💡");
  });

  it("drops a lone surrogate present in the raw input", () => {
    const seed = expectSeed(
      parsePhotoRequest(["seed", "a\uD83Db\uDC00c", "100"]),
    );

    expect(seed).toBe("abc");
  });

  it("keeps a well-formed pair while dropping an adjacent lone surrogate", () => {
    expect(expectSeed(parsePhotoRequest(["seed", "\uD83D💡", "100"]))).toBe(
      "💡",
    );
  });

  it("returns a seed that survives an encodeURIComponent round-trip", () => {
    const seed = expectSeed(
      parsePhotoRequest(["seed", `x\uD83D${"💡".repeat(150)}`, "100"]),
    );

    expect(() => encodeURIComponent(seed)).not.toThrow();
    expect(
      buildSeededPhotoPath(seed, {
        width: 100,
        height: 100,
        format: "jpeg",
      }),
    ).toBe(`/photo/seed/${encodeURIComponent(seed)}/100/100.jpg`);
  });

  it("treats an all-surrogate seed as a missing seed", () => {
    const result = expectError(
      parsePhotoRequest(["seed", "\uD83D\uD83D", "100"]),
    );

    expect(result.status).toBe(400);
    expect(result.message).toContain("Missing seed");
  });

  it("treats a purely numeric seed as a seed, not a size", () => {
    const result = expectImage(parsePhotoRequest(["seed", "42", "100"]));

    expect(expectSeed(result)).toBe("42");
    expect(result.width).toBe(100);
  });

  it("treats a seed named 'id' as a seed", () => {
    expect(expectSeed(parsePhotoRequest(["seed", "id", "100"]))).toBe("id");
  });

  it("matches the seed keyword case-insensitively", () => {
    expect(expectSeed(parsePhotoRequest(["SEED", "abc", "100"]))).toBe("abc");
  });

  it("rejects a missing seed", () => {
    expect(expectError(parsePhotoRequest(["seed"])).status).toBe(400);
    expect(expectError(parsePhotoRequest(["seed", "", "100"])).status).toBe(
      400,
    );
  });

  it("rejects a seeded request with no size", () => {
    expect(expectError(parsePhotoRequest(["seed", "abc"])).status).toBe(400);
  });

  it("rejects too many segments after the seed", () => {
    expect(
      expectError(parsePhotoRequest(["seed", "abc", "1", "2", "3"])).status,
    ).toBe(400);
  });
});

describe("parsePhotoRequest — extensions", () => {
  it("defaults to jpeg", () => {
    expect(expectImage(parsePhotoRequest(["seed", "a", "100"])).format).toBe(
      "jpeg",
    );
  });

  it("accepts .jpg", () => {
    expect(
      expectImage(parsePhotoRequest(["seed", "a", "100.jpg"])).format,
    ).toBe("jpeg");
  });

  it("accepts .jpeg", () => {
    expect(
      expectImage(parsePhotoRequest(["seed", "a", "100.jpeg"])).format,
    ).toBe("jpeg");
  });

  it("accepts .webp", () => {
    expect(
      expectImage(parsePhotoRequest(["seed", "a", "100.webp"])).format,
    ).toBe("webp");
  });

  it("accepts an uppercase extension", () => {
    expect(
      expectImage(parsePhotoRequest(["seed", "a", "100.WEBP"])).format,
    ).toBe("webp");
  });

  it("accepts an extension on the height segment", () => {
    const result = expectImage(
      parsePhotoRequest(["seed", "a", "300", "200.webp"]),
    );

    expect(result.height).toBe(200);
    expect(result.format).toBe("webp");
  });

  it("rejects an unknown extension", () => {
    const result = expectError(parsePhotoRequest(["seed", "a", "100.png"]));

    expect(result.status).toBe(400);
    expect(result.message).toContain("png");
  });

  it("rejects an extension on the width segment", () => {
    expect(
      expectError(parsePhotoRequest(["seed", "a", "300.jpg", "200"])).status,
    ).toBe(400);
  });

  it("rejects a decimal size as a bad extension", () => {
    const result = expectError(parsePhotoRequest(["seed", "a", "10.5"]));

    expect(result.status).toBe(400);
    expect(result.message).toContain("Unsupported extension");
  });

  it("rejects a trailing dot", () => {
    expect(expectError(parsePhotoRequest(["seed", "a", "100."])).status).toBe(
      400,
    );
  });
});

describe("parsePhotoRequest — size validation", () => {
  it("caps sizes at 1600", () => {
    expect(MAX_SIZE).toBe(1600);
  });

  it("accepts the boundaries", () => {
    expect(expectImage(parsePhotoRequest(["seed", "a", "1"])).width).toBe(1);
    expect(
      expectImage(parsePhotoRequest(["seed", "a", String(MAX_SIZE)])).width,
    ).toBe(MAX_SIZE);
  });

  it.each(["0", "1601", "3000", "-5", "abc", "12abc", "1e3", " 100"])(
    "rejects size %j",
    (size) => {
      const result = expectError(parsePhotoRequest(["seed", "a", size]));

      expect(result.status).toBe(400);
      expect(result.message).toContain(String(MAX_SIZE));
    },
  );

  it("rejects an out-of-range height", () => {
    expect(
      expectError(parsePhotoRequest(["seed", "a", "100", "9000"])).status,
    ).toBe(400);
  });

  it("rejects an oversized random request too", () => {
    expect(expectError(parsePhotoRequest(["2000"])).status).toBe(400);
  });
});

describe("parsePhotoRequest — grayscale", () => {
  it("is off when absent", () => {
    expect(expectImage(parsePhotoRequest(["seed", "a", "100"])).grayscale).toBe(
      false,
    );
  });

  it("is on for a bare param", () => {
    expect(
      expectImage(parsePhotoRequest(["seed", "a", "100"], { grayscale: "" }))
        .grayscale,
    ).toBe(true);
  });

  it.each(["1", "true", "false", "0", "anything"])(
    "is on for any value (%j)",
    (value) => {
      expect(
        expectImage(
          parsePhotoRequest(["seed", "a", "100"], { grayscale: value }),
        ).grayscale,
      ).toBe(true);
    },
  );
});

describe("parsePhotoRequest — blur", () => {
  it("is null when absent", () => {
    expect(expectImage(parsePhotoRequest(["seed", "a", "100"])).blur).toBe(
      null,
    );
  });

  it("defaults to 1 for a bare param", () => {
    expect(
      expectImage(parsePhotoRequest(["seed", "a", "100"], { blur: "" })).blur,
    ).toBe(1);
  });

  it("reads an integer value", () => {
    expect(
      expectImage(parsePhotoRequest(["seed", "a", "100"], { blur: "7" })).blur,
    ).toBe(7);
  });

  it("clamps below the minimum", () => {
    expect(
      expectImage(parsePhotoRequest(["seed", "a", "100"], { blur: "0" })).blur,
    ).toBe(1);
    expect(
      expectImage(parsePhotoRequest(["seed", "a", "100"], { blur: "-4" })).blur,
    ).toBe(1);
  });

  it("clamps above the maximum", () => {
    expect(
      expectImage(parsePhotoRequest(["seed", "a", "100"], { blur: "99" })).blur,
    ).toBe(10);
  });

  it.each(["abc", "1.5", "2px", "NaN"])("rejects blur %j", (value) => {
    const result = expectError(
      parsePhotoRequest(["seed", "a", "100"], { blur: value }),
    );

    expect(result.status).toBe(400);
    expect(result.message).toContain("blur");
  });

  it("uses the last value when the param repeats", () => {
    expect(
      expectImage(parsePhotoRequest(["seed", "a", "100"], { blur: ["2", "5"] }))
        .blur,
    ).toBe(5);
  });

  it("rejects a bad blur even on a random request", () => {
    expect(
      expectError(parsePhotoRequest(["300"], { blur: "huge" })).status,
    ).toBe(400);
  });
});

describe("parsePhotoRequest — unrecognized params and bad paths", () => {
  it("ignores unknown query params", () => {
    const result = expectImage(
      parsePhotoRequest(["seed", "a", "100"], { random: "2", foo: "bar" }),
    );

    expect(result.grayscale).toBe(false);
    expect(result.blur).toBe(null);
  });

  it("errors with usage text on an empty path", () => {
    const result = expectError(parsePhotoRequest(undefined));

    expect(result.status).toBe(400);
    expect(result.message).toBe(USAGE_MESSAGE);
    expect(expectError(parsePhotoRequest([])).message).toBe(USAGE_MESSAGE);
  });

  it("lists every URL form in the usage text", () => {
    expect(USAGE_MESSAGE).toContain("/photo/id/{n}/{size}");
    expect(USAGE_MESSAGE).toContain("/photo/seed/{seed}/{size}");
  });

  it("ignores empty segments", () => {
    expect(expectImage(parsePhotoRequest(["seed", "a", "100", ""])).width).toBe(
      100,
    );
  });

  it("rejects three unselected segments", () => {
    expect(expectError(parsePhotoRequest(["1", "2", "3"])).status).toBe(400);
  });
});

describe("extensionForFormat", () => {
  it("maps formats to file extensions", () => {
    expect(extensionForFormat("jpeg")).toBe("jpg");
    expect(extensionForFormat("webp")).toBe("webp");
  });
});

describe("buildIdPhotoPath", () => {
  const base = { width: 300, height: 200, format: "jpeg" } as const;

  it("builds a canonical id path", () => {
    expect(buildIdPhotoPath(4, base)).toBe("/photo/id/4/300/200.jpg");
  });

  it("uses the webp extension", () => {
    expect(buildIdPhotoPath(0, { ...base, format: "webp" })).toBe(
      "/photo/id/0/300/200.webp",
    );
  });

  it("round-trips through the parser", () => {
    const path = buildIdPhotoPath(9, { ...base, format: "webp" });
    const segments = path.replace("/photo/", "").split("/");
    const result = expectImage(parsePhotoRequest(segments));

    expect(result.selector).toEqual({ type: "id", id: 9 });
    expect(result.width).toBe(300);
    expect(result.height).toBe(200);
    expect(result.format).toBe("webp");
  });

  it("preserves query params, including unknown ones", () => {
    expect(
      buildIdPhotoPath(4, base, {
        path: ["300"],
        grayscale: "",
        blur: "3",
        random: "2",
      }),
    ).toBe("/photo/id/4/300/200.jpg?grayscale&blur=3&random=2");
  });
});

describe("buildSeededPhotoPath", () => {
  const base = { width: 300, height: 200, format: "jpeg" } as const;

  it("builds a canonical seeded path", () => {
    expect(buildSeededPhotoPath("abc", base)).toBe(
      "/photo/seed/abc/300/200.jpg",
    );
  });

  it("uses the webp extension", () => {
    expect(buildSeededPhotoPath("abc", { ...base, format: "webp" })).toBe(
      "/photo/seed/abc/300/200.webp",
    );
  });

  it("encodes the seed", () => {
    expect(buildSeededPhotoPath("a b/c", base)).toBe(
      "/photo/seed/a%20b%2Fc/300/200.jpg",
    );
  });

  it("drops the catch-all path key from the query", () => {
    expect(buildSeededPhotoPath("abc", base, { path: ["300", "200"] })).toBe(
      "/photo/seed/abc/300/200.jpg",
    );
  });

  it("preserves query params, including unknown ones", () => {
    expect(
      buildSeededPhotoPath("abc", base, {
        path: ["300"],
        grayscale: "",
        blur: "3",
        random: "2",
      }),
    ).toBe("/photo/seed/abc/300/200.jpg?grayscale&blur=3&random=2");
  });

  it("expands repeated params and encodes values", () => {
    expect(buildSeededPhotoPath("abc", base, { tag: ["a b", "c&d"] })).toBe(
      "/photo/seed/abc/300/200.jpg?tag=a%20b&tag=c%26d",
    );
  });

  it("skips undefined values", () => {
    expect(buildSeededPhotoPath("abc", base, { blur: undefined })).toBe(
      "/photo/seed/abc/300/200.jpg",
    );
  });
});

describe("hashSeed", () => {
  it("is deterministic", () => {
    expect(hashSeed("hello")).toBe(hashSeed("hello"));
  });

  it("returns a known FNV-1a value", () => {
    expect(hashSeed("hello")).toBe(0x4f9f2cab);
  });

  it("returns an unsigned 32-bit integer", () => {
    for (const seed of ["", "a", "sunset", "💡", "x".repeat(100)]) {
      const hash = hashSeed(seed);

      expect(Number.isInteger(hash)).toBe(true);
      expect(hash).toBeGreaterThanOrEqual(0);
      expect(hash).toBeLessThanOrEqual(0xffffffff);
    }
  });

  it("differs for different seeds", () => {
    expect(hashSeed("a")).not.toBe(hashSeed("b"));
  });
});

describe("photoIndexForSeed", () => {
  it("stays in range", () => {
    for (let i = 0; i < 200; i++) {
      const index = photoIndexForSeed(`seed-${i}`, 7);

      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(7);
    }
  });

  it("is deterministic", () => {
    expect(photoIndexForSeed("abc", 12)).toBe(photoIndexForSeed("abc", 12));
  });

  it("returns 0 for an empty library", () => {
    expect(photoIndexForSeed("abc", 0)).toBe(0);
  });

  it("spreads seeds across the library", () => {
    const seen = new Set<number>();

    for (let i = 0; i < 100; i++) {
      seen.add(photoIndexForSeed(`seed-${i}`, 5));
    }

    expect(seen.size).toBe(5);
  });
});
