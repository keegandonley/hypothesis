export const URL_LIMIT = 2000;

export function formatJson(
  value: string,
): { output: string; valid: boolean | null } {
  if (value.length === 0) return { output: "", valid: null };
  try {
    const parsed: unknown = JSON.parse(value);

    return { output: JSON.stringify(parsed, null, 2), valid: true };
  } catch {
    return { output: "", valid: false };
  }
}
