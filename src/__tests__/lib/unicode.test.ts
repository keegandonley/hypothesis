import { describe, expect, it } from "vitest";
import {
  toUtf8Hex,
  toUtf16Hex,
  getCategory,
  getScript,
  getHtmlEntity,
  getDisplayChar,
  analyzeText,
} from "@/lib/unicode";

describe("toUtf8Hex", () => {
  it("encodes ASCII 'A'", () => {
    expect(toUtf8Hex(65)).toBe("41");
  });

  it("encodes é (U+00E9)", () => {
    expect(toUtf8Hex(233)).toBe("C3 A9");
  });

  it("encodes emoji (U+1F600)", () => {
    expect(toUtf8Hex(128512)).toBe("F0 9F 98 80");
  });
});

describe("toUtf16Hex", () => {
  it("encodes ASCII 'A'", () => {
    expect(toUtf16Hex("A")).toBe("0041");
  });

  it("encodes é", () => {
    expect(toUtf16Hex("é")).toBe("00E9");
  });
});

describe("getCategory", () => {
  it("identifies uppercase letter", () => {
    expect(getCategory("A")).toContain("Uppercase");
  });

  it("identifies lowercase letter", () => {
    expect(getCategory("a")).toContain("Lowercase");
  });

  it("identifies digit", () => {
    expect(getCategory("5")).toContain("Decimal");
  });

  it("identifies space", () => {
    expect(getCategory(" ")).toContain("Space");
  });

  it("identifies punctuation", () => {
    expect(getCategory("!")).toContain("Punctuation");
  });
});

describe("getScript", () => {
  it("identifies Latin", () => {
    expect(getScript("A")).toBe("Latin");
  });

  it("identifies Han", () => {
    expect(getScript("中")).toBe("Han");
  });

  it("identifies Cyrillic", () => {
    expect(getScript("Д")).toBe("Cyrillic");
  });
});

describe("getHtmlEntity", () => {
  it("returns named entity when available", () => {
    expect(getHtmlEntity(38)).toBe("&amp;");
  });

  it("returns hex numeric entity otherwise", () => {
    expect(getHtmlEntity(128512)).toBe("&#x1F600;");
  });
});

describe("getDisplayChar", () => {
  it("shows control chars as ␣", () => {
    expect(getDisplayChar("\x00", 0)).toBe("␣");
  });

  it("shows space as ·", () => {
    expect(getDisplayChar(" ", 32)).toBe("·");
  });

  it("shows printable chars as themselves", () => {
    expect(getDisplayChar("A", 65)).toBe("A");
  });
});

describe("analyzeText", () => {
  it("analyzes a simple string", () => {
    const { chars, truncated } = analyzeText("ABC");

    expect(chars).toHaveLength(3);
    expect(truncated).toBe(false);
    expect(chars[0].char).toBe("A");
    expect(chars[0].codePoint).toBe("U+0041");
    expect(chars[0].decimal).toBe("65");
  });

  it("returns empty array for empty string", () => {
    const { chars } = analyzeText("");

    expect(chars).toEqual([]);
  });
});
