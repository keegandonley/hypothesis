import { describe, expect, it } from "vitest";
import {
  parseNumeric,
  parseSymbolic,
  toSymbolic,
  toNumeric,
  detectInput,
} from "@/lib/chmod";

describe("parseNumeric", () => {
  it("parses 755", () => {
    expect(parseNumeric("755")).toEqual([7, 5, 5]);
  });

  it("parses 644", () => {
    expect(parseNumeric("644")).toEqual([6, 4, 4]);
  });

  it("parses 000", () => {
    expect(parseNumeric("000")).toEqual([0, 0, 0]);
  });

  it("parses 777", () => {
    expect(parseNumeric("777")).toEqual([7, 7, 7]);
  });

  it("returns null for invalid characters", () => {
    expect(parseNumeric("888")).toBeNull();
  });

  it("returns null for too-short input", () => {
    expect(parseNumeric("75")).toBeNull();
  });

  it("returns null for too-long input", () => {
    expect(parseNumeric("7555")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseNumeric("")).toBeNull();
  });

  it("trims whitespace", () => {
    expect(parseNumeric(" 755 ")).toEqual([7, 5, 5]);
  });
});

describe("parseSymbolic", () => {
  it("parses rwxr-xr-x", () => {
    expect(parseSymbolic("rwxr-xr-x")).toEqual([7, 5, 5]);
  });

  it("parses rw-r--r--", () => {
    expect(parseSymbolic("rw-r--r--")).toEqual([6, 4, 4]);
  });

  it("parses ---------", () => {
    expect(parseSymbolic("---------")).toEqual([0, 0, 0]);
  });

  it("parses rwxrwxrwx", () => {
    expect(parseSymbolic("rwxrwxrwx")).toEqual([7, 7, 7]);
  });

  it("is case-insensitive", () => {
    expect(parseSymbolic("RWXR-XR-X")).toEqual([7, 5, 5]);
  });

  it("returns null for too-short input", () => {
    expect(parseSymbolic("rwxr-x")).toBeNull();
  });

  it("returns null for invalid characters", () => {
    expect(parseSymbolic("rwxr-xr-xy")).toBeNull();
  });
});

describe("toSymbolic", () => {
  it("converts [7, 5, 5]", () => {
    expect(toSymbolic([7, 5, 5])).toBe("rwxr-xr-x");
  });

  it("converts [6, 4, 4]", () => {
    expect(toSymbolic([6, 4, 4])).toBe("rw-r--r--");
  });

  it("converts [0, 0, 0]", () => {
    expect(toSymbolic([0, 0, 0])).toBe("---------");
  });
});

describe("toNumeric", () => {
  it("converts [7, 5, 5]", () => {
    expect(toNumeric([7, 5, 5])).toBe("755");
  });

  it("converts [6, 4, 4]", () => {
    expect(toNumeric([6, 4, 4])).toBe("644");
  });
});

describe("detectInput", () => {
  it("detects numeric", () => {
    expect(detectInput("755")).toBe("numeric");
  });

  it("detects symbolic", () => {
    expect(detectInput("rwxr-xr-x")).toBe("symbolic");
  });

  it("detects unknown", () => {
    expect(detectInput("hello")).toBe("unknown");
  });

  it("detects unknown for empty input", () => {
    expect(detectInput("")).toBe("unknown");
  });
});

describe("round-trip", () => {
  const cases = ["755", "644", "777", "000", "700", "666"];
  for (const mode of cases) {
    it(`numeric ${mode} round-trips through symbolic`, () => {
      const perms = parseNumeric(mode)!;
      expect(parseSymbolic(toSymbolic(perms))).toEqual(perms);
    });
  }
});
