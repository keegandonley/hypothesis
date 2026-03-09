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

## Permalinks

The `?value=` query parameter holds the current base64 string. The URL updates live as you type — no button required.

Share or bookmark the URL to return to the same content. The page reads `?value=` on load and pre-populates both panels.

### Example permalink

```
/base64?value=SGVsbG8sIHdvcmxkIQ==
```

This decodes to `Hello, world!`.

Use the **Copy** button in the Permalink row to copy the current URL to your clipboard.
