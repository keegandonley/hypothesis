import { v1, v4, v7 } from "uuid";

export function generate(ver: 1 | 4 | 7): string {
  if (ver === 1) return v1();
  if (ver === 4) return v4();
  return v7();
}
