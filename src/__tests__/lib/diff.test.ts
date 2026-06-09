import { describe, expect, it } from "vitest";
import { computeDiff, countChanges, MODES, Mode } from "@/lib/diff";

describe("computeDiff", () => {
  it("detects no changes for identical strings (lines)", () => {
    const changes = computeDiff("hello\nworld", "hello\nworld", "lines");

    expect(changes.every((c) => !c.added && !c.removed)).toBe(true);
  });

  it("detects added lines", () => {
    const changes = computeDiff("hello", "hello\nworld", "lines");

    expect(changes.some((c) => c.added)).toBe(true);
  });

  it("detects removed lines", () => {
    const changes = computeDiff("hello\nworld", "hello", "lines");

    expect(changes.some((c) => c.removed)).toBe(true);
  });

  it("detects changed words", () => {
    const changes = computeDiff("hello world", "hello there", "words");

    expect(changes.some((c) => c.removed)).toBe(true);
    expect(changes.some((c) => c.added)).toBe(true);
  });

  it("detects changed chars", () => {
    const changes = computeDiff("abc", "abd", "chars");

    expect(changes.some((c) => c.added || c.removed)).toBe(true);
  });

  it("works with empty strings", () => {
    const changes = computeDiff("", "hello", "lines");

    expect(changes.some((c) => c.added)).toBe(true);
  });

  it("works with both empty", () => {
    const changes = computeDiff("", "", "lines");

    expect(changes.length).toBe(0);
  });
});

describe("countChanges", () => {
  it("counts added lines", () => {
    const changes = computeDiff("a\nb", "a\nb\nc\nd", "lines");
    const { added, removed } = countChanges(changes, "lines");

    expect(added).toBe(3);
    expect(removed).toBe(1);
  });

  it("counts removed lines", () => {
    const changes = computeDiff("a\nb\nc", "a", "lines");
    const { added, removed } = countChanges(changes, "lines");

    expect(added).toBe(1);
    expect(removed).toBe(3);
  });
});

describe("MODES", () => {
  it("has lines, words, chars modes", () => {
    expect(MODES.map((m) => m.value)).toEqual(["lines", "words", "chars"]);
  });
});
