export interface RegexToken {
  token: string;
  description: string;
  example: string;
  output?: string;
}

export interface RegexGroup {
  id: string;
  label: string;
  color: string;
  subtle: string;
  border: string;
  tokens: RegexToken[];
}

export const REGEX_GROUPS: RegexGroup[] = [
  {
    id: "anchors",
    label: "Anchors",
    color: "#2dd4bf",
    subtle: "#2dd4bf18",
    border: "#2dd4bf33",
    tokens: [
      { token: "^", description: "Start of string (or line in multiline mode).", example: "/^hello/", output: "matches hello at the start" },
      { token: "$", description: "End of string (or line in multiline mode).", example: "/world$/", output: "matches world at the end" },
      { token: "\\b", description: "Word boundary — position between a word character and a non-word character.", example: "/\\bcat\\b/", output: "matches cat, not concatenate" },
      { token: "\\B", description: "Non-word boundary — the inverse of \\b.", example: "/\\Bcat\\B/", output: "matches concatenate, not cat" },
    ],
  },
  {
    id: "classes",
    label: "Character Classes",
    color: "#60a5fa",
    subtle: "#60a5fa18",
    border: "#60a5fa33",
    tokens: [
      { token: ".", description: "Any character except newline (unless s/dotAll flag is set).", example: "/c.t/", output: "matches cat, cut, c3t" },
      { token: "[abc]", description: "Character set — matches any one of the listed characters.", example: "/[aeiou]/", output: "matches any vowel" },
      { token: "[^abc]", description: "Negated character set — matches any character NOT in the set.", example: "/[^aeiou]/", output: "matches any non-vowel" },
      { token: "[a-z]", description: "Character range — matches any character between a and z (inclusive).", example: "/[a-z]/", output: "matches any lowercase letter" },
      { token: "\\d", description: "Digit — equivalent to [0-9].", example: "/\\d+/", output: "matches 42, 007" },
      { token: "\\D", description: "Non-digit — equivalent to [^0-9].", example: "/\\D+/", output: "matches abc, hello" },
      { token: "\\w", description: "Word character — equivalent to [a-zA-Z0-9_].", example: "/\\w+/", output: "matches hello_world" },
      { token: "\\W", description: "Non-word character — equivalent to [^a-zA-Z0-9_].", example: "/\\W+/", output: "matches spaces and punctuation" },
      { token: "\\s", description: "Whitespace — space, tab, newline, carriage return, form feed.", example: "/\\s+/", output: "matches spaces and tabs" },
      { token: "\\S", description: "Non-whitespace — any character that isn't whitespace.", example: "/\\S+/", output: "matches non-space tokens" },
    ],
  },
  {
    id: "quantifiers",
    label: "Quantifiers",
    color: "#c084fc",
    subtle: "#c084fc18",
    border: "#c084fc33",
    tokens: [
      { token: "*", description: "Zero or more — greedy, matches as many as possible.", example: "/ab*/", output: "matches a, ab, abb, abbb" },
      { token: "+", description: "One or more — greedy.", example: "/ab+/", output: "matches ab, abb (not a)" },
      { token: "?", description: "Zero or one — makes the preceding token optional.", example: "/colou?r/", output: "matches color and colour" },
      { token: "{n}", description: "Exactly n repetitions.", example: "/\\d{4}/", output: "matches exactly 4 digits" },
      { token: "{n,}", description: "n or more repetitions.", example: "/\\d{2,}/", output: "matches 2 or more digits" },
      { token: "{n,m}", description: "Between n and m repetitions (inclusive).", example: "/\\d{2,4}/", output: "matches 2, 3, or 4 digits" },
      { token: "*?", description: "Lazy zero or more — matches as few as possible.", example: '/<.*?>/s', output: "matches shortest tag" },
      { token: "+?", description: "Lazy one or more.", example: "/\\d+?/", output: "matches minimal digits" },
      { token: "??", description: "Lazy zero or one.", example: "/colou??r/", output: "prefers color over colour" },
    ],
  },
  {
    id: "groups",
    label: "Groups & Capturing",
    color: "#fbbf24",
    subtle: "#fbbf2418",
    border: "#fbbf2433",
    tokens: [
      { token: "(abc)", description: "Capturing group — captures matched text and assigns a numbered backreference.", example: "/(\\w+)@(\\w+)/", output: "captures username and domain separately" },
      { token: "(?:abc)", description: "Non-capturing group — groups without capturing. Useful for applying quantifiers without saving the match.", example: "/(?:ab)+/", output: "matches ababab without capturing" },
      { token: "(?<name>abc)", description: "Named capturing group — like a capturing group but accessed by name.", example: "/(?<year>\\d{4})-(?<month>\\d{2})/", output: "groups.year, groups.month" },
      { token: "\\1", description: "Backreference — matches the same text captured by group 1.", example: "/(\\w+) \\1/", output: "matches repeated words like the the" },
      { token: "\\k<name>", description: "Named backreference — matches the text captured by the named group.", example: "/(?<q>['\"]).*?\\k<q>/", output: "matches matching quote pairs" },
      { token: "a|b", description: "Alternation — matches either a or b.", example: "/cat|dog/", output: "matches cat or dog" },
    ],
  },
  {
    id: "lookaround",
    label: "Lookahead & Lookbehind",
    color: "#34d399",
    subtle: "#34d39918",
    border: "#34d39933",
    tokens: [
      { token: "(?=abc)", description: "Positive lookahead — asserts that what follows matches abc, without consuming it.", example: "/\\d+(?= dollars)/", output: "matches 100 in '100 dollars'" },
      { token: "(?!abc)", description: "Negative lookahead — asserts that what follows does NOT match abc.", example: "/\\d+(?! dollars)/", output: "matches numbers not followed by dollars" },
      { token: "(?<=abc)", description: "Positive lookbehind — asserts that what precedes matches abc.", example: "/(?<=\\$)\\d+/", output: "matches digits after $" },
      { token: "(?<!abc)", description: "Negative lookbehind — asserts that what precedes does NOT match abc.", example: "/(?<!\\$)\\d+/", output: "matches digits not preceded by $" },
    ],
  },
  {
    id: "flags",
    label: "Flags",
    color: "#f87171",
    subtle: "#f8717118",
    border: "#f8717133",
    tokens: [
      { token: "g", description: "Global — find all matches, not just the first.", example: "/abc/g", output: "returns all matches" },
      { token: "i", description: "Case-insensitive — makes the pattern case-insensitive.", example: "/hello/i", output: "matches Hello, HELLO, hello" },
      { token: "m", description: "Multiline — ^ and $ match start/end of each line, not just the string.", example: "/^\\w+/m", output: "matches first word of every line" },
      { token: "s", description: "DotAll — makes . match newline characters too.", example: "/foo.bar/s", output: "matches across newlines" },
      { token: "u", description: "Unicode — enables full Unicode matching and disallows some ambiguous patterns.", example: "/\\u{1F600}/u", output: "correctly matches emoji code points" },
      { token: "y", description: "Sticky — anchors the match to lastIndex; only matches at that exact position.", example: "/\\d+/y", output: "matches only at current position" },
    ],
  },
  {
    id: "escapes",
    label: "Escape Sequences",
    color: "#a78bfa",
    subtle: "#a78bfa18",
    border: "#a78bfa33",
    tokens: [
      { token: "\\n", description: "Newline (line feed, LF).", example: "/line1\\nline2/", output: "matches across a newline" },
      { token: "\\r", description: "Carriage return (CR). Windows line endings are \\r\\n.", example: "/\\r\\n/", output: "matches Windows line ending" },
      { token: "\\t", description: "Horizontal tab.", example: "/\\t/", output: "matches tab character" },
      { token: "\\0", description: "Null character (NUL, U+0000).", example: "/\\0/", output: "matches null byte" },
      { token: "\\xhh", description: "Hexadecimal escape — matches the character with hex code hh.", example: "/\\x41/", output: "matches A (0x41)" },
      { token: "\\uhhhh", description: "Unicode escape — matches the character with the given 4-digit hex code point.", example: "/\\u00E9/", output: "matches é" },
      { token: "\\u{hhhh}", description: "Extended Unicode escape (requires u flag) — supports code points above U+FFFF.", example: "/\\u{1F600}/u", output: "matches 😀" },
    ],
  },
];
