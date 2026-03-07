# iframe-proxy

Proxy iframes securely with full event handling and introspection for debugging.

## Overview

`iframe-proxy` embeds any target URL inside a transparent iframe and relays `postMessage` events bidirectionally between the parent window and the embedded frame. It acts as a pass-through bridge — all messages flow through without modification, while the debug panel gives you full visibility into what's being sent.

## Query Parameters

### `url` (required)

The URL to embed. Must be a valid `http:` or `https:` URL. If omitted or invalid, the page shows an error.

```
/iframe-proxy?url=https://example.com
```

### `debug`

Set to `true` to enable debug mode. When active, the iframe is inset from the edges of the viewport and a side panel opens showing every relayed message in real time.

```
/iframe-proxy?url=https://example.com&debug=true
```

## Message Relay

All `postMessage` traffic is intercepted and forwarded:

- **parent → frame** — messages from the parent window are forwarded into the embedded iframe
- **frame → parent** — messages from the iframe are forwarded up to the parent window

Messages are forwarded with `*` as the target origin. This is intentional for a debugging proxy — do not use in contexts where origin validation is required.

## Debug Panel

When `debug=true`, a 320px side panel appears on the right showing each relayed message with:

- Direction indicator (`parent→frame` or `frame→parent`)
- Timestamp
- Full message data as formatted JSON

## Example

Embed a page and watch its messages:

```
/iframe-proxy?url=https://my-app.example.com&debug=true
```

From a parent page, send a message to the embedded frame:

```js
const proxy = document.querySelector('iframe');
proxy.contentWindow.postMessage({ type: 'ping' }, '*');
```

The proxy relays it to the embedded frame, and the debug panel logs the exchange.
