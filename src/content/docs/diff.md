# Text Diff

Compare two blocks of text side by side and see exactly what changed — additions highlighted in green, deletions in red with strikethrough.

## Usage

1. Paste your **original** text into the left textarea.
2. Paste the **modified** text into the right textarea.
3. The diff output updates instantly below.

## Modes

| Mode | Description |
|------|-------------|
| **Lines** | Compares line by line (default). Best for code, config files, logs. |
| **Words** | Compares word by word. Useful for prose and documentation. |
| **Chars** | Compares character by character. Useful for spotting subtle changes. |

## Stats

Above the diff output you'll see a summary: `+N lines/words/chars added` and `−N removed`, matching the active mode.

## Permalinks

Every change to either textarea or the mode selector updates the URL in place. Copy the URL from the **Permalink** row at the bottom to share the exact comparison with someone else. The state is encoded as base64 JSON in the `?v=` query parameter.

## Reset

Click **Reset** to clear both inputs and return to a blank state.
