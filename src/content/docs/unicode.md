# unicode inspector

Inspect each character's code point, UTF-8/UTF-16 encoding, Unicode category, script, and HTML entity — entirely in your browser.

## Overview

`unicode` is a per-character breakdown tool for any text. Paste or type text and instantly see a detailed card for every Unicode code point: its hex code point, decimal value, raw bytes in UTF-8 and UTF-16, Unicode general category, script, and HTML entity. All processing happens locally — no text is sent to any server.

This is useful any time you need to debug encoding issues, understand how a character is represented in memory, or inspect emoji and multi-byte characters.

## Character Cards

Each Unicode code point gets its own card with eight fields:

**Code Point**
The Unicode code point in `U+XXXX` format (e.g. `U+0041` for `A`, `U+1F600` for 😀).

**Decimal**
The code point expressed as a decimal integer (e.g. `65` for `A`).

**UTF-8**
The byte sequence used to encode this code point in UTF-8, shown as space-separated uppercase hex bytes (e.g. `41` for ASCII characters, `F0 9F 98 80` for 😀). ASCII characters are single-byte; characters above U+007F require 2–4 bytes.

**UTF-16**
The code unit(s) used in UTF-16 encoding, shown as space-separated uppercase hex values. Characters in the Basic Multilingual Plane (U+0000–U+FFFF) are a single 4-digit code unit. Characters above U+FFFF (supplementary characters, many emoji) are represented as a surrogate pair — two 4-digit code units (e.g. `D83D DE00` for 😀).

**Category**
The Unicode general category, which classifies what kind of character it is. Examples:
- `Letter, Uppercase (Lu)` — `A`, `Z`
- `Letter, Lowercase (Ll)` — `a`, `z`
- `Number, Decimal (Nd)` — `0`–`9`
- `Punctuation, Other (Po)` — `.`, `!`, `?`
- `Symbol, Other (So)` — most emoji
- `Separator, Space (Zs)` — space
- `Other, Control (Cc)` — tab, newline

**Script**
The Unicode script the character belongs to. Detected scripts include: Latin, Greek, Cyrillic, Han, Hiragana, Katakana, Arabic, Hebrew, Devanagari, Bengali, Thai, Hangul, Georgian, Armenian, Ethiopic, Common, and Emoji. Characters not matching a known script show `Unknown`.

**HTML Entity**
The HTML entity representation. Common characters have named entities (e.g. `&amp;`, `&lt;`, `&copy;`). All other characters use the hexadecimal numeric form `&#xXXXX;` (e.g. `&#x41;` for `A`).

## Unicode Code Points vs. Characters

Text is iterated by Unicode code point, not by JavaScript string index. This matters for:

- **Emoji** — most emoji are a single code point above U+FFFF (e.g. 😀 is U+1F600) but occupy two JavaScript string positions (a UTF-16 surrogate pair). The inspector shows one card per code point.
- **Combining sequences** — some emoji are sequences of multiple code points joined by Zero Width Joiner (U+200D), such as 👨‍👩‍👧. Each code point in the sequence gets its own card.
- **Diacritics** — characters like `é` can be either a precomposed code point (U+00E9) or a base letter `e` plus a combining accent (U+0065 + U+0301). Both forms are shown faithfully.

## Limits

For performance, the inspector displays a maximum of **512 code points**. If your input exceeds this, a notice appears below the text area showing how many total code points were found. Only the first 512 are rendered.

## Permalinks

The URL updates live as you type — no button required. The query parameter used:

- `v` — the text content, encoded as `btoa(encodeURIComponent(text))`

Share or bookmark the URL to return to the same inspection state.

### Example permalink

```
/unicode?v=SGVsbG8%3D
```

Loads the text `Hello` and shows cards for each of its 5 code points.

Use the **Copy** button to copy the current URL to your clipboard.

Use the **Reset** button to clear the input and return to the bare `/unicode` path.

## Common Use Cases

- **Debugging encoding issues** — identify unexpected bytes or misencoded characters in data pipelines
- **Inspecting emoji** — see which code points make up a complex emoji sequence or ZWJ sequence
- **Understanding multi-byte characters** — learn how CJK characters, Arabic, or Devanagari map to UTF-8 bytes
- **HTML escaping** — find the correct numeric entity for any character
- **Security research** — detect homoglyphs, invisible formatting characters (U+200B, U+FEFF), or unusual Unicode control codes
- **Internationalization** — verify script detection and category classification for locale-sensitive text handling
- **Learning Unicode** — explore how the encoding system works across different writing systems

## See also

- [Unicode Blocks](/references/unicode-blocks) — named code point ranges from Basic Latin to Supplementary planes
- [ASCII Table](/references/ascii) — all 128 ASCII characters with decimal, hex, octal, and descriptions
