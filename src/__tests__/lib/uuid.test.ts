import { describe, expect, it } from "vitest";
import { generate } from "@/lib/uuid";

describe("generate", () => {
  it("generates a v4 UUID by default", () => {
    const uuid = generate(4);

    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it("generates a v1 UUID", () => {
    const uuid = generate(1);

    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("generates a v7 UUID", () => {
    const uuid = generate(7);

    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it("generates unique values on subsequent calls", () => {
    const a = generate(4);
    const b = generate(4);

    expect(a).not.toBe(b);
  });
});
