# regex

Test regular expressions against strings with live match results and shareable permalinks.

## Overview

`regex` is a browser-based regular expression tester. Enter a pattern and a set of test strings to see which lines match, how many matches were found, and what capture groups were extracted — all computed live with no server involved. The full state is encoded in the URL so results are easy to share.

## Pattern

Type a pattern into the **Pattern** panel. The input is displayed between `/` delimiters to visually reflect regex literal syntax.

The panel header shows one of three states:

- **valid** — the pattern compiles and no test strings have been entered yet
- **N/M match** — N of M non-empty test strings matched
- **error: \<message\>** — the pattern is not a valid regular expression

Patterns are compiled using the browser's built-in `RegExp` constructor. Any pattern accepted by `new RegExp(pattern, flags)` is valid.

## Flags

Five flag toggles sit to the right of the pattern input. Click any flag to enable or disable it.

| Flag | Name | Effect |
|------|------|--------|
| `g` | global | Find all matches in a string, not just the first |
| `i` | ignore case | Case-insensitive matching |
| `m` | multiline | `^` and `$` match the start/end of each line |
| `s` | dotAll | `.` matches newline characters |
| `u` | unicode | Treat the pattern and input as Unicode |

The `g` flag is enabled by default. Match counts in the Results panel reflect the total number of non-overlapping matches per line.

## Test Strings

Enter one test string per line in the **Test Strings** panel. Each non-empty line is tested independently against the pattern. The panel header shows the total line count.

## Results

The **Results** panel shows one row per non-empty test string:

- The full test string (truncated with `…` if it overflows)
- A **match** badge with the number of matches found, or a **no match** badge
- If the pattern contains capture groups, the captured values are shown as chips below the string

When no pattern is entered, or when the pattern is invalid, the results panel shows a placeholder message.

## Permalinks

The URL updates live as you type — no button required. All state is encoded into a single `v` query parameter as a Base64-encoded JSON object:

```
/regex?v=<base64>
```

The encoded object has three fields:

```json
{ "p": "<pattern>", "f": "<flags>", "s": "<test strings>" }
```

Reloading or sharing the URL fully restores the pattern, active flags, and test strings.

Use the **Copy** button in the Permalink row to copy the current URL to your clipboard.

Use the **Reset** button to clear the pattern, test strings, and all flags (resetting `g` to on), and return the URL to the bare `/regex` path.
