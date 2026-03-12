# color

Convert color values between HEX, RGB, RGBA, HSL, and OKLCH with a live preview swatch — entirely in your browser with no server involved.

## Overview

Paste or type any color value into the input field. The tool auto-detects the format, shows a live preview swatch, and outputs the color in all six formats simultaneously.

Supported input formats:

| Format | Example                       |
| ------ | ----------------------------- |
| HEX 6  | `#7ee8a2`                     |
| HEX 8  | `#7ee8a280`                   |
| RGB    | `rgb(126, 232, 162)`          |
| RGBA   | `rgba(126, 232, 162, 0.5)`    |
| HSL    | `hsl(141, 69%, 70%)`          |
| HSLA   | `hsla(141, 69%, 70%, 0.5)`    |
| OKLCH  | `oklch(0.8412 0.1154 151.98)` |

## Preview Swatch

The large preview bar above the input shows the parsed color. A checkerboard pattern is rendered underneath to make transparency (alpha < 1) visible. If the input is empty or invalid, the swatch is blank.

A **format badge** next to the swatch shows which format was detected from the input string.

## Output Cards

Six cards display the color in every supported format:

- **HEX 6** — `#rrggbb` (alpha is dropped)
- **HEX 8** — `#rrggbbaa` (alpha encoded as the last two hex digits)
- **RGB** — `rgb(r, g, b)`
- **RGBA** — `rgba(r, g, b, a)`
- **HSL** — `hsl(h, s%, l%)` or `hsla(...)` when alpha < 1
- **OKLCH** — `oklch(L C H)` — a perceptually uniform format from the CSS Color 4 spec

Each card has a **Copy** button that copies the formatted value to your clipboard. The button briefly shows **Copied!** to confirm.

If the input is empty or invalid, all Copy buttons are disabled.

## Error State

If you type something that cannot be parsed as a color, the input gets a red border. No output is shown until the value is valid or cleared.

## Color Math

All conversions use a canonical internal representation of `{ r, g, b, a }` (r/g/b as integers 0–255, a as a float 0–1). Format conversions go through this intermediate type.

**OKLCH** conversion follows the full CSS Color 4 pipeline:

1. sRGB → linear sRGB (gamma expansion)
2. Linear sRGB ↔ XYZ-D65 (standard 3×3 matrix)
3. XYZ-D65 ↔ OKLab (Björn Ottosson M1/M2 matrices + cube root)
4. OKLab ↔ OKLCH (`C = √(a²+b²)`, `H = atan2(b,a)` in degrees)

All math runs client-side. No data leaves your browser.

## Permalinks

Every color you enter is reflected into the URL as `?color=<encoded-value>`. You can share or bookmark these URLs to reopen the converter with the same color pre-filled.

- **Copy** — copies the current permalink to your clipboard
- **Reset** — clears the input and removes the URL parameter
