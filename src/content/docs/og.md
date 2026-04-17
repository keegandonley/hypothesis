# OG Tags

Generate Open Graph and Twitter Card `<meta>` tags for any web page. Fill in the fields, preview how the link will appear when shared, and copy the tag block.

## What are Open Graph tags?

Open Graph (OG) tags are `<meta>` tags in your HTML `<head>` that control how a page appears when shared on social platforms — the title, image, and description shown in link previews on Twitter/X, LinkedIn, Slack, iMessage, and more.

## Fields

| Field | Tag | Notes |
|-------|-----|-------|
| Title | `og:title`, `twitter:title` | Keep under 60 characters |
| Description | `og:description`, `twitter:description` | Keep under 160 characters |
| Image URL | `og:image`, `twitter:image` | Recommended size: 1200×630px |
| Page URL | `og:url` | Canonical URL of the page |
| Site Name | `og:site_name` | Your brand or site name |
| Twitter @handle | `twitter:site` | Include the `@` prefix |
| OG Type | `og:type` | `website` for most pages |
| Twitter Card | `twitter:card` | `summary_large_image` shows a big image |

## Pasting into your HTML

Place the generated tags inside the `<head>` of your HTML:

```html
<head>
  <meta property="og:title" content="My Page" />
  <meta property="og:description" content="..." />
  ...
</head>
```

In Next.js App Router, use the `metadata` export instead of raw tags.
