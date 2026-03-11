# message stream

Capture and inspect frame messages in real time.

## Overview

`message-stream` is a lightweight receiver page designed to be embedded as an iframe. It listens for `postMessage` events from any origin and displays each message with its data, origin, and timestamp. Drop it into a frame and use it to verify what your parent page is sending.

## Query Parameters

### `seed`

Set to `true` to pre-populate the view with a sample message. Useful for checking layout and styling before any real traffic arrives.

```
/message-stream?seed=true
```

### `context`

A base64-encoded JSON string displayed as a separate "Context" block above the message feed. Use this to pass identifying information into the embedded page — for example, which test case or environment loaded it.

```
/message-stream?context=eyJ0ZXN0IjoidHJ1ZSJ9
```

Building the value in JavaScript:

```js
const context = btoa(JSON.stringify({ env: "staging", run: 42 }));
const url = `/message-stream?context=${context}`;
```

## Sending Messages

The page includes a text field for sending test messages to the parent frame. Enter any string and press **Send Message** (or hit Enter). The message is posted as:

```js
{ action: "hypothesis-test", content: "<your input>" }
```

Sent messages appear in the feed alongside received messages, clearly labeled so you can follow the full conversation.

## Message Feed

Each message is shown as a card with:

- **Direction badge** — `↓ received` (green) for messages from the parent, `↑ sent` (blue) for messages sent to the parent
- **Index** — sequential number in reverse order (newest first)
- **Timestamp** — local time of receipt or send
- **Origin** — the `event.origin` of the sender (for received messages, your own origin for sent)
- **Data** — the full payload as formatted JSON

Messages accumulate for the lifetime of the page. There is no cap or auto-clear.

## Example

Embed the page in a parent document:

```html
<iframe src="/message-stream" id="receiver"></iframe>
```

Then send messages from the parent:

```js
const frame = document.getElementById("receiver");
frame.contentWindow.postMessage({ type: "hello", value: 1 }, "*");
```

Each message appears in the feed immediately. Use the send field inside the frame to post replies back to the parent and verify bidirectional handling. Combine with `seed=true` during development to see the layout populated before wiring up real message sources.
