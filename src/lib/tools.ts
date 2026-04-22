export type Tag =
  | "encoding"
  | "security"
  | "conversion"
  | "web"
  | "sysadmin"
  | "text";

export const ALL_TAGS: Tag[] = [
  "encoding",
  "security",
  "conversion",
  "web",
  "sysadmin",
  "text",
];

export const TAG_COLORS: Record<Tag, { color: string; subtle: string }> = {
  encoding: { color: "#60a5fa", subtle: "#60a5fa18" },
  security: { color: "#f87171", subtle: "#f8717118" },
  conversion: { color: "#c084fc", subtle: "#c084fc18" },
  web: { color: "#2dd4bf", subtle: "#2dd4bf18" },
  sysadmin: { color: "#fbbf24", subtle: "#fbbf2418" },
  text: { color: "#34d399", subtle: "#34d39918" },
};

export interface ToolItem {
  kind: "tool";
  name: string;
  description: string;
  href: string;
  docsHref: string;
  tags: Tag[];
}

export interface ExperimentItem {
  kind: "experiment";
  id: string;
  name: string;
  description: string;
  href: string;
  docsHref: string;
}

export interface ReferenceItem {
  kind: "reference";
  name: string;
  description: string;
  href: string;
  tags: Tag[];
}

export type AnyItem = ToolItem | ExperimentItem | ReferenceItem;

export const references: ReferenceItem[] = [
  {
    kind: "reference",
    name: "CSS selectors",
    description:
      "All CSS selector types with descriptions, examples, and specificity values: basic, attribute, pseudo-class, pseudo-element, and combinators.",
    href: "/references/css-selectors",
    tags: ["web"],
  },
  {
    kind: "reference",
    name: "DNS record types",
    description:
      "A, AAAA, CNAME, MX, TXT, NS, SOA, SRV, CAA, and DNSSEC records — what each does, when to use it, and example syntax.",
    href: "/references/dns-record-types",
    tags: ["web", "sysadmin"],
  },
  {
    kind: "reference",
    name: "Exit codes",
    description:
      "Standard Unix/Linux process exit codes: 0 success, 1 general error, 126/127 shell errors, and 128+N signal offsets.",
    href: "/references/exit-codes",
    tags: ["sysadmin"],
  },
  {
    kind: "reference",
    name: "HTTP status codes",
    description:
      "Complete reference for HTTP response status codes: 1xx through 5xx, with descriptions, use cases, and caching behavior.",
    href: "/references/http-status-codes",
    tags: ["web"],
  },
  {
    kind: "reference",
    name: "MIME types",
    description:
      "Content-Type values for text, application, image, audio, video, font, and multipart formats with file extensions.",
    href: "/references/mime-types",
    tags: ["web"],
  },
  {
    kind: "reference",
    name: "Unix signals",
    description:
      "Signal numbers, names, and default actions for POSIX signals — from SIGTERM and SIGKILL to SIGWINCH and SIGCHLD.",
    href: "/references/unix-signals",
    tags: ["sysadmin"],
  },
  {
    kind: "reference",
    name: "HTTP headers",
    description:
      "Request and response header fields: caching, authentication, CORS, security, content negotiation, and more.",
    href: "/references/http-headers",
    tags: ["web"],
  },
  {
    kind: "reference",
    name: "ASCII table",
    description:
      "All 128 ASCII characters with decimal, hexadecimal, octal, and named descriptions.",
    href: "/references/ascii",
    tags: ["text", "encoding"],
  },
  {
    kind: "reference",
    name: "Unicode blocks",
    description:
      "Named code point ranges from Basic Latin to Supplementary planes, with assigned character counts and sample glyphs.",
    href: "/references/unicode-blocks",
    tags: ["text", "encoding"],
  },
  {
    kind: "reference",
    name: "Port numbers",
    description:
      "Well-known TCP and UDP port numbers grouped by category: web, remote access, database, mail, file transfer, network, and more.",
    href: "/references/port-numbers",
    tags: ["sysadmin", "web"],
  },
  {
    kind: "reference",
    name: "Regex syntax",
    description:
      "Regular expression quick reference: anchors, character classes, quantifiers, groups, lookaheads, flags, and escape sequences.",
    href: "/references/regex-syntax",
    tags: ["text", "web"],
  },
  {
    kind: "reference",
    name: "Timezones",
    description:
      "IANA timezone names with live current time, UTC offsets, abbreviations, and major cities.",
    href: "/references/timezones",
    tags: ["web", "sysadmin"],
  },
];

