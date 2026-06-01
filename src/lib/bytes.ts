export type Mode = "binary" | "decimal";

export const BINARY_UNITS = [
  { unit: "B", name: "Bytes", factor: 1 },
  { unit: "KiB", name: "Kibibytes", factor: 1024 },
  { unit: "MiB", name: "Mebibytes", factor: 1024 ** 2 },
  { unit: "GiB", name: "Gibibytes", factor: 1024 ** 3 },
  { unit: "TiB", name: "Tebibytes", factor: 1024 ** 4 },
  { unit: "PiB", name: "Pebibytes", factor: 1024 ** 5 },
];

export const DECIMAL_UNITS = [
  { unit: "B", name: "Bytes", factor: 1 },
  { unit: "KB", name: "Kilobytes", factor: 1000 },
  { unit: "MB", name: "Megabytes", factor: 1000 ** 2 },
  { unit: "GB", name: "Gigabytes", factor: 1000 ** 3 },
  { unit: "TB", name: "Terabytes", factor: 1000 ** 4 },
  { unit: "PB", name: "Petabytes", factor: 1000 ** 5 },
];

export function formatValue(bytes: number, factor: number): string {
  const n = bytes / factor;

  if (n === 0) return "0";

  return parseFloat(n.toPrecision(10)).toLocaleString(undefined, {
    maximumSignificantDigits: 10,
  });
}
