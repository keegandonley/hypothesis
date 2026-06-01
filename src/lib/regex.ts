export const FLAGS = ["g", "i", "m", "s", "u"] as const;

export type Flag = (typeof FLAGS)[number];

export interface ResultRow {
  input: string;
  matched: boolean;
  matchCount: number;
  groups: string[];
}

export function computeResults(
  pattern: string,
  flagStr: string,
  testInput: string,
): ResultRow[] {
  if (!pattern) return [];
  try {
    new RegExp(pattern, flagStr);
  } catch {
    return [];
  }

  const globalFlags = flagStr.includes("g") ? flagStr : flagStr + "g";
  const lines = testInput.split("\n");

  return lines.map((line) => {
    const matches = Array.from(line.matchAll(new RegExp(pattern, globalFlags)));

    return {
      input: line,
      matched: matches.length > 0,
      matchCount: matches.length,
      groups: matches.flatMap((m) => m.slice(1).filter(Boolean)),
    };
  });
}

export function getPatternStatus(
  pattern: string,
  flagStr: string,
  results: ResultRow[],
): { label: string; type: "badge" | "badgeError" | "badgeReady" | null } {
  if (!pattern) return { label: "ready", type: "badgeReady" };
  try {
    new RegExp(pattern, flagStr);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid";

    return { label: `error: ${msg}`, type: "badgeError" };
  }

  const matchCount = results.filter((r) => r.matched).length;
  const total = results.filter((r) => r.input !== "").length;

  if (total === 0) return { label: "valid", type: "badge" };

  return { label: `${matchCount}/${total} match`, type: "badge" };
}

export function flagTitle(flag: Flag): string {
  switch (flag) {
    case "g":
      return "global — find all matches";
    case "i":
      return "ignore case";
    case "m":
      return "multiline — ^ and $ match line boundaries";
    case "s":
      return "dotAll — . matches newlines";
    case "u":
      return "unicode";
  }
}
