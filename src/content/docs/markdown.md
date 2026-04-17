# Markdown to HTML

Convert Markdown to HTML with a live preview. Paste or type Markdown on the left and see the rendered output instantly.

## View modes

- **Preview** — rendered HTML displayed as a styled document
- **HTML** — the raw HTML source output, ready to copy and embed

## Supported syntax

This tool uses [marked](https://github.com/markedjs/marked) and supports the CommonMark spec plus GitHub Flavored Markdown extensions:

| Syntax | Output |
|--------|--------|
| `# Heading` | `<h1>` through `<h6>` |
| `**bold**` | `<strong>` |
| `_italic_` | `<em>` |
| `` `code` `` | `<code>` |
| ` ```lang ``` ` | `<pre><code>` fenced block |
| `> text` | `<blockquote>` |
| `- item` | `<ul><li>` |
| `1. item` | `<ol><li>` |
| `[text](url)` | `<a href="url">` |
| `![alt](url)` | `<img>` |
| `---` | `<hr>` |
| `| col |` | `<table>` |

## Permalinks

The Markdown content is Base64-encoded and stored in the URL so you can bookmark or share it.
