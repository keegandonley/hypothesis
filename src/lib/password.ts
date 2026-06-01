export const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const LOWER = "abcdefghijklmnopqrstuvwxyz";
export const DIGITS = "0123456789";
export const SYMBOLS = "!@#$%^&*()-_=+[]{}|;:,.<>?";

export type Strength = "very-weak" | "weak" | "fair" | "strong" | "very-strong";

export const STRENGTH_FILL: Record<Strength, number> = {
  "very-weak": 1,
  weak: 2,
  fair: 3,
  strong: 4,
  "very-strong": 5,
};
export const STRENGTH_COLORS: Record<Strength, string> = {
  "very-weak": "#ef4444",
  weak: "#f97316",
  fair: "#eab308",
  strong: "#84cc16",
  "very-strong": "#22c55e",
};
export const STRENGTH_LABELS: Record<Strength, string> = {
  "very-weak": "Very Weak",
  weak: "Weak",
  fair: "Fair",
  strong: "Strong",
  "very-strong": "Very Strong",
};

export function formatCrackTime(entropy: number): string {
  if (entropy <= 0) return "instant";
  const seconds = Math.pow(2, entropy) / 1e10 / 2;

  if (seconds < 0.001) return "instant";
  if (seconds < 1) return "less than a second";
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
  if (seconds < 2592000) return `${Math.round(seconds / 86400)} days`;
  if (seconds < 31536000) return `${Math.round(seconds / 2592000)} months`;
  if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} years`;
  if (seconds < 3.154e13)
    return `${Math.round(seconds / 3153600000)} centuries`;

  return "effectively uncrackable";
}

export function analyzePassword(pw: string): {
  entropy: number;
  length: number;
  hasUpper: boolean;
  hasLower: boolean;
  hasDigits: boolean;
  hasSymbols: boolean;
  strength: Strength;
  crackTime: string;
} {
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasDigits = /[0-9]/.test(pw);
  const hasSymbols = /[^A-Za-z0-9]/.test(pw);
  let charsetSize = 0;

  if (hasUpper) charsetSize += 26;
  if (hasLower) charsetSize += 26;
  if (hasDigits) charsetSize += 10;
  if (hasSymbols) charsetSize += 32;
  const entropy = charsetSize > 0 ? pw.length * Math.log2(charsetSize) : 0;
  const strength: Strength =
    entropy < 28
      ? "very-weak"
      : entropy < 36
        ? "weak"
        : entropy < 60
          ? "fair"
          : entropy < 128
            ? "strong"
            : "very-strong";

  return {
    entropy,
    length: pw.length,
    hasUpper,
    hasLower,
    hasDigits,
    hasSymbols,
    strength,
    crackTime: formatCrackTime(entropy),
  };
}

export function generatePasswords(
  length: number,
  upper: boolean,
  lower: boolean,
  digits: boolean,
  symbols: boolean,
  count: number,
): string[] {
  let charset = "";

  if (upper) charset += UPPER;
  if (lower) charset += LOWER;
  if (digits) charset += DIGITS;
  if (symbols) charset += SYMBOLS;
  if (!charset) return [];
  const results: string[] = [];

  for (let i = 0; i < count; i++) {
    const arr = new Uint32Array(length);

    crypto.getRandomValues(arr);
    results.push(
      Array.from(arr)
        .map((n) => charset[n % charset.length])
        .join(""),
    );
  }

  return results;
}
