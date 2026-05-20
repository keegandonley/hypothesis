# multi-domain support

The app is available on multiple domains, to facilitate cross-domain testing and experimentation.

## Supported domains

- `hypothesis.sh`
- `conclusion.sh`
- `falsify.sh`
- `observation.sh`

## What changes per domain

- **Site name** — displayed in the page title and header
- **Domain label** — shown in headers and links
- **Message action type** — the `type` field used in outgoing `postMessage` events (e.g. `hypothesis-test`, `conclusion-test`, `falsify-test`, `observation-test`)

All other behaviour is identical across domains.

## Mobile app

The tools are available inside a native mobile app. The app embeds individual tool pages in a web view and relies on work mode (see below) to strip the web-only chrome.

## Work mode

Work mode is a stripped-down rendering of a tool page intended for embedding — either in the `/work` multi-tab workspace or in the mobile app.

**Activation:** append `?workMode=1` to any tool URL. The page detects this at load time and adds the `work-mode` class to `<html>`.

**What it hides:** elements marked with `data-eyebrow` (the domain/docs header row) and `data-permalink-row` (the share link at the bottom), plus the `<hr>` that follows the eyebrow. The tool content itself is unaffected.

**Implementation note for new tools:** every header/eyebrow element must carry a `data-eyebrow` attribute so the mobile app can hide it correctly. The permalink row must carry `data-permalink-row`.
