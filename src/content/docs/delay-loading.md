# Delay Loading

A target page whose **`load` event is genuinely deferred** by a configurable number of milliseconds. Useful as a slow-loading page to embed when you need to test how a parent — for example the [iframe proxy](/iframe-proxy?debug=true) — reacts to a child frame that finishes loading late.

## How it works

The page renders a hidden image pointing at `/api/delay?ms=<delay>`. That endpoint **holds the HTTP response open** for the requested time before returning a 1×1 transparent GIF. Because the browser's `load` event waits for every sub-resource — including images — to settle, the document's `load` event (and any embedding iframe's `onload`) does not fire until the delay has elapsed.

The image is non-render-blocking, so the page's UI and live countdown paint immediately while the load event is still pending. The image markup is server-rendered (via `getServerSideProps`) so the request starts during the initial document load rather than after hydration.

## The `delay` query parameter

| Param   | Meaning                          | Default | Max     |
| ------- | -------------------------------- | ------- | ------- |
| `delay` | Time to defer the load event, ms | `3000`  | `60000` |

```
/delay-loading?delay=5000
```

Values are clamped to the `0`–`60000` range. `0` loads normally with no deferral.

## Testing the iframe proxy

Point the proxy's debug harness at this page (the proxy URL is itself a query value, so the inner `url` must be **double-encoded**):

```
/iframe-proxy?debug=true&url=%2Fdelay-loading%3Fdelay%3D5000
```

The proxy emits its `loaded` event off the inner iframe's load event, so with a delaying target that relay arrives only after the configured delay — versus immediately for a normal page. On load this page also posts a `{ event: "delay-loaded", delayMs }` message to its parent, which appears in the proxy's debug panel.

## Permalink

The current `delay` value is encoded in the URL so the exact timing is shareable. Changing the delay reloads the page, since the deferral can only be applied on a fresh document load.
