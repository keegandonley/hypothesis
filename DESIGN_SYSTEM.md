# Design system

The interface keeps its monospace identity and domain accent colors. Shared
controls use restrained typography, visible boundaries, and compact spacing.

The first visual pass uses 13px editor/body text, 11px labels, and 22px tool
headings. Headings and buttons retain their written casing; secondary labels
remain uppercase with tighter tracking. Panel borders and background dots have
separate tokens so stronger boundaries do not brighten the grid. Shared panel
headers wrap their controls, and permalink rows stack their label below 480px.

Preserve the global coarse-pointer rule setting inputs, textareas, and selects
to `16px !important`. It prevents mobile focus zoom and intentionally overrides
the smaller desktop typography tokens.

## Shared components

Import controls from `@/components/ui`: `Button`, `CopyButton`, `Badge`, `Panel`,
`PanelHeader`, `PanelLabel`, `PanelBody`, `PageLayout`, `PermalinkRow`, and
`SearchField`. Keep domain behavior, filtering, and URL state in the page.

`PageLayout` renders metadata and the tool header as a fragment; the page still
owns its outer shell. `SearchField` owns the input and clear control; its
`onValueChange` callback receives both typed values and an empty string on clear.

Keep specialized controls (color swatches, reference category filters, media
controls) local when their semantics or appearance differ from the shared UI.
Use `CopyButton` for standard clipboard controls so embedding permissions are
respected. Use `useUrlSync` for page URL updates.

## Shared CSS

Compose `src/styles/primitives.module.css` from page CSS Modules:

```css
.page {
  composes: toolPageFixed from "./primitives.module.css";
}

.divider {
  composes: divider from "./primitives.module.css";
}
```

- `pageSurface`: background grid, font family, and foreground color for bespoke shells.
- `toolPage`: a vertically flowing tool shell with a viewport minimum height.
- `toolPageFixed`: a fixed viewport tool shell for independently scrolling panels.
- `editorGrid`: the repeated two-column editor layout; responsive overrides stay local.
- `editor`: the full-panel text editor's base declarations; focus and sizing variants stay local.
- `label`, `panelHeader`, `divider`: repeated structural styles used by components and pages.

Keep composition on a single local class, with local overrides after it. Preserve
page-specific height, overflow, responsive rules, and focus selectors when
reusing these primitives. Avoid replacing specialized styles solely because
their class names resemble a shared control.

Keep shell compositions flat: `toolPage` and `toolPageFixed` must explicitly
compose both `pageSurface` and `toolShell`. In the current Turbopack build, nesting
`pageSurface` inside `toolShell` drops the surface class from rendered tool pages.
Verify generated HTML class lists after composition changes; comparing source
declarations alone does not catch missing composed classes.

## Tokens

`src/styles/globals.css` defines shared spacing, radius, typography, motion,
page-grid, panel-padding, and status-color tokens. The shared primitives and UI
components consume them; specialized page styles retain their existing values.

`src/lib/branding.ts` supplies domain-specific `--accent` colors through `_app.tsx`.
Continue using those variables instead of a fixed brand color. Warning, info,
and blue status families preserve their distinct existing colors. `Badge`
continues to call its amber variant `warn` and its light-blue variant `ready`.
Sample palettes and generated content colors are not UI tokens.

## Verification

Run `pnpm build`, `pnpm test`, and `pnpm lint`. Compare lint output with the
baseline when pre-existing failures remain. Check both fixed and flowing tools,
reference search/clear, narrow layouts, and embedded/work-mode layouts when
changing shared styling.
