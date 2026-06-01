export function splitWords(input: string): string[] {
  return input
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function toCamel(words: string[]): string {
  return words
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join("");
}

export function toPascal(words: string[]): string {
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

export function toSnake(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join("_");
}

export function toKebab(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join("-");
}

export function toScreaming(words: string[]): string {
  return words.map((w) => w.toUpperCase()).join("_");
}

export function toTitle(words: string[]): string {
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function toLower(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join(" ");
}

export function toUpper(words: string[]): string {
  return words.map((w) => w.toUpperCase()).join(" ");
}

export function toDot(words: string[]): string {
  return words.map((w) => w.toLowerCase()).join(".");
}

export const CASES: { label: string; fn: (w: string[]) => string }[] = [
  { label: "camelCase", fn: toCamel },
  { label: "PascalCase", fn: toPascal },
  { label: "snake_case", fn: toSnake },
  { label: "kebab-case", fn: toKebab },
  { label: "SCREAMING_SNAKE", fn: toScreaming },
  { label: "Title Case", fn: toTitle },
  { label: "lowercase", fn: toLower },
  { label: "UPPERCASE", fn: toUpper },
  { label: "dot.case", fn: toDot },
];
