# datetime

Convert timestamps and dates between many formats at once with live sync and shareable permalinks.

## Overview

`datetime` is a browser-based date and time converter. Enter any timestamp or date string and all twelve output formats update instantly. No server involved — everything runs in the browser using the built-in `Date` API.

## Input formats

The parser accepts any of the following:

- **Unix seconds** — a 10-digit integer, e.g. `1705312200`
- **Unix milliseconds** — a 13-digit (or longer) integer, e.g. `1705312200000`
- **ISO 8601** — e.g. `2024-01-15T10:30:00Z` or `2024-01-15T10:30:00.000Z`
- **Any string parseable by `new Date()`** — e.g. `January 15 2024`, `Mon Jan 15 2024 10:30:00 GMT+0000`

For pure integer inputs, the parser uses digit count to decide the interpretation:

```js
// 13+ digits → treat as milliseconds
new Date(n);

// fewer digits → treat as seconds
new Date(n * 1000);
```

If the input cannot be parsed, the grid clears and the badge shows **Invalid**.

## Output formats

| Label        | Example                           |
| ------------ | --------------------------------- |
| Unix (sec)   | `1705312200`                      |
| Unix (ms)    | `1705312200000`                   |
| ISO 8601     | `2024-01-15T10:30:00.000Z`        |
| UTC String   | `Mon, 15 Jan 2024 10:30:00 GMT`   |
| RFC 2822     | `Mon, 15 Jan 2024 10:30:00 +0000` |
| Local        | `1/15/2024, 10:30:00 AM`          |
| Date         | `2024-01-15`                      |
| Time (UTC)   | `10:30:00`                        |
| Day of Week  | `Monday`                          |
| Month / Year | `January 2024`                    |
| Relative     | `3 hours ago` / `in 2 days`       |
| HTTP Date    | `Mon, 15 Jan 2024 10:30:00 GMT`   |

The **Local** row reflects your browser's local timezone. All other rows use UTC.

## Now

Click **Now** to fill the input with the current Unix millisecond timestamp. All output rows update immediately to reflect the current moment.

## Live mode

Toggle **Live OFF → Live ON** in the input row to enter live mode. In live mode:

- The input field is disabled
- All output rows update every 200ms to reflect the current time
- The badge shows **Live**

Turn live mode off to return to manual input. The previous input value is restored if it's still in the URL, otherwise the field will be empty.

## Relative live mode

The **Relative** row has its own **Live OFF / Live ON** toggle. When enabled, only the relative value updates — every second — while all other rows remain anchored to the parsed date.

This is useful for watching a fixed timestamp age in real time without updating the rest of the grid.

When global live mode is on, the relative live toggle shows **Live Unavailable** and is disabled — global live refreshes all rows continuously, so the relative time is always 0 seconds.

## Copying values

Each row has a **Copy** button. Click it to copy that row's value to your clipboard. The button briefly shows **Copied!** as confirmation, then resets after 1.5 seconds.

## Permalinks

The URL updates live as you type. A single query parameter is used:

- `value` — the raw input string as entered

### Example permalinks

```
/datetime?value=1705312200
```

Loads with the Unix seconds timestamp `1705312200` pre-parsed.

```
/datetime?value=2024-01-15T10%3A30%3A00Z
```

Loads with the ISO 8601 string `2024-01-15T10:30:00Z` pre-parsed.

Share or bookmark the URL to return to the same date. The input and all output rows are restored on load.

Use the **Copy** button in the Permalink row to copy the current URL to your clipboard.

Use the **Reset** button to clear the input, collapse all output rows, and return the URL to the bare `/datetime` path.
