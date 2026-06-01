import { diffLines, diffWords, diffChars } from "diff";

export type Mode = "lines" | "words" | "chars";

export const MODES: { value: Mode; label: string }[] = [
  { value: "lines", label: "Lines" },
  { value: "words", label: "Words" },
  { value: "chars", label: "Chars" },
];

export function computeDiff(
  original: string,
  modified: string,
  mode: Mode,
): ReturnType<typeof diffLines> {
  if (mode === "lines") return diffLines(original, modified);
  if (mode === "words") return diffWords(original, modified);

  return diffChars(original, modified);
}

export function countChanges(
  changes: ReturnType<typeof diffLines>,
  mode: Mode,
): { added: number; removed: number } {
  const added = changes
    .filter((c) => c.added)
    .reduce((n, c) => {
      if (mode === "lines")
        return n + c.value.split("\n").filter((l) => l.length > 0).length;

      return n + 1;
    }, 0);
  const removed = changes
    .filter((c) => c.removed)
    .reduce((n, c) => {
      if (mode === "lines")
        return n + c.value.split("\n").filter((l) => l.length > 0).length;

      return n + 1;
    }, 0);

  return { added, removed };
}
