export function toBin(n: number): string {
  return (n >>> 0).toString(2).padStart(32, "0");
}

export function formatBin(n: number): string {
  const b = toBin(n);

  return b.replace(/(.{4})/g, "$1 ").trim();
}

export interface Operation {
  label: string;
  key: string;
  compute: (a: number, b: number) => number;
  description: string;
}

export const OPERATIONS: Operation[] = [
  { label: "AND", key: "and", compute: (a, b) => a & b, description: "a & b" },
  { label: "OR", key: "or", compute: (a, b) => a | b, description: "a | b" },
  { label: "XOR", key: "xor", compute: (a, b) => a ^ b, description: "a ^ b" },
  {
    label: "NAND",
    key: "nand",
    compute: (a, b) => ~(a & b),
    description: "~(a & b)",
  },
  {
    label: "NOR",
    key: "nor",
    compute: (a, b) => ~(a | b),
    description: "~(a | b)",
  },
  {
    label: "SHL",
    key: "shl",
    compute: (a, _b) => a << 1,
    description: "a << 1",
  },
  {
    label: "SHR",
    key: "shr",
    compute: (a, _b) => a >> 1,
    description: "a >> 1",
  },
];
