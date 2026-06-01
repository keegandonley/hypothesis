export interface ImageAdjustments {
  brightness: number; // 50–200, where 100 = unchanged
  contrast: number; // 50–200, where 100 = unchanged
  sharpness: number; // 0–100
  grayscale: boolean;
}

export const DEFAULT_ADJ: ImageAdjustments = {
  brightness: 100,
  contrast: 100,
  sharpness: 0,
  grayscale: false,
};

export const CHAR_SETS = {
  simple: " .:-=+*#%@",
  detailed:
    " .'`^\",;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  blocks: " ░▒▓█",
} as const;

export type CharSetKey = keyof typeof CHAR_SETS;

export function applySharpen(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        const center = data[idx + c];
        const top = y > 0 ? data[((y - 1) * width + x) * 4 + c] : center;
        const bottom =
          y < height - 1 ? data[((y + 1) * width + x) * 4 + c] : center;
        const left = x > 0 ? data[(y * width + (x - 1)) * 4 + c] : center;
        const right =
          x < width - 1 ? data[(y * width + (x + 1)) * 4 + c] : center;
        const sharpened = 5 * center - top - bottom - left - right;

        out[idx + c] = Math.max(
          0,
          Math.min(255, Math.round(center * (1 - amount) + sharpened * amount)),
        );
      }

      out[idx + 3] = data[idx + 3];
    }
  }

  return out;
}

export function renderAscii(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  cols: number,
  charSet: string,
  invert: boolean,
  adj: ImageAdjustments,
  charAspect: number,
): string {
  const ctx = canvas.getContext("2d");

  if (!ctx) return "";

  const rows = Math.max(
    1,
    Math.round((cols / img.naturalWidth) * img.naturalHeight * charAspect),
  );

  canvas.width = cols;
  canvas.height = rows;

  const filters: string[] = [];

  if (adj.brightness !== 100)
    filters.push(`brightness(${adj.brightness / 100})`);
  if (adj.contrast !== 100) filters.push(`contrast(${adj.contrast / 100})`);
  if (adj.grayscale) filters.push("grayscale(1)");
  ctx.filter = filters.length > 0 ? filters.join(" ") : "none";
  ctx.drawImage(img, 0, 0, cols, rows);
  ctx.filter = "none";

  const imageData = ctx.getImageData(0, 0, cols, rows);
  const data: Uint8ClampedArray =
    adj.sharpness > 0
      ? applySharpen(imageData.data, cols, rows, adj.sharpness / 100)
      : imageData.data;

  const lines: string[] = [];

  for (let y = 0; y < rows; y++) {
    let line = "";

    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      const normalized = invert ? lum : 1 - lum;
      const charIndex = Math.min(
        charSet.length - 1,
        Math.floor(normalized * charSet.length),
      );

      line += charSet[charIndex];
    }

    lines.push(line);
  }

  return lines.join("\n");
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.crossOrigin = "anonymous";
    img.onload = () => {
      resolve(img);
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = src;
  });
}
