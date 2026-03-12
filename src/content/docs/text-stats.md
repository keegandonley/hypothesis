# text stats

Analyze text statistics: character count, word count, reading time, and word frequency analysis — entirely in your browser.

## Overview

`text-stats` is a comprehensive text analysis tool that provides real-time statistics about your text. Type or paste any content into the text area and instantly see detailed metrics including character counts, word counts, time estimates, and frequency analysis. All processing happens in your browser — no text is sent to any server.

## Core Statistics

The tool provides 10 essential text metrics:

**Characters**  
Total number of characters including spaces, punctuation, and special characters.

**Without Spaces**  
Character count excluding all whitespace (spaces, tabs, newlines).

**Words**  
Number of words, calculated by splitting on whitespace. Empty strings are filtered out.

**Lines**  
Number of lines in the text, including empty lines.

**Sentences**  
Approximate sentence count, calculated by splitting on period (`.`), exclamation mark (`!`), and question mark (`?`). Sentences with only whitespace are ignored.

**Paragraphs**  
Number of paragraphs, calculated by splitting on double newlines. Paragraphs with only whitespace are ignored.

**Reading Time**  
Estimated time to read the text, calculated at your configured words-per-minute (WPM) rate. Default is 250 WPM (average adult reading speed for technical content). Displayed in `minutes:seconds` format.

**Speaking Time**  
Estimated time to speak the text aloud, calculated at 150 WPM (average speaking pace). Displayed in `minutes:seconds` format.

**Avg Word Length**  
Average number of characters per word, displayed to one decimal place.

**Longest Word**  
The longest word in your text by character count.

## Reading Speed

Adjust the **Reading Speed** input (in the text area header) to customize reading time calculations. The default is 250 WPM, but you can set it anywhere from 50 to 1000 WPM depending on:

- Content complexity (technical docs vs. fiction)
- Reader experience level
- Reading context (scanning vs. careful study)

Changes to reading speed update the Reading Time stat immediately. Speaking time always uses 150 WPM regardless of this setting.

## Word Frequency

When your text contains words, the tool displays a **Word Frequency** section showing the top 20 most common words and their occurrence counts.

Words are:
- Converted to lowercase for case-insensitive matching
- Stripped of non-alphanumeric characters
- Sorted by frequency (most common first)

This is useful for:
- Identifying overused words in writing
- Spotting keyword density for SEO
- Finding repetitive patterns in text
- Analyzing vocabulary diversity

## Character Frequency

The **Character Frequency** section shows the top 20 most common characters (excluding spaces, newlines, and tabs) and their occurrence counts.

Characters are sorted by frequency and displayed with their exact count.

This is useful for:
- Analyzing character distribution
- Spotting encoding issues or unusual characters
- Understanding text patterns
- Data validation and sanitization tasks

## Permalinks

The URL updates live as you type — no button required. Query parameters used:

- `v` — base64-encoded text content (to safely include special characters in URLs)
- `wpm` — reading speed in words per minute (omitted if 250, the default)

Share or bookmark the URL to return to the same text with all stats instantly computed.

### Example permalinks

```
/text-stats?v=SGVsbG8gd29ybGQ=
```

Loads "Hello world" with default 250 WPM reading speed.

```
/text-stats?v=VGhpcyBpcyBhIHRlc3Q=&wpm=200
```

Loads with custom 200 WPM reading speed.

Use the **Copy** button to copy the current URL to your clipboard.

Use the **Reset** button to clear the text, reset reading speed to 250 WPM, and return to the bare `/text-stats` path.

## Common Use Cases

- **Writing** — track word count and reading time for articles, blog posts, and essays
- **Content marketing** — analyze keyword frequency and content length
- **Editing** — identify overused words and improve vocabulary diversity
- **Academic work** — meet word count requirements and estimate reading time
- **SEO** — analyze keyword density and content statistics
- **Accessibility** — estimate how long content takes to read or speak
- **Data analysis** — examine character distribution and text patterns
- **Social media** — stay within character limits (Twitter, Instagram, etc.)

## Tips

- The sentence counter works best with standard punctuation (`.`, `!`, `?`)
- Paragraph detection requires double newlines between paragraphs
- Word frequency excludes punctuation, so "word" and "word." are counted as the same word
- Character frequency excludes whitespace to focus on meaningful content characters
- For accurate reading time, adjust WPM based on your audience and content type:
  - 200-250 WPM: average adult reading speed
  - 150-200 WPM: technical or complex content
  - 250-300 WPM: fast readers or simple content
  - 300+: speed reading or skimming