export const experiments: ExperimentItem[] = [
  {
    kind: "experiment",
    id: "EXP-001",
    name: "iframe proxy",
    description:
      "Proxy iframes securely with full event handling and introspection for debugging.",
    href: "/iframe-proxy?debug=true",
    docsHref: "/docs/iframe-proxy",
  },
  {
    kind: "experiment",
    id: "EXP-002",
    name: "message stream",
    description: "Capture and inspect frame messages in real time.",
    href: "/message-stream",
    docsHref: "/docs/message-stream",
  },
  {
    kind: "experiment",
    id: "EXP-003",
    name: "message factory",
    description:
      "Design and trigger postMessage actions with an interactive viewer and designer.",
    href: "/message-factory",
    docsHref: "/docs/message-factory",
  },
  {
    kind: "experiment",
    id: "EXP-004",
    name: "webhook",
    description:
      "Capture and inspect incoming HTTP webhook requests in real time.",
    href: "/webhook",
    docsHref: "/docs/webhook",
  },
  {
    kind: "experiment",
    id: "EXP-005",
    name: "rsa encryption",
    description:
      "Generate RSA-OAEP key pairs, encrypt messages, and decrypt them in-browser using the Web Crypto API.",
    href: "/rsa",
    docsHref: "/docs/rsa",
  },
  {
    kind: "experiment",
    id: "EXP-006",
    name: "gist",
    description:
      "Serve a public GitHub Gist's raw content via a proxy URL, with live iframe preview.",
    href: "/gist",
    docsHref: "/docs/gist",
  },
  {
    kind: "experiment",
    id: "EXP-007",
    name: "screen capture",
    description:
      "Capture the current browser tab as a PNG and open it in a new tab.",
    href: "/screen-capture",
    docsHref: "/docs/screen-capture",
  },
];

