# Color Shades

Generate an 11-step color scale from any hex color — matching the `50, 100, 200 … 900, 950` steps used by Tailwind CSS and most design systems.

## How it works

The scale is generated in **OKLCH** color space, which is perceptually uniform. This means the visual difference between adjacent steps looks consistent across the full range — unlike HSL-based approaches which tend to produce muddy midtones.

## Steps

| Step | Perceived lightness |
|------|---------------------|
| 50 | Very light (near white) |
| 100 | Light |
| 200–400 | Light-to-mid |
| 500 | Mid (close to the input color) |
| 600–800 | Mid-to-dark |
| 900 | Dark |
| 950 | Very dark (near black) |

## Copying

- **Click any shade** to copy its hex value
- **Copy as Tailwind** exports the full palette as a JavaScript object:

```js
{
  50: "#f0f9ff",
  100: "#e0f2fe",
  ...
  950: "#082f49"
}
```

Paste it into your `tailwind.config` `colors` section.

## Permalink

The selected color is encoded in the URL for sharing.
