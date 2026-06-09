import { describe, expect, it } from "vitest";
import { jsonDiff, formatValue, DIFF_LABELS } from "@/lib/json-diff";

describe("jsonDiff", () => {
  it("returns no diff for identical primitives", () => {
    expect(jsonDiff(42, 42)).toEqual([]);
  });

  it("detects changed primitive", () => {
    const diff = jsonDiff(1, 2);

    expect(diff).toHaveLength(1);
    expect(diff[0].type).toBe("changed");
  });

  it("detects type change", () => {
    const diff = jsonDiff("hello", 42);

    expect(diff).toHaveLength(1);
    expect(diff[0].type).toBe("type-changed");
  });

  it("detects added object keys", () => {
    const diff = jsonDiff({ a: 1 }, { a: 1, b: 2 });

    expect(diff).toHaveLength(1);
    expect(diff[0].type).toBe("added");
    expect(diff[0].path).toBe("b");
  });

  it("detects removed object keys", () => {
    const diff = jsonDiff({ a: 1, b: 2 }, { a: 1 });

    expect(diff).toHaveLength(1);
    expect(diff[0].type).toBe("removed");
  });

  it("detects changed object key", () => {
    const diff = jsonDiff({ a: 1 }, { a: 2 });

    expect(diff).toHaveLength(1);
    expect(diff[0].type).toBe("changed");
  });

  it("detects added array elements", () => {
    const diff = jsonDiff([1], [1, 2]);

    expect(diff).toHaveLength(1);
    expect(diff[0].type).toBe("added");
    expect(diff[0].path).toBe("[1]");
  });

  it("detects removed array elements", () => {
    const diff = jsonDiff([1, 2], [1]);

    expect(diff).toHaveLength(1);
    expect(diff[0].type).toBe("removed");
  });

  it("detects nested differences", () => {
    const diff = jsonDiff({ a: { b: 1 } }, { a: { b: 2 } });

    expect(diff).toHaveLength(1);
    expect(diff[0].path).toBe("a.b");
  });

  it("returns empty for identical objects", () => {
    expect(jsonDiff({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toEqual([]);
  });

  it("returns empty for identical arrays", () => {
    expect(jsonDiff([1, 2, 3], [1, 2, 3])).toEqual([]);
  });

  it("detects array vs object type change", () => {
    const diff = jsonDiff([1], { 0: 1 });

    expect(diff).toHaveLength(1);
    expect(diff[0].type).toBe("type-changed");
  });

  it("handles null values", () => {
    const diff = jsonDiff(null, null);

    expect(diff).toEqual([]);
  });
});

describe("formatValue", () => {
  it("formats null", () => {
    expect(formatValue(null)).toBe("null");
  });

  it("formats string with quotes", () => {
    expect(formatValue("hello")).toBe('"hello"');
  });

  it("formats number", () => {
    expect(formatValue(42)).toBe("42");
  });

  it("formats boolean", () => {
    expect(formatValue(true)).toBe("true");
  });

  it("formats object as JSON", () => {
    expect(formatValue({ a: 1 })).toBe('{"a":1}');
  });

  it("formats array as JSON", () => {
    expect(formatValue([1, 2])).toBe("[1,2]");
  });
});

describe("DIFF_LABELS", () => {
  it("has labels for all diff types", () => {
    expect(DIFF_LABELS.added).toBe("+ added");
    expect(DIFF_LABELS.removed).toBe("- removed");
    expect(DIFF_LABELS.changed).toBe("~ changed");
    expect(DIFF_LABELS["type-changed"]).toBe("! type");
  });
});
