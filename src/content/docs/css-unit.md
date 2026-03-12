# css unit

Convert between CSS units: px, rem, em, %, vh, vw, pt, cm, mm, in with adjustable context values.

## Overview

`css-unit` is a browser-based CSS unit converter that lets you convert between 10 different CSS measurement units in real time. Enter a value in any unit, and instantly see the equivalent values in all other units. The tool accounts for context like base font size and viewport dimensions, making conversions accurate to your specific use case.

## Supported Units

| Unit | Description | Type |
|------|-------------|------|
| `px` | Pixels (device pixels at 96 DPI) | Absolute |
| `rem` | Root em (relative to root font size) | Relative |
| `em` | Em (relative to parent font size) | Relative |
| `%` | Percentage (relative to parent font size) | Relative |
| `vh` | Viewport height (1% of viewport height) | Viewport |
| `vw` | Viewport width (1% of viewport width) | Viewport |
| `pt` | Points (1/72 inch at 96 DPI) | Absolute |
| `cm` | Centimeters | Absolute |
| `mm` | Millimeters | Absolute |
| `in` | Inches (1 inch = 96px at 96 DPI) | Absolute |

## How It Works

Enter a numeric value and select a unit from the dropdown. The tool immediately calculates and displays equivalents in all other units based on the current context settings.

All conversions use pixels (`px`) as an intermediate value:
1. Your input value is converted to pixels
2. Pixels are then converted to each target unit

This ensures consistent, accurate conversions across all unit types.

## Context Settings

Some CSS units are context-dependent. Adjust these values to match your specific use case:

**Base Font Size** (default: 16px)  
Used for calculating `rem`, `em`, and `%` units. The default of 16px is the standard browser default, but many designs use different root font sizes (e.g., 10px for easier mental math, or 18px for accessibility).

**Viewport Width** (default: 1920px)  
Used for calculating `vw` units. Set this to match your target screen width (e.g., 1920 for desktop, 1366 for laptop, 414 for mobile).

**Viewport Height** (default: 1080px)  
Used for calculating `vh` units. Set this to match your target screen height (e.g., 1080 for desktop, 768 for tablet, 896 for mobile).

Changes to context settings update all conversions immediately.

## Conversions Grid

All unit conversions are displayed in a grid of cards. The currently selected input unit is highlighted with the accent color to help you identify your source unit.

Values are automatically formatted to 4 decimal places maximum, with trailing zeros removed for cleaner display.

## Permalinks

The URL updates live as you type — no button required. Query parameters used:

- `value` — the numeric input value
- `unit` — the selected unit (px, rem, em, etc.)
- `base` — base font size in pixels
- `vw` — viewport width in pixels
- `vh` — viewport height in pixels

Share or bookmark the URL to return to the same conversion with all context preserved.

### Example permalinks

```
/css-unit?value=24&unit=px&base=16&vw=1920&vh=1080
```

Converts 24px with default context settings.

```
/css-unit?value=1.5&unit=rem&base=10&vw=375&vh=667
```

Converts 1.5rem with a 10px base font and mobile viewport dimensions.

Use the **Copy** button to copy the current URL to your clipboard.

Use the **Reset** button to clear the input, reset to default context values (16px base, 1920×1080 viewport), and return to the bare `/css-unit` path.

## Common Use Cases

- **Responsive design** — convert between px and relative units (rem, em, %)
- **Mobile development** — see how vw/vh units scale on different screen sizes
- **Accessibility** — verify rem/em sizes at different base font sizes
- **Design systems** — maintain consistent spacing across different unit systems
- **Print styles** — convert web units (px) to print units (pt, cm, mm, in)
- **Learning** — understand relationships between different CSS units

## Tips

- For responsive typography, use `rem` units to scale with the root font size
- For component-level scaling, use `em` units to scale with the parent element
- For full-width/height layouts, use `vw`/`vh` units to fill the viewport
- For print stylesheets, use `pt` or `cm`/`mm` units for precise physical dimensions
- Keep in mind that `em` and `%` calculations assume parent font size equals root font size in this tool
