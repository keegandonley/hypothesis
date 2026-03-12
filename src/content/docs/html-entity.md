# html entity

Encode and decode HTML entities for safe display in web pages with multiple encoding modes.

## Overview

`html-entity` is a browser-based HTML entity encoder and decoder. Type in either the **Decoded Text** or **HTML Entities** panel and the other updates instantly. No server involved — everything runs in your browser using JavaScript character mapping and entity tables.

## Encoding

Type or paste any text into the **Decoded Text** panel. The **HTML Entities** panel updates on every keystroke with the encoded output based on the selected encoding mode.

### Encoding Modes

**Special (& < > " ')**  
Default mode. Only encodes essential HTML special characters:
- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`
- `'` → `&apos;`

This is the most common mode for safely escaping user input in HTML contexts.

**Non-ASCII Only**  
Encodes only characters outside the ASCII range (0-127), leaving standard English characters unchanged. Non-ASCII characters are encoded to either named entities (e.g. `é` → `&eacute;`) or numeric entities (e.g. `⚡` → `&#9889;`) depending on availability.

**All Characters**  
Encodes all special HTML characters plus all non-ASCII characters. This provides maximum compatibility for systems that require full entity encoding.

## Decoding

Type or paste HTML entities into the **HTML Entities** panel. The **Decoded Text** panel updates on every keystroke with the decoded output.

The decoder supports:
- **Named entities** — `&amp;`, `&lt;`, `&eacute;`, `&copy;`, etc.
- **Decimal numeric entities** — `&#38;`, `&#233;`, `&#169;`
- **Hexadecimal numeric entities** — `&#x26;`, `&#xe9;`, `&#xa9;`

If the input contains an unrecognized entity, it remains unchanged rather than causing errors.

## Entity Support

This tool includes comprehensive HTML5 named entity support, covering:
- Basic HTML entities (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;`)
- Latin characters with diacritics (`&agrave;`, `&eacute;`, `&ntilde;`)
- Currency symbols (`&euro;`, `&pound;`, `&yen;`)
- Mathematical symbols (`&plusmn;`, `&times;`, `&divide;`, `&infin;`)
- Greek letters and mathematical operators (`&alpha;`, `&sum;`, `&int;`)
- Arrows and special characters (`&larr;`, `&copy;`, `&trade;`)
- And many more (2000+ entities supported)

## Permalinks

The URL updates live as you type — no button required. Two query parameters are used:

- `value` — the raw decoded text
- `mode` — the encoding mode: `special` (default), `ascii`, or `all`

Share or bookmark the URL to return to the same content. Both panels and the selected mode are restored on load.

### Example permalinks

```
/html-entity?value=Hello <world>
```

Encodes to `Hello &lt;world&gt;` in special mode.

```
/html-entity?value=Café résumé&mode=ascii
```

Opens with non-ASCII mode active, encoding accented characters.

Use the **Copy** button in the Permalink row to copy the current URL to your clipboard.

Use the **Reset** button to clear both panels, reset to special mode, and return the URL to the bare `/html-entity` path.

## Common Use Cases

- **Escaping user input** for safe HTML display
- **Converting special characters** in XML or XHTML documents
- **Decoding entities** from legacy HTML or email sources
- **Testing entity support** in different browsers or systems
- **Learning** what characters map to which entities
