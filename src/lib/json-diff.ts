export type DiffType = "added" | "removed" | "changed" | "type-changed";

export interface DiffEntry {
  path: string;
  type: DiffType;
  oldValue?: unknown;
  newValue?: unknown;
}

export const DIFF_LABELS: Record<DiffType, string> = {
  added: "+ added",
  removed: "- removed",
  changed: "~ changed",
  "type-changed": "! type",
};

export function formatValue(v: unknown): string {
  if (v === null) return "null";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "object") return JSON.stringify(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);

  return "";
}

export function jsonDiff(a: unknown, b: unknown, path = ""): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const label = path || "(root)";

  const aIsArray = Array.isArray(a);
  const bIsArray = Array.isArray(b);
  const aIsObj = a !== null && typeof a === "object" && !aIsArray;
  const bIsObj = b !== null && typeof b === "object" && !bIsArray;

  if (typeof a !== typeof b || aIsArray !== bIsArray) {
    entries.push({
      path: label,
      type: "type-changed",
      oldValue: a,
      newValue: b,
    });

    return entries;
  }

  if (aIsArray && bIsArray) {
    const aArr = a as unknown[];
    const bArr = b as unknown[];
    const len = Math.max(aArr.length, bArr.length);

    for (let i = 0; i < len; i++) {
      const childPath = `${path}[${i}]`;

      if (i >= aArr.length) {
        entries.push({ path: childPath, type: "added", newValue: bArr[i] });
      } else if (i >= bArr.length) {
        entries.push({ path: childPath, type: "removed", oldValue: aArr[i] });
      } else {
        entries.push(...jsonDiff(aArr[i], bArr[i], childPath));
      }
    }

    return entries;
  }

  if (aIsObj && bIsObj) {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const keys = new Set([...Object.keys(aObj), ...Object.keys(bObj)]);

    for (const key of keys) {
      const childPath = path ? `${path}.${key}` : key;

      if (!(key in aObj)) {
        entries.push({ path: childPath, type: "added", newValue: bObj[key] });
      } else if (!(key in bObj)) {
        entries.push({ path: childPath, type: "removed", oldValue: aObj[key] });
      } else {
        entries.push(...jsonDiff(aObj[key], bObj[key], childPath));
      }
    }

    return entries;
  }

  if (a !== b) {
    entries.push({ path: label, type: "changed", oldValue: a, newValue: b });
  }

  return entries;
}
