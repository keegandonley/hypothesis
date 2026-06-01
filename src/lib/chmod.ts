export type Perms = [number, number, number]; // [owner, group, other]

export const PRESETS: { label: string; mode: string }[] = [
  { label: "644", mode: "644" },
  { label: "664", mode: "664" },
  { label: "755", mode: "755" },
  { label: "700", mode: "700" },
  { label: "777", mode: "777" },
];

export function parseNumeric(raw: string): Perms | null {
  const trimmed = raw.trim();

  if (!/^[0-7]{3}$/.test(trimmed)) return null;

  return trimmed.split("").map(Number) as Perms;
}

export function parseSymbolic(raw: string): Perms | null {
  const trimmed = raw.trim().toLowerCase();

  if (!/^[rwx-]{9}$/.test(trimmed)) return null;
  const groups = [
    trimmed.slice(0, 3),
    trimmed.slice(3, 6),
    trimmed.slice(6, 9),
  ];

  return groups.map((g) => {
    let n = 0;

    if (g.startsWith("r")) n += 4;
    if (g[1] === "w") n += 2;
    if (g[2] === "x") n += 1;

    return n;
  }) as Perms;
}

export function toSymbolic(perms: Perms): string {
  return perms
    .map((d) => {
      const r = d & 4 ? "r" : "-";
      const w = d & 2 ? "w" : "-";
      const x = d & 1 ? "x" : "-";

      return r + w + x;
    })
    .join("");
}

export function toNumeric(perms: Perms): string {
  return perms.join("");
}

export function detectInput(raw: string): "numeric" | "symbolic" | "unknown" {
  if (/^[0-7]{3}$/.test(raw.trim())) return "numeric";
  if (/^[rwx-]{9}$/i.test(raw.trim())) return "symbolic";

  return "unknown";
}
