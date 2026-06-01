import { describe, expect, it } from "vitest";
import {
  splitWords,
  toCamel,
  toPascal,
  toSnake,
  toKebab,
  toScreaming,
  toTitle,
  toLower,
  toUpper,
  toDot,
  CASES,
} from "@/lib/case";

describe("splitWords", () => {
  it("splits space-separated words", () => {
    expect(splitWords("hello world")).toEqual(["hello", "world"]);
  });

  it("splits camelCase", () => {
    expect(splitWords("helloWorld")).toEqual(["hello", "World"]);
  });

  it("splits PascalCase", () => {
    expect(splitWords("HelloWorld")).toEqual(["Hello", "World"]);
  });

  it("splits snake_case", () => {
    expect(splitWords("hello_world")).toEqual(["hello", "world"]);
  });

  it("splits kebab-case", () => {
    expect(splitWords("hello-world")).toEqual(["hello", "world"]);
  });

  it("handles mixed separators", () => {
    expect(splitWords("hello-World_test")).toEqual(["hello", "World", "test"]);
  });

  it("returns empty array for empty string", () => {
    expect(splitWords("")).toEqual([]);
  });

  it("handles consecutive separators", () => {
    expect(splitWords("hello__world")).toEqual(["hello", "world"]);
  });
});

describe("toCamel", () => {
  it("converts words to camelCase", () => {
    expect(toCamel(["hello", "world"])).toBe("helloWorld");
  });

  it("handles single word", () => {
    expect(toCamel(["Hello"])).toBe("hello");
  });
});

describe("toPascal", () => {
  it("converts words to PascalCase", () => {
    expect(toPascal(["hello", "world"])).toBe("HelloWorld");
  });
});

describe("toSnake", () => {
  it("converts words to snake_case", () => {
    expect(toSnake(["hello", "world"])).toBe("hello_world");
  });
});

describe("toKebab", () => {
  it("converts words to kebab-case", () => {
    expect(toKebab(["hello", "world"])).toBe("hello-world");
  });
});

describe("toScreaming", () => {
  it("converts words to SCREAMING_SNAKE", () => {
    expect(toScreaming(["hello", "world"])).toBe("HELLO_WORLD");
  });
});

describe("toTitle", () => {
  it("converts words to Title Case", () => {
    expect(toTitle(["hello", "world"])).toBe("Hello World");
  });
});

describe("toLower", () => {
  it("converts words to lowercase", () => {
    expect(toLower(["Hello", "World"])).toBe("hello world");
  });
});

describe("toUpper", () => {
  it("converts words to UPPERCASE", () => {
    expect(toUpper(["hello", "world"])).toBe("HELLO WORLD");
  });
});

describe("toDot", () => {
  it("converts words to dot.case", () => {
    expect(toDot(["hello", "world"])).toBe("hello.world");
  });
});

describe("CASES", () => {
  it("has all 9 case conversions", () => {
    const words = splitWords("helloWorld");
    expect(CASES).toHaveLength(9);
    expect(CASES[0].fn(words)).toBe("helloWorld");
    expect(CASES[1].fn(words)).toBe("HelloWorld");
    expect(CASES[2].fn(words)).toBe("hello_world");
  });
});
