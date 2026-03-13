# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev      # Start dev server at localhost:3000
pnpm build    # Production build (also runs TypeScript type checking)
pnpm start    # Run production server
```

There are no separate lint or test scripts — TypeScript strict mode checking happens during `pnpm build`.

## Architecture

Next.js app with file-based routing. Each tool lives at `src/pages/[tool-name]/index.tsx`. All tool logic runs entirely client-side (no backend processing); the only API routes are for webhooks (`/api/session`, `/api/webhook/[sessionId]`, `/api/events/[sessionId]`), OG image generation (`/api/og`), and a cron cleanup job.

**Styling:** CSS Modules only — one `src/styles/[tool-name].module.css` per page. Dark theme with CSS custom properties (`--bg`, `--card-bg`, `--border`, `--text`, `--muted`, `--accent`). No CSS framework.

**Path alias:** `@/*` maps to `src/*`.

## Adding a New Tool

1. **Page:** `src/pages/[tool-name]/index.tsx` — follow the pattern in any existing tool (e.g. `base64`, `color`)
2. **Styles:** `src/styles/[tool-name].module.css`
3. **Docs:** `src/content/docs/[tool-name].md` — auto-served at `/docs/[tool-name]` via dynamic route
4. **Index listing:** Add an entry to the `tools` or `experiments` array in `src/pages/index.tsx`

## Key Patterns

**URL sync (permalinks):** Tools write state to URL query params via `history.replaceState()` on every change, and restore from params in a `useEffect` on mount. This is the standard shareability pattern — nearly every tool uses it.

**Shared hooks/utils:**
- `useBranding()` — returns `{ name, domain, accent }` for the active domain (hypothesis.sh / conclusion.sh / falsify.sh / observation.sh). Use for `<title>` tags and any domain-aware text.
- `useIsIframe()` — hides clipboard copy buttons when the tool is embedded cross-origin.
- `copyToClipboard(text)` — clipboard write with older-browser fallback.

**Standard page structure:** `<div className={styles.page}>` → header block (eyebrow with domain link + docs link, `<h1>`, tagline) → `<hr className={styles.divider}>` → tool body → `<hr>` → permalink row.

**Experiments vs Tools:** `src/pages/index.tsx` separates the listing into `tools` and `experiments` arrays. Experiments (iframe-proxy, message-stream, message-factory, webhook) are grouped separately on the homepage.

## Multi-Domain Branding

The site serves under 4 domains with different accent colors. `src/lib/branding.ts` maps hostnames to branding configs; CSS variables are injected in `_app.tsx`. Always use `useBranding()` rather than hardcoding "hypothesis.sh".
