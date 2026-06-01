export interface Values {
  bin: string;
  oct: string;
  dec: string;
  hex: string;
}

export const empty: Values = { bin: "", oct: "", dec: "", hex: "" };

export function fromDecimal(n: number): Values {
  return {
    bin: n.toString(2),
    oct: n.toString(8),
    dec: Number.isInteger(n) ? n.toFixed(0) : n.toString(10),
    hex: n.toString(16).toUpperCase(),
  };
}
