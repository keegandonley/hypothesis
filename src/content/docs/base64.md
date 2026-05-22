# base64

Encode and decode base64 strings with live sync and shareable permalinks. Also encodes images to base64 / data URLs.

## Overview

`base64` is a browser-based encoder/decoder. It has two modes, switchable via the **TEXT** / **IMAGE** tabs at the top of the tool.

No server involved — everything runs in the browser.

## Text tab

Type in either the **Plain Text** or **Base64** panel and the other updates instantly using the built-in `btoa`/`atob` APIs.

Unicode is fully supported: plain text is UTF-8 encoded before conversion, so emoji and non-ASCII characters round-trip correctly.

### Encoding

Type or paste any text into the **Plain Text** panel. The **Base64** panel updates on every keystroke with the encoded output.

### Decoding

Type or paste a base64 string into the **Base64** panel. The **Plain Text** panel updates on every keystroke with the decoded output.

If the input is not valid base64, the plain text field is cleared rather than showing garbled output.

### JSON mode

Toggle **JSON Mode** in the Plain Text panel header to enable JSON-specific features:

- **Validation badge** — shows `valid` or `invalid` next to the toggle as you type.
- **Format button** — pretty-prints the JSON with 2-space indentation. Only enabled when the content is valid JSON.
- **Tab indentation** — pressing Tab inserts 2 spaces at the cursor; Shift+Tab removes up to 2 leading spaces from the current line.

JSON mode state is saved in the permalink (`?json=1`), so sharing or reloading the URL restores JSON mode automatically.

## Image tab

Drop any image file onto the drop zone (or click to browse) to base64-encode it. Two read-only outputs are provided:

- **Raw Base64** — the bare base64 string, suitable for APIs or custom `data:` URI construction.
- **Data URL** — the full `data:<mime>;base64,...` string, ready to drop into an `<img src>`, CSS `background-image`, or anywhere a data URL is accepted.

Both outputs have a **Copy** button. Files over 5 MB are accepted but will produce very large output strings.

## Permalinks

The URL updates live as you type (text tab) or switch tabs (image tab).

Query parameters used:

- `value` — the current base64-encoded string (text tab only)
- `json` — set to `1` when JSON mode is active (text tab only)
- `tab` — set to `image` when the image tab is active

Image content is not saved to the URL (files are too large), so reloading on the image tab restores the tab state but not the image itself.

### Example permalinks

```
/base64?value=SGVsbG8sIHdvcmxkIQ==
```

Decodes to `Hello, world!` in plain text mode.

```
/base64?value=eyJoZWxsbyI6IndvcmxkIn0=&json=1
```

Decodes to `{"hello":"world"}` with JSON mode active.

```
/base64?tab=image
```

Opens the tool directly on the Image tab.

Use the **Copy** button in the Permalink row to copy the current URL to your clipboard.

Use the **Reset** button to clear both panels, turn off JSON mode, and return the URL to the bare `/base64` path.
