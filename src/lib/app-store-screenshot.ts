export type Dimension =
  | "1242x2688"
  | "2688x1242"
  | "1284x2778"
  | "2778x1284"
  | "2064x2752"
  | "2752x2064"
  | "2048x2732"
  | "2732x2048";

export const DIMS: Record<
  Dimension,
  { w: number; h: number; label: string; group: string }
> = {
  "1242x2688": { w: 1242, h: 2688, label: '6.5" Portrait', group: "iPhone" },
  "2688x1242": { w: 2688, h: 1242, label: '6.5" Landscape', group: "iPhone" },
  "1284x2778": { w: 1284, h: 2778, label: '6.7" Portrait', group: "iPhone" },
  "2778x1284": { w: 2778, h: 1284, label: '6.7" Landscape', group: "iPhone" },
  "2064x2752": { w: 2064, h: 2752, label: '12.9" Portrait', group: "iPad" },
  "2752x2064": { w: 2752, h: 2064, label: '12.9" Landscape', group: "iPad" },
  "2048x2732": { w: 2048, h: 2732, label: '13" Portrait', group: "iPad" },
  "2732x2048": { w: 2732, h: 2048, label: '13" Landscape', group: "iPad" },
};

export const DIM_KEYS = Object.keys(DIMS) as Dimension[];

export const MAX_PREVIEW_H = 480;

export function gradientCoords(
  w: number,
  h: number,
  angleDeg: number,
): number[] {
  const rad = (angleDeg * Math.PI) / 180;
  const len = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));

  return [
    w / 2 - (len / 2) * Math.sin(rad),
    h / 2 - (len / 2) * Math.cos(rad),
    w / 2 + (len / 2) * Math.sin(rad),
    h / 2 + (len / 2) * Math.cos(rad),
  ];
}
