import { describe, expect, it } from "vitest";
import { jsonToTs, toPascal, needsQuoting } from "@/lib/json-ts";

describe("toPascal", () => {
  it("converts simple string", () => {
    expect(toPascal("hello")).toBe("Hello");
  });

  it("converts snake_case", () => {
    expect(toPascal("hello_world")).toBe("HelloWorld");
  });

  it("converts kebab-case", () => {
    expect(toPascal("hello-world")).toBe("HelloWorld");
  });
});

describe("needsQuoting", () => {
  it("does not need quoting for valid identifiers", () => {
    expect(needsQuoting("name")).toBe(false);
    expect(needsQuoting("_private")).toBe(false);
    expect(needsQuoting("$value")).toBe(false);
  });

  it("needs quoting for invalid identifiers", () => {
    expect(needsQuoting("123abc")).toBe(true);
    expect(needsQuoting("my-key")).toBe(true);
    expect(needsQuoting("")).toBe(true);
  });
});

describe("jsonToTs", () => {
  it("converts a simple object", () => {
    const result = jsonToTs('{"name":"Alice","age":30}', "Root", false);
    expect(result).toContain("interface Root");
    expect(result).toContain("name: string");
    expect(result).toContain("age: number");
  });

  it("adds optional markers when requested", () => {
    const result = jsonToTs('{"name":"Alice"}', "Root", true);
    expect(result).toContain("name?");
  });

  it("converts an array of objects", () => {
    const result = jsonToTs(
      '[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]',
      "Users",
      false,
    );
    expect(result).toContain("interface User");
    expect(result).toContain("type Users");
  });

  it("handles nested objects", () => {
    const result = jsonToTs(
      '{"user":{"name":"Alice","address":{"city":"NYC"}}}',
      "Root",
      false,
    );
    expect(result).toContain("interface Address");
    expect(result).toContain("interface User");
    expect(result).toContain("interface Root");
  });

  it("handles empty array", () => {
    const result = jsonToTs("[]", "Root", false);
    expect(result).toContain("type Root = unknown[]");
  });

  it("handles primitive root", () => {
    const result = jsonToTs('"hello"', "Root", false);
    expect(result).toContain("type Root = string");
  });

  it("handles numeric root", () => {
    const result = jsonToTs("42", "Root", false);
    expect(result).toContain("type Root = number");
  });

  it("handles null root", () => {
    const result = jsonToTs("null", "Root", false);
    expect(result).toContain("type Root = null");
  });

  it("handles mixed-type arrays", () => {
    const result = jsonToTs('[1, "hello", true]', "Root", false);
    expect(result).toContain("number | string | boolean");
  });
});
