import { describe, expect, it } from "vitest";
import { formatJson, URL_LIMIT } from "@/lib/pretty-print";

describe("URL_LIMIT", () => {
  it("is 2000", () => {
    expect(URL_LIMIT).toBe(2000);
  });
});

describe("formatJson", () => {
  it("formats valid JSON", () => {
    const { output, valid } = formatJson('{"a":1,"b":2}');

    expect(valid).toBe(true);
    expect(output).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });

  it("handles nested objects", () => {
    const { output, valid } = formatJson('{"a":{"b":"c"}}');

    expect(valid).toBe(true);
    expect(output).toContain('"b": "c"');
  });

  it("returns valid null for empty string", () => {
    const { output, valid } = formatJson("");

    expect(valid).toBeNull();
    expect(output).toBe("");
  });

  it("returns invalid for malformed JSON", () => {
    const { output, valid } = formatJson("{invalid}");

    expect(valid).toBe(false);
    expect(output).toBe("");
  });

  it("formats arrays", () => {
    const { output, valid } = formatJson("[1,2,3]");

    expect(valid).toBe(true);
    expect(output).toBe("[\n  1,\n  2,\n  3\n]");
  });
});
