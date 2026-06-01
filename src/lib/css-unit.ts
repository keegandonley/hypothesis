export type CSSUnit =
  | "px"
  | "rem"
  | "em"
  | "%"
  | "vh"
  | "vw"
  | "pt"
  | "cm"
  | "mm"
  | "in";

export interface ConversionContext {
  baseFontSize: number;
  viewportWidth: number;
  viewportHeight: number;
  parentSize: number;
}

export const DEFAULT_CONTEXT: ConversionContext = {
  baseFontSize: 16,
  viewportWidth: 1920,
  viewportHeight: 1080,
  parentSize: 16,
};

export const UNITS: CSSUnit[] = [
  "px", "rem", "em", "%", "vh", "vw", "pt", "cm", "mm", "in",
];

export function convertToPx(
  value: number,
  unit: CSSUnit,
  context: ConversionContext,
): number {
  switch (unit) {
    case "px":
      return value;
    case "rem":
      return value * context.baseFontSize;
    case "em":
      return value * context.baseFontSize;
    case "%":
      return (value / 100) * context.parentSize;
    case "vh":
      return (value / 100) * context.viewportHeight;
    case "vw":
      return (value / 100) * context.viewportWidth;
    case "pt":
      return value * (96 / 72);
    case "cm":
      return value * (96 / 2.54);
    case "mm":
      return value * (96 / 25.4);
    case "in":
      return value * 96;
    default:
      return value;
  }
}

export function convertFromPx(
  pxValue: number,
  unit: CSSUnit,
  context: ConversionContext,
): number {
  switch (unit) {
    case "px":
      return pxValue;
    case "rem":
      return pxValue / context.baseFontSize;
    case "em":
      return pxValue / context.baseFontSize;
    case "%":
      return (pxValue / context.parentSize) * 100;
    case "vh":
      return (pxValue / context.viewportHeight) * 100;
    case "vw":
      return (pxValue / context.viewportWidth) * 100;
    case "pt":
      return pxValue * (72 / 96);
    case "cm":
      return pxValue * (2.54 / 96);
    case "mm":
      return pxValue * (25.4 / 96);
    case "in":
      return pxValue / 96;
    default:
      return pxValue;
  }
}

export function formatNumber(num: number): string {
  return num.toFixed(3);
}
