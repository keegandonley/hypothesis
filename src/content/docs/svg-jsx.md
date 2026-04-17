# SVG to JSX

Convert SVG markup to React-ready JSX. Paste any SVG and get a component you can drop directly into a React or Next.js project.

## What it converts

| SVG | JSX |
|-----|-----|
| `xmlns="..."` | Removed (not needed in JSX) |
| `class="..."` | `className="..."` |
| `stroke-width="2"` | `strokeWidth={2}` |
| `fill-opacity="0.5"` | `fillOpacity={0.5}` |
| `style="color: red"` | `style={{ color: "red" }}` |
| `xlink:href="..."` | `href="..."` |
| Self-closing tags | Properly self-closed with ` />` |

## Output format

The converted SVG is wrapped in a functional React component:

```jsx
export default function Icon(props) {
  return (
    <svg ...>
      ...
    </svg>
  );
}
```

## Usage tips

- Add `{...props}` spread to the `<svg>` tag to forward `className`, `width`, `height`, etc. from the parent
- Replace hardcoded `fill` or `stroke` colors with `currentColor` to inherit CSS color
- For icon libraries, consider adding a `title` prop for accessibility

## Limitations

- Inline `<style>` blocks are not converted — move styles to CSS or use `className`
- JavaScript event handlers in SVG (rare) are left as-is and may need manual adjustment
