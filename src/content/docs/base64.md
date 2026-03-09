# base64

Encode and decode base64 strings with live sync and shareable permalinks.

## Overview

`base64` is a browser-based encoder/decoder. Type in either the **Plain Text** or **Base64** panel and the other updates instantly. No server involved — everything runs in the browser using the Web Crypto / built-in `btoa`/`atob` APIs.

Unicode is fully supported: plain text is UTF-8 encoded before conversion, so emoji and non-ASCII characters round-trip correctly.

## Encoding

Type or paste any text into the **Plain Text** panel. The **Base64** panel updates on every keystroke with the encoded output.

Encoding uses the standard UTF-8 → base64 pipeline:

```js
btoa(unescape(encodeURIComponent(value)))
```

## Decoding

Type or paste a base64 string into the **Base64** panel. The **Plain Text** panel updates on every keystroke with the decoded output.

If the input is not valid base64, the plain text field is cleared rather than showing garbled output.

Decoding uses the reverse pipeline:

```js
decodeURIComponent(escape(atob(value)))
```

## JSON mode

Toggle **JSON Mode** in the Plain Text panel header to enable JSON-specific features:

- **Validation badge** — shows `valid` or `invalid` next to the toggle as you type.
- **Format button** — pretty-prints the JSON with 2-space indentation. Only enabled when the content is valid JSON.
- **Tab indentation** — pressing Tab inserts 2 spaces at the cursor; Shift+Tab removes up to 2 leading spaces from the current line.

JSON mode state is saved in the permalink (`?json=1`), so sharing or reloading the URL restores JSON mode automatically.

## Permalinks

The URL updates live as you type — no button required. Two query parameters are used:

- `value` — the current base64-encoded string
- `json` — set to `1` when JSON mode is active

Share or bookmark the URL to return to the same content. Both panels and JSON mode are restored on load.

### Example permalinks

```
/base64?value=SGVsbG8sIHdvcmxkIQ==
```

Decodes to `Hello, world!` in plain text mode.

```
/base64?value=eyJoZWxsbyI6IndvcmxkIn0=&json=1
```

Decodes to `{"hello":"world"}` with JSON mode active.

Use the **Copy** button in the Permalink row to copy the current URL to your clipboard.

Use the **Reset** button to clear both panels, turn off JSON mode, and return the URL to the bare `/base64` path.
