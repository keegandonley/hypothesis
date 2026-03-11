# pretty print

Format and validate JSON with live pretty-printing and shareable permalinks.

## Overview

`pretty-print` is a browser-based JSON formatter. Paste raw JSON into the **Input** panel and the **Formatted** panel instantly shows it indented with 2-space nesting. Validation runs on every keystroke with no server involved — everything uses the browser's built-in `JSON.parse`.

## Input

Paste any JSON into the **Input** panel. The panel header shows:

- A character count badge
- A **valid** badge when the input is parseable JSON
- An **invalid** badge when the input cannot be parsed

The formatted output updates on every keystroke. If the input is empty or invalid, the Formatted panel is cleared.

## Formatted output

The **Formatted** panel is read-only and shows the pretty-printed result of `JSON.stringify(parsed, null, 2)`. A **Copy** button appears in the bottom-right corner of the panel when there is output — click it to copy the formatted JSON to your clipboard.

## Permalinks

The URL updates live as you type — no button required. The current input is base64-encoded and stored in a single `v` query parameter:

```
/pretty-print?v=<base64>
```

Reloading or sharing the URL restores the input and re-formats the output automatically.

### URL length limit

Because JSON can be arbitrarily large, the permalink is only shareable when the full URL stays under 2000 characters. When the limit is exceeded:

- The URL field shows _url too long to share_ in muted text
- The **Copy** button is disabled and greyed out

Use the **Reset** button to clear both panels and return the URL to the bare `/pretty-print` path.
