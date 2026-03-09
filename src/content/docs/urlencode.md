# urlencode

Encode and decode URL strings with live sync and shareable permalinks.

## Overview

`urlencode` is a browser-based percent-encoder/decoder. Type in either the **Decoded** or **URL Encoded** panel and the other updates instantly. No server involved — everything runs in the browser using the built-in `encodeURIComponent` / `decodeURIComponent` APIs.

## Encoding

Type or paste any text into the **Decoded** panel. The **URL Encoded** panel updates on every keystroke with the percent-encoded output.

Default encoding uses `encodeURIComponent`:

```js
encodeURIComponent(value)
```

This encodes all characters except: `A–Z a–z 0–9 - _ . ! ~ * ' ( )`

## Decoding

Type or paste a percent-encoded string into the **URL Encoded** panel. The **Decoded** panel updates on every keystroke with the decoded output.

If the input contains an invalid percent-escape sequence, the decoded field is cleared rather than showing garbled output.

Decoding uses:

```js
decodeURIComponent(value)
```

## URI Mode

Toggle **URI Mode** in the Decoded panel header to switch the encoding function from `encodeURIComponent` to `encodeURI`.

```js
encodeURI(value)
```

`encodeURI` preserves characters that have structural meaning in a full URI:

| Character | Component mode | URI mode |
|-----------|---------------|----------|
| `?`       | `%3F`         | `?`      |
| `=`       | `%3D`         | `=`      |
| `&`       | `%26`         | `&`      |
| `/`       | `%2F`         | `/`      |
| `#`       | `%23`         | `#`      |
| `:`       | `%3A`         | `:`      |

Use **URI Mode** when encoding a complete URL. Use the default (component) mode when encoding a single query parameter value.

URI mode state is saved in the permalink (`?mode=uri`), so sharing or reloading the URL restores the mode automatically.

## Permalinks

The URL updates live as you type — no button required. Two query parameters are used:

- `value` — the raw decoded text (the browser percent-encodes it naturally in the URL)
- `mode` — set to `uri` when URI mode is active (omitted in default component mode)

Share or bookmark the URL to return to the same content. Both panels and URI mode are restored on load.

### Example permalinks

```
/urlencode?value=hello+world
```

Encodes to `hello%2Bworld` in component mode.

```
/urlencode?value=https%3A%2F%2Fexample.com%2Fpath%3Ffoo%3Dbar&mode=uri
```

Opens `https://example.com/path?foo=bar` with URI mode active.

Use the **Copy** button in the Permalink row to copy the current URL to your clipboard.

Use the **Reset** button to clear both panels, turn off URI mode, and return the URL to the bare `/urlencode` path.
