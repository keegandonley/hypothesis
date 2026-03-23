# Cron

Parse cron expressions and preview the next scheduled run times in your local timezone and UTC.

## Input

Enter a standard 5-field cron expression:

```
┌───────────── minute (0–59)
│ ┌───────────── hour (0–23)
│ │ ┌───────────── day of month (1–31)
│ │ │ ┌───────────── month (1–12)
│ │ │ │ ┌───────────── day of week (0–7, 0 and 7 = Sunday)
│ │ │ │ │
* * * * *
```

## Field Syntax

| Syntax | Example | Meaning |
|--------|---------|---------|
| `*` | `*` | Every value |
| Number | `5` | Exact value |
| Range | `1-5` | All values from 1 to 5 |
| List | `1,3,5` | Specific values |
| Step | `*/15` | Every 15 units |
| Step+Range | `0-30/5` | Every 5 from 0 to 30 |

## Examples

| Expression | Meaning |
|-----------|---------|
| `* * * * *` | Every minute |
| `0 * * * *` | Every hour (on the hour) |
| `0 0 * * *` | Daily at midnight |
| `0 9 * * 1-5` | Weekdays at 9:00 AM |
| `0 0 * * 0` | Every Sunday at midnight |
| `0 0 1 * *` | First day of each month at midnight |
| `*/15 * * * *` | Every 15 minutes |
| `30 4 1,15 * *` | 4:30 AM on the 1st and 15th |

## Output

- **Description** — Plain English summary of the schedule
- **Next 10 runs** — Upcoming run times in both local timezone and UTC

## Permalink

The expression is encoded in the URL as `?expr=<value>`. Copy the URL to share or bookmark a specific schedule.

## Reset

Clears the expression and removes the URL parameter.

## See also

- [Exit Codes](/references/exit-codes) — standard Unix/Linux process exit codes and their meanings
- [Unix Signals](/references/unix-signals) — signal numbers, names, and default actions for POSIX signals
