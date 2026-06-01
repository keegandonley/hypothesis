import { describe, expect, it } from "vitest";
import { generate, WORDS } from "@/lib/lorem";

describe("WORDS", () => {
  it("has a list of words", () => {
    expect(WORDS.length).toBeGreaterThan(50);
  });

  it("contains 'lorem'", () => {
    expect(WORDS).toContain("lorem");
  });
});

describe("generate", () => {
  it("generates the requested number of words", () => {
    const result = generate("words", 5);
    const words = result.split(" ");
    expect(words).toHaveLength(5);
  });

  it("generates words in lowercase", () => {
    const result = generate("words", 10);
    expect(result).toEqual(result.toLowerCase());
  });

  it("generates sentences", () => {
    const result = generate("sentences", 2);
    expect(result).toMatch(/^[A-Z]/);
    expect(result.endsWith(".")).toBe(true);
  });

  it("generates paragraphs", () => {
    const result = generate("paragraphs", 2);
    expect(result).toContain("\n\n");
    const paragraphs = result.split("\n\n");
    expect(paragraphs).toHaveLength(2);
  });

  it("generates 0 words as empty string", () => {
    expect(generate("words", 0)).toBe("");
  });
});
