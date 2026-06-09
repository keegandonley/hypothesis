import { describe, expect, it } from "vitest";
import { toBin, formatBin, OPERATIONS } from "@/lib/bitwise";

describe("toBin", () => {
  it("formats zero as 32 bits", () => {
    expect(toBin(0)).toBe("00000000000000000000000000000000");
  });

  it("formats a positive integer", () => {
    expect(toBin(60)).toBe("00000000000000000000000000111100");
  });

  it("formats a negative integer via unsigned right shift", () => {
    expect(toBin(-1)).toBe("11111111111111111111111111111111");
  });

  it("pads to 32 bits", () => {
    expect(toBin(1)).toBe("00000000000000000000000000000001");
  });
});

describe("formatBin", () => {
  it("groups into nibbles", () => {
    expect(formatBin(0)).toBe("0000 0000 0000 0000 0000 0000 0000 0000");
  });

  it("formats 60 with nibbles", () => {
    expect(formatBin(60)).toBe("0000 0000 0000 0000 0000 0000 0011 1100");
  });
});

describe("OPERATIONS", () => {
  it("computes AND", () => {
    const op = OPERATIONS.find((o) => o.key === "and")!;

    expect(op.compute(60, 13)).toBe(12);
  });

  it("computes OR", () => {
    const op = OPERATIONS.find((o) => o.key === "or")!;

    expect(op.compute(60, 13)).toBe(61);
  });

  it("computes XOR", () => {
    const op = OPERATIONS.find((o) => o.key === "xor")!;

    expect(op.compute(60, 13)).toBe(49);
  });

  it("computes NAND", () => {
    const op = OPERATIONS.find((o) => o.key === "nand")!;

    expect(op.compute(60, 13)).toBe(~(60 & 13));
  });

  it("computes NOR", () => {
    const op = OPERATIONS.find((o) => o.key === "nor")!;

    expect(op.compute(60, 13)).toBe(~(60 | 13));
  });

  it("computes SHL (shift left)", () => {
    const op = OPERATIONS.find((o) => o.key === "shl")!;

    expect(op.compute(3, 0)).toBe(6);
  });

  it("computes SHR (shift right)", () => {
    const op = OPERATIONS.find((o) => o.key === "shr")!;

    expect(op.compute(8, 0)).toBe(4);
  });

  it("has all expected operations", () => {
    const keys = OPERATIONS.map((o) => o.key);

    expect(keys).toEqual(["and", "or", "xor", "nand", "nor", "shl", "shr"]);
  });
});
