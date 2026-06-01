export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
export const LIGHTNESS = [
  0.97, 0.94, 0.88, 0.8, 0.7, 0.57, 0.46, 0.37, 0.28, 0.2, 0.14,
];

export function hexToOklch(hex: string): [number, number, number] | null {
  const clean = hex.replace("#", "");

  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const toLinear = (c: number): number =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const lr = toLinear(r),
    lg = toLinear(g),
    lb = toLinear(b);

  const x = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const y = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const z = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z);
  const m_ = Math.cbrt(0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z);
  const s_ = Math.cbrt(0.0482003018 * x + 0.2643662691 * y + 0.633851707 * z);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const bv = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const C = Math.sqrt(a * a + bv * bv);
  const H = (Math.atan2(bv, a) * 180) / Math.PI;

  return [L, C, (H + 360) % 360];
}

export function oklchToHex(L: number, C: number, H: number): string {
  const rad = (H * Math.PI) / 180;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bOut = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const toSrgb = (c: number): number => {
    const clipped = Math.max(0, Math.min(1, c));

    return clipped <= 0.0031308
      ? 12.92 * clipped
      : 1.055 * Math.pow(clipped, 1 / 2.4) - 0.055;
  };

  const toHex = (c: number): string =>
    Math.round(toSrgb(c) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(bOut)}`;
}

export function generateShades(
  hex: string,
): { step: number; hex: string }[] | null {
  const lch = hexToOklch(hex);

  if (!lch) return null;
  const [, C, H] = lch;

  return STEPS.map((step, i) => ({
    step,
    hex: oklchToHex(LIGHTNESS[i], C * 0.85, H),
  }));
}

export function isDark(hex: string): boolean {
  const lch = hexToOklch(hex);

  return lch ? lch[0] < 0.5 : false;
}
