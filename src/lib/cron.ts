import { CronExpressionParser } from "cron-parser";
import cronstrue from "cronstrue";

export const NEXT_COUNT = 10;

export const EXAMPLES = [
  { label: "Every minute", expr: "* * * * *" },
  { label: "Every hour", expr: "0 * * * *" },
  { label: "Daily at midnight", expr: "0 0 * * *" },
  { label: "Weekdays at 9 AM", expr: "0 9 * * 1-5" },
  { label: "Weekly on Sunday", expr: "0 0 * * 0" },
  { label: "Monthly 1st", expr: "0 0 1 * *" },
];

export interface ParseResult {
  description: string;
  nextRuns: Date[];
  error: null;
}

export interface ParseError {
  error: string;
}

export function parseCron(expr: string): ParseResult | ParseError {
  const trimmed = expr.trim();

  if (!trimmed) return { error: "empty" };

  let description: string;

  try {
    description = cronstrue.toString(trimmed, {
      throwExceptionOnParseError: true,
    });
  } catch {
    return { error: "Invalid cron expression" };
  }

  try {
    const interval = CronExpressionParser.parse(trimmed);
    const nextRuns: Date[] = [];

    for (let i = 0; i < NEXT_COUNT; i++) {
      nextRuns.push(interval.next().toDate());
    }

    return { description, nextRuns, error: null };
  } catch {
    return { error: "Invalid cron expression" };
  }
}

export function formatLocal(d: Date): string {
  return d.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatUtc(d: Date): string {
  return d.toUTCString();
}
