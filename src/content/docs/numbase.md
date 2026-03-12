# number base

Convert integers between binary, octal, decimal, and hex with live sync and shareable permalinks.

## Overview

`number base` is a browser-based integer base converter. Type a number into any of the four panels and all others update instantly. No server involved — everything runs in the browser using JavaScript's built-in `parseInt` and `Number.prototype.toString`.

Supports non-negative integers up to `Number.MAX_SAFE_INTEGER` (2⁵³ − 1).

## Panels

The tool shows four panels side by side:

| Panel | Base | Prefix |
|-------|------|--------|
| Binary | 2 | `0b` |
| Octal | 8 | `0o` |
| Decimal | 10 | — |
| Hex | 16 | `0x` |

Edit any panel — the other three update on every keystroke. Hex output is always uppercase (`FF`, not `ff`).

## Conversion

Conversion goes through decimal as an intermediate step:

```js
// Any base → decimal
const n = parseInt(input, fromBase);

// Decimal → all bases
n.toString(2)   // binary
n.toString(8)   // octal
n.toString(10)  // decimal
n.toString(16).toUpperCase()  // hex
```

## Validation

If you type characters that are invalid for the selected base (e.g. `2` in a binary field, or `G` in a hex field), an **invalid** badge appears on that panel and the other panels are not updated. Fix the input and conversion resumes immediately.

## Permalinks

The URL updates live as you type. One query parameter is used:

- `value` — the current value as a decimal integer

```
/numbase?value=255
```

Restores `11111111` in binary, `377` in octal, `255` in decimal, and `FF` in hex.

Use the **Copy** button in the Permalink row to copy the current URL to your clipboard.

Use the **Reset** button to clear all panels and return the URL to the bare `/numbase` path.
