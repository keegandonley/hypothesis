# message factory

Design and trigger postMessage actions with an interactive viewer and designer.

## Overview

`message-factory` is a two-part tool for working with `postMessage` across frames. The **designer** lets you compose a set of named actions and generate a shareable URL. The **viewer** loads those actions and renders a button for each one — clicking a button fires the corresponding `postMessage` to the parent frame.

The typical workflow: build your action set in the designer, copy the viewer link, and embed that viewer URL in an iframe inside whatever page you are testing.

## message-designer

Build arrays of postMessage actions and generate shareable permalinks.

### Fields

Each action has three fields:

- **name** — the button label shown in the viewer
- **id** — the identifier sent as part of the message payload
- **payload** — a JSON object merged into the message. Must be valid JSON; an `invalid json` badge appears if it is not.

### URL encoding

Actions are serialized to a base64-encoded JSON string and stored in the `?actions=` query parameter. The URL updates live as you type — copy it at any point to share the current state.

### Viewer link

The **Copy Viewer Link** button copies a pre-built viewer URL with the same `?actions=` payload. **Open Viewer** opens it in a new tab. **Open Viewer (debug)** opens it with `?debug=true`, which shows the permalink and designer link inside the viewer.

### Reset

**Reset** clears all actions and removes the `?actions=` parameter from the URL.

## message-viewer

Load actions from a URL and trigger postMessage to the parent frame.

### Loading actions

Actions are read from the `?actions=` query parameter on page load. If no parameter is present, the viewer shows an empty state with a link to the designer.

### Sending a message

Each button triggers `window.parent.postMessage` with:

```js
{ id: action.id, payload: action.payload }
```

The message is sent to `"*"` (any origin). A brief **sent ✓** overlay confirms the send.

### Debug mode

Add `?debug=true` to the viewer URL to reveal the permalink and a link back to the designer. This is hidden by default to keep the viewer clean when embedded as an iframe.

### Embedding

Embed the viewer in a parent page and listen for messages:

```html
<iframe src="/message-factory/viewer?actions=..." id="viewer"></iframe>
```

```js
window.addEventListener("message", (event) => {
  console.log(event.data); // { id: '...', payload: { ... } }
});
```
