# multi-domain

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
