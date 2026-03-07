# messages

Capture and inspect frame messages in real time.

## Overview

`messages` is a lightweight receiver page designed to be embedded as an iframe. It listens for `postMessage` events from any origin and displays each message with its data, origin, and timestamp. Drop it into a frame and use it to verify what your parent page is sending.

## Query Parameters

### `seed`

Set to `true` to pre-populate the view with a sample message. Useful for checking layout and styling before any real traffic arrives.

```
/messages?seed=true
```

### `context`

A base64-encoded JSON string displayed as a separate "Context" block above the message feed. Use this to pass identifying information into the embedded page — for example, which test case or environment loaded it.

```
/messages?context=eyJ0ZXN0IjoidHJ1ZSJ9
```

Building the value in JavaScript:

```js
const context = btoa(JSON.stringify({ env: 'staging', run: 42 }));
const url = `/messages?context=${context}`;
```

## Message Feed

Each received message is shown as a card with:

- **Index** — sequential number in reverse order (newest first)
- **Timestamp** — local time of receipt
- **Origin** — the `event.origin` of the sender
- **Data** — the full `event.data` payload as formatted JSON

Messages accumulate for the lifetime of the page. There is no cap or auto-clear.

## Example

Embed the page in a parent document:

```html
<iframe src="/messages" id="receiver"></iframe>
```

Then send messages from the parent:

```js
const frame = document.getElementById('receiver');
frame.contentWindow.postMessage({ type: 'hello', value: 1 }, '*');
```

Each message appears in the feed immediately. Combine with `seed=true` during development to see the layout populated before wiring up real message sources.
