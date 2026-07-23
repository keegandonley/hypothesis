export interface FormatRow {
  id: string;
  label: string;
  format: (d: Date) => string;
}

export function pad(n: number, digits = 2): string {
  return String(n).padStart(digits, "0");
}

/** "12:04:31.482" — millisecond precision for ordering bursts of events. */
export function formatTimeWithMs(d: Date): string {
  return (
    d.toLocaleTimeString("en-US", { hour12: false }) + "." + pad(d.getMilliseconds(), 3)
  );
}

export function formatRelative(d: Date): string {
  const diffMs = d.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const future = diffMs > 0;

  const seconds = Math.floor(abs / 1000);
  const minutes = Math.floor(abs / 60000);
  const hours = Math.floor(abs / 3600000);
  const days = Math.floor(abs / 86400000);
  const months = Math.floor(days / 30.4375);
  const years = Math.floor(days / 365.25);

  let unit: string;
  let count: number;

  if (years >= 1) {
    count = years;
    unit = years === 1 ? "year" : "years";
  } else if (months >= 1) {
    count = months;
    unit = months === 1 ? "month" : "months";
  } else if (days >= 1) {
    count = days;
    unit = days === 1 ? "day" : "days";
  } else if (hours >= 1) {
    count = hours;
    unit = hours === 1 ? "hour" : "hours";
  } else if (minutes >= 1) {
    count = minutes;
    unit = minutes === 1 ? "minute" : "minutes";
  } else {
    count = seconds;
    unit = seconds === 1 ? "second" : "seconds";
  }

  return future ? `in ${count} ${unit}` : `${count} ${unit} ago`;
}

export function formatRfc2822(d: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  return `${days[d.getUTCDay()]}, ${pad(d.getUTCDate())} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +0000`;
}

export const FORMAT_ROWS: FormatRow[] = [
  {
    id: "unix_s",
    label: "Unix (sec)",
    format: (d) => String(Math.floor(d.getTime() / 1000)),
  },
  { id: "unix_ms", label: "Unix (ms)", format: (d) => String(d.getTime()) },
  { id: "iso", label: "ISO 8601", format: (d) => d.toISOString() },
  { id: "utc", label: "UTC String", format: (d) => d.toUTCString() },
  { id: "rfc2822", label: "RFC 2822", format: (d) => formatRfc2822(d) },
  { id: "local", label: "Local", format: (d) => d.toLocaleString() },
  {
    id: "date_only",
    label: "Date",
    format: (d) =>
      `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
  },
  {
    id: "time_utc",
    label: "Time (UTC)",
    format: (d) =>
      `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`,
  },
  {
    id: "day_of_week",
    label: "Day of Week",
    format: (d) =>
      d.toLocaleDateString(undefined, { weekday: "long", timeZone: "UTC" }),
  },
  {
    id: "month_year",
    label: "Month / Year",
    format: (d) =>
      d.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
  },
  { id: "relative", label: "Relative", format: (d) => formatRelative(d) },
  { id: "http", label: "HTTP Date", format: (d) => d.toUTCString() },
];

export function parseInput(value: string): Date | null {
  if (!value.trim()) return null;

  if (/^\d+$/.test(value.trim())) {
    const n = parseInt(value.trim(), 10);

    if (value.trim().length >= 13) {
      const d = new Date(n);

      if (!isNaN(d.getTime())) return d;
    } else {
      const d = new Date(n * 1000);

      if (!isNaN(d.getTime())) return d;
    }
  }

  const d = new Date(value);

  if (!isNaN(d.getTime())) return d;

  return null;
}