export const tools: ToolItem[] = [
  {
    kind: "tool",
    name: "base64",
    description:
      "Encode and decode base64 strings with live sync and shareable permalinks.",
    href: "/base64",
    docsHref: "/docs/base64",
    tags: ["encoding", "web", "text", "conversion"],
  },
  {
    kind: "tool",
    name: "bitwise",
    description:
      "Visualize AND, OR, XOR, NAND, NOR, and shift operations with binary and decimal output side by side.",
    href: "/bitwise",
    docsHref: "/docs/bitwise",
    tags: ["sysadmin"],
  },
  {
    kind: "tool",
    name: "chmod",
    description:
      "Convert between numeric and symbolic Unix file permission modes with a visual breakdown table.",
    href: "/chmod",
    docsHref: "/docs/chmod",
    tags: ["conversion", "sysadmin"],
  },
  {
    kind: "tool",
    name: "cidr",
    description:
      "Calculate subnet details from CIDR notation: network address, broadcast, mask, host range, and more.",
    href: "/cidr",
    docsHref: "/docs/cidr",
    tags: ["sysadmin"],
  },
  {
    kind: "tool",
    name: "color",
    description:
      "Convert color values between HEX, RGB, RGBA, HSL, and OKLCH with live preview.",
    href: "/color",
    docsHref: "/docs/color",
    tags: ["conversion", "web"],
  },
  {
    kind: "tool",
    name: "compress",
    description:
      "Compress PNG, JPEG, and WebP images server-side. Convert to WebP or AVIF for maximum file size reduction.",
    href: "/compress",
    docsHref: "/docs/compress",
    tags: ["conversion", "web"],
  },
  {
    kind: "tool",
    name: "css unit",
    description:
      "Convert between CSS units: px, rem, em, %, vh, vw, pt, cm, mm, in with adjustable context.",
    href: "/css-unit",
    docsHref: "/docs/css-unit",
    tags: ["conversion", "web"],
  },
  {
    kind: "tool",
    name: "cron",
    description:
      "Parse cron expressions into plain English and preview the next 10 scheduled run times.",
    href: "/cron",
    docsHref: "/docs/cron",
    tags: ["sysadmin"],
  },
  {
    kind: "tool",
    name: "datetime",
    description:
      "Convert timestamps and dates between many formats at once with live sync and shareable permalinks.",
    href: "/datetime",
    docsHref: "/docs/datetime",
    tags: ["conversion", "web"],
  },
  {
    kind: "tool",
    name: "hash",
    description:
      "Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from any text input.",
    href: "/hash",
    docsHref: "/docs/hash",
    tags: ["encoding", "security", "sysadmin", "web", "text"],
  },
  {
    kind: "tool",
    name: "html entity",
    description:
      "Encode and decode HTML entities for safe display in web pages with multiple encoding modes.",
    href: "/html-entity",
    docsHref: "/docs/html-entity",
    tags: ["encoding", "web", "text"],
  },
  {
    kind: "tool",
    name: "jwt",
    description:
      "Decode JWT tokens and inspect header, payload claims, and expiry status.",
    href: "/jwt",
    docsHref: "/docs/jwt",
    tags: ["security", "web"],
  },
  {
    kind: "tool",
    name: "lorem ipsum",
    description:
      "Generate lorem ipsum placeholder text by words, sentences, or paragraphs with one click.",
    href: "/lorem",
    docsHref: "/docs/lorem",
    tags: ["web", "text"],
  },
  {
    kind: "tool",
    name: "number base",
    description:
      "Convert integers between binary, octal, decimal, and hex with live sync and shareable permalinks.",
    href: "/numbase",
    docsHref: "/docs/numbase",
    tags: ["conversion"],
  },
  {
    kind: "tool",
    name: "pretty print",
    description:
      "Format and validate JSON with live pretty-printing and shareable permalinks.",
    href: "/pretty-print",
    docsHref: "/docs/pretty-print",
    tags: ["web"],
  },
  {
    kind: "tool",
    name: "qr code",
    description:
      "Generate QR codes from any text or URL and download as SVG or PNG.",
    href: "/qr",
    docsHref: "/docs/qr",
    tags: ["web"],
  },
  {
    kind: "tool",
    name: "regex",
    description:
      "Test regular expressions against strings with live match results and shareable permalinks.",
    href: "/regex",
    docsHref: "/docs/regex",
    tags: ["web", "sysadmin", "text"],
  },
  {
    kind: "tool",
    name: "json → typescript",
    description:
      "Convert a JSON sample into TypeScript interface definitions instantly.",
    href: "/json-ts",
    docsHref: "/docs/json-ts",
    tags: ["conversion", "web"],
  },
  {
    kind: "tool",
    name: "text diff",
    description:
      "Compare two blocks of text and highlight additions and deletions line by line.",
    href: "/diff",
    docsHref: "/docs/diff",
    tags: ["text"],
  },
  {
    kind: "tool",
    name: "text stats",
    description:
      "Analyze text statistics: character count, word count, reading time, and word frequency analysis.",
    href: "/text-stats",
    docsHref: "/docs/text-stats",
    tags: ["text"],
  },
  {
    kind: "tool",
    name: "unicode",
    description:
      "Inspect each character's code point, UTF-8/UTF-16 encoding, category, script, and HTML entity.",
    href: "/unicode",
    docsHref: "/docs/unicode",
    tags: ["text", "encoding"],
  },
  {
    kind: "tool",
    name: "url encode",
    description:
      "Encode and decode URL strings with live sync and shareable permalinks.",
    href: "/urlencode",
    docsHref: "/docs/urlencode",
    tags: ["encoding", "web", "text"],
  },
  {
    kind: "tool",
    name: "my ip",
    description:
      "Look up your current public IP address with geolocation, ASN, and network details.",
    href: "/my-ip",
    docsHref: "/docs/my-ip",
    tags: ["web", "sysadmin"],
  },
  {
    kind: "tool",
    name: "uuid",
    description:
      "Generate UUIDs of any version with one click and shareable permalinks.",
    href: "/uuid",
    docsHref: "/docs/uuid",
    tags: ["security", "sysadmin", "web"],
  },
  {
    kind: "tool",
    name: "string case",
    description:
      "Convert text between camelCase, PascalCase, snake_case, kebab-case, SCREAMING_SNAKE, Title Case, and more.",
    href: "/case",
    docsHref: "/docs/case",
    tags: ["text", "conversion"],
  },
  {
    kind: "tool",
    name: "password",
    description:
      "Generate cryptographically secure passwords with configurable length, character sets, and count.",
    href: "/password",
    docsHref: "/docs/password",
    tags: ["security"],
  },
  {
    kind: "tool",
    name: "byte size",
    description:
      "Convert between byte units — B, KB, KiB, MB, MiB, GB, GiB, TB, TiB — with binary (1024) and decimal (1000) modes.",
    href: "/bytes",
    docsHref: "/docs/bytes",
    tags: ["conversion", "sysadmin"],
  },
  {
    kind: "tool",
    name: "json ↔ yaml",
    description:
      "Convert between JSON and YAML formats with live bidirectional sync and shareable permalinks.",
    href: "/json-yaml",
    docsHref: "/docs/json-yaml",
    tags: ["conversion", "web"],
  },
  {
    kind: "tool",
    name: "ascii art",
    description:
      "Convert images to ASCII art in your browser — upload a file or paste a URL, with configurable width and character density.",
    href: "/ascii-art",
    docsHref: "/docs/ascii-art",
    tags: ["conversion", "text"],
  },
  {
    kind: "tool",
    name: "scratch",
    description:
      "A scratchpad — type anything and bookmark it as a shareable permalink.",
    href: "/scratch",
    docsHref: "/docs/scratch",
    tags: ["text"],
  },
  {
    kind: "tool",
    name: "keycode",
    description:
      "Press any key to inspect its JavaScript event properties: key, code, keyCode, location, and modifier state.",
    href: "/keycode",
    docsHref: "/docs/keycode",
    tags: ["web", "sysadmin"],
  },
  {
    kind: "tool",
    name: "basic auth",
    description:
      "Generate HTTP Basic Authentication headers from a username and password — encoded in your browser.",
    href: "/basic-auth",
    docsHref: "/docs/basic-auth",
    tags: ["web", "encoding", "security"],
  },
  {
    kind: "tool",
    name: "markdown",
    description:
      "Convert Markdown to HTML with a live preview. Toggle between rendered output and raw HTML source.",
    href: "/markdown",
    docsHref: "/docs/markdown",
    tags: ["conversion", "web", "text"],
  },
  {
    kind: "tool",
    name: "json diff",
    description:
      "Compare two JSON structures and highlight added, removed, and changed keys recursively.",
    href: "/json-diff",
    docsHref: "/docs/json-diff",
    tags: ["web", "text"],
  },
  {
    kind: "tool",
    name: "sql",
    description:
      "Format and prettify SQL queries with uppercase keywords and proper indentation. Supports PostgreSQL, MySQL, SQLite, and BigQuery.",
    href: "/sql",
    docsHref: "/docs/sql",
    tags: ["web", "text"],
  },
  {
    kind: "tool",
    name: "svg → jsx",
    description:
      "Convert SVG markup to React JSX — removes xmlns, converts hyphenated attributes to camelCase, and wraps inline styles as objects.",
    href: "/svg-jsx",
    docsHref: "/docs/svg-jsx",
    tags: ["conversion", "web"],
  },
  {
    kind: "tool",
    name: "og tags",
    description:
      "Generate Open Graph and Twitter Card meta tags with a live social preview.",
    href: "/og",
    docsHref: "/docs/og",
    tags: ["web"],
  },
  {
    kind: "tool",
    name: "color shades",
    description:
      "Generate a perceptually uniform 11-step color scale in OKLCH — ready for Tailwind CSS or any design system.",
    href: "/color-shades",
    docsHref: "/docs/color-shades",
    tags: ["conversion", "web"],
  },
];

export const allItems: AnyItem[] = [...tools, ...experiments, ...references];
