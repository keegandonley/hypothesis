import type { NextApiRequest } from "next";

/** Mount point. httpbin's own paths hang off this prefix. */
export const HTTPTEST_BASE = "/api/httptest";

/** httpbin caps /delay at 10s; a longer sleep just bills a held-open function. */
export const MAX_DELAY_SECONDS = 10;
/** httpbin caps /bytes at 100KB. */
export const MAX_BYTES = 100 * 1024;
/** httpbin caps /stream at 100 lines. */
export const MAX_STREAM_LINES = 100;
/** Redirect chains beyond this are a client's problem, not a useful test. */
export const MAX_REDIRECTS = 10;
// Raw-body reading moved to the neutral shared module so the webhook routes
// can reuse it; re-exported here to preserve this module's public surface.
export { MAX_BODY_BYTES, PayloadTooLargeError, readRawBody } from "./raw-body";

export type QueryValue = string | string[];
export type QueryMap = Record<string, QueryValue>;

/**
 * Werkzeug title-cases header names on the way out, so real httpbin reports
 * "User-Agent" where Node hands us "user-agent". Clients diffing against
 * httpbin.org notice, so match it.
 */
export function titleCaseHeader(name: string): string {
  return name
    .split("-")
    .map((part) =>
      part.length === 0 ? part : part[0].toUpperCase() + part.slice(1),
    )
    .join("-");
}

/**
 * Every map here is built with Object.fromEntries rather than `obj[key] = value`.
 * Plain assignment of the key "__proto__" hits Object.prototype's legacy setter,
 * so the entry is silently dropped instead of becoming an own property — bad in
 * a service whose contract is reflecting the request back verbatim. fromEntries
 * defines own properties directly and sidesteps the accessor.
 *
 * Measured, so we don't overstate the benefit: only parseCookies actually
 * reaches this case, because it parses the Cookie header itself. A `__proto__`
 * query param never survives Next's own query sanitizing to reach parseArgs, and
 * Node's HTTP parser drops a `__proto__` request header before collectHeaders
 * runs. Both are upstream and outside our control; the pattern stays uniform
 * here so the three parsers can't diverge later.
 */
export function collectHeaders(req: NextApiRequest): Record<string, string> {
  return Object.fromEntries(
    // flatMap, not filter+map: dropping the undefined case here narrows the
    // value type for real, where filter() would still need a cast.
    Object.entries(req.headers).flatMap(([key, value]): [string, string][] =>
      value === undefined
        ? []
        : [
            [
              titleCaseHeader(key),
              // Node splits repeated headers into arrays; httpbin joins them.
              Array.isArray(value) ? value.join(", ") : value,
            ],
          ],
    ),
  );
}

/** The client IP, as httpbin's `origin` field reports it. */
export function getOrigin(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const firstHop = Array.isArray(forwarded) ? forwarded[0] : forwarded;

  return (
    (req.headers["x-vercel-forwarded-for"] as string) ??
    firstHop?.split(",")[0].trim() ??
    (req.headers["x-real-ip"] as string) ??
    req.socket.remoteAddress ??
    "127.0.0.1"
  );
}

/** Absolute URL of the request as the client sent it, for httpbin's `url` field. */
export function getRequestUrl(req: NextApiRequest): URL {
  const proto = (req.headers["x-forwarded-proto"] as string) ?? "https";
  const host = req.headers.host ?? "localhost:3000";

  return new URL(req.url ?? "/", `${proto}://${host}`);
}

/** httpbin collapses single-valued params to a string and repeats to an array. */
export function parseArgs(params: URLSearchParams): QueryMap {
  return Object.fromEntries(
    [...new Set(params.keys())].map((key) => {
      const all = params.getAll(key);

      return [key, all.length === 1 ? all[0] : all];
    }),
  );
}

export function parseCookies(req: NextApiRequest): Record<string, string> {
  const header = req.headers.cookie;

  if (!header) return {};

  const entries: [string, string][] = [];

  for (const pair of header.split(";")) {
    const eq = pair.indexOf("=");

    if (eq === -1) continue;
    const name = pair.slice(0, eq).trim();

    if (!name) continue;
    entries.push([name, decodeURIComponent(pair.slice(eq + 1).trim())]);
  }

  return Object.fromEntries(entries);
}

export interface ParsedBody {
  data: string;
  form: QueryMap;
  json: unknown;
  files: Record<string, string>;
}

/**
 * Mirrors httpbin's split of a request body across `data`/`form`/`json`:
 * form-encoded bodies populate `form` and leave `data` empty, JSON bodies
 * populate both `data` and `json`, anything else lands in `data` alone.
 *
 * Multipart bodies are reported raw in `data` with `files` empty — real httpbin
 * decodes them into `files`, which is the one deliberate parity gap here.
 */
export function parseBody(raw: string, contentType: string): ParsedBody {
  const type = contentType.split(";")[0].trim().toLowerCase();
  const empty: ParsedBody = { data: "", form: {}, json: null, files: {} };

  if (raw.length === 0) return empty;

  if (type === "application/x-www-form-urlencoded") {
    return { ...empty, form: parseArgs(new URLSearchParams(raw)) };
  }

  if (type === "application/json") {
    try {
      return { ...empty, data: raw, json: JSON.parse(raw) };
    } catch {
      // httpbin reports unparseable JSON as data with a null `json`.
      return { ...empty, data: raw };
    }
  }

  return { ...empty, data: raw };
}


/**
 * Clamp an integer path segment, returning null when unparseable. Clamping (not
 * rejecting) matches httpbin for size/duration limits: /delay/999 waits the max
 * rather than erroring. Never use this for values where an out-of-range input is
 * meaningless rather than excessive — see parseStatusCode.
 */
export function clampInt(raw: string, min: number, max: number): number | null {
  // Number("") is 0, which would silently accept an empty segment.
  if (raw.trim() === "") return null;

  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) return null;

  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

/**
 * Strict, non-clamping parse for HTTP status codes. Clamping here would answer
 * /status/999 with a 599 — a status the caller never asked for and can't act
 * on — so anything outside 100-599 is rejected instead.
 */
export function parseStatusCode(raw: string): number | null {
  const trimmed = raw.trim();

  if (!/^\d{3}$/.test(trimmed)) return null;

  const code = Number(trimmed);

  return code >= 100 && code <= 599 ? code : null;
}

/** The Content-Type /response-headers starts from, before caller additions. */
export const RESPONSE_HEADERS_CONTENT_TYPE = "application/json";

// RFC 7230 token characters — the set Node's own header validation accepts.
const HEADER_NAME_PATTERN = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
// CR/LF/NUL would split or truncate the header block (response splitting).
const HEADER_VALUE_PATTERN = /^[^\r\n\0]*$/;

/** Iterations allowed for the Content-Length fixpoint below; it settles in ~3. */
const FIXPOINT_MAX_ITERATIONS = 8;

export interface ResponseHeaderResult {
  /** Headers to emit, caller casing preserved. Multiple values → repeated header. */
  headers: [string, string[]][];
  /** JSON body whose own Content-Length value equals its actual byte length. */
  body: string;
}

/**
 * Builds /response-headers' echoed headers and reflected body.
 *
 * Verified against psf/httpbin 0.10.4 running locally. Two behaviors are worth
 * spelling out because they look like mistakes and aren't:
 *
 * 1. Params are *added* to the response's existing headers, not substituted for
 *    them. `?Content-Type=text/html` therefore yields two Content-Type headers
 *    and an array in the body — httpbin does exactly this.
 * 2. The body reports its own Content-Length, so writing that number changes the
 *    body's length. httpbin re-serializes until the body stops changing; this
 *    mirrors that fixpoint.
 *
 * Returns null when any name/value is unusable as a header, which the caller
 * turns into a 400. (Real httpbin 500s on a CRLF value — a crash isn't a
 * contract worth copying.)
 */
export function buildResponseHeaders(
  params: [string, string][],
): ResponseHeaderResult | null {
  if (
    params.some(
      ([name, value]) =>
        !HEADER_NAME_PATTERN.test(name) || !HEADER_VALUE_PATTERN.test(value),
    )
  ) {
    return null;
  }

  // Merge case-insensitively on first-seen casing. Real httpbin lists both
  // "Content-Type" and "content-type" as separate body keys holding the same
  // merged value, which is a quirk of Werkzeug's key handling, not a feature.
  const merged = new Map<string, { name: string; values: string[] }>();

  const add = (name: string, value: string): void => {
    const entry = merged.get(name.toLowerCase());

    if (entry) {
      entry.values.push(value);

      return;
    }

    merged.set(name.toLowerCase(), { name, values: [value] });
  };

  add("Content-Type", RESPONSE_HEADERS_CONTENT_TYPE);
  for (const [name, value] of params) add(name, value);

  const userLength = merged.get("content-length");

  const bodyFor = (contentLength: number): string => {
    const dict: Record<string, string | string[]> = {};

    for (const [key, { name, values }] of merged) {
      if (key === "content-length") continue;
      dict[name] = values.length === 1 ? values[0] : values;
    }

    // The real length leads, then any the caller asked to append — matching
    // httpbin, which reports both.
    const lengthValues = [String(contentLength), ...(userLength?.values ?? [])];

    dict[userLength?.name ?? "Content-Length"] =
      lengthValues.length === 1 ? lengthValues[0] : lengthValues;

    // Flask's jsonify sorts keys; sort here so the body matches byte for byte.
    return JSON.stringify(
      Object.fromEntries(
        Object.keys(dict)
          .sort()
          .map((key) => [key, dict[key]]),
      ),
    );
  };

  let length = 0;
  let body = bodyFor(length);

  for (let i = 0; i < FIXPOINT_MAX_ITERATIONS; i++) {
    const actual = Buffer.byteLength(body);

    if (actual === length) break;
    length = actual;
    body = bodyFor(length);
  }

  const headers: [string, string[]][] = [];

  for (const [key, { name, values }] of merged) {
    // Never emit a second Content-Length. Real httpbin does, and two conflicting
    // values is request-smuggling material rather than a testable behavior; the
    // body still reflects what the caller asked for. Node sets the true one.
    if (key === "content-length") continue;
    headers.push([name, values]);
  }

  return { headers, body };
}

export interface HttptestEndpoint {
  /** Path template relative to HTTPTEST_BASE, e.g. "/status/:code". */
  path: string;
  /** A concrete, runnable path — what the explorer actually fires. */
  example: string;
  methods: string[];
  description: string;
  group: string;
}

/**
 * The endpoint catalog. Drives the explorer UI's listing; the handler routes
 * independently, so keep the two in sync when adding an endpoint.
 */
export const HTTPTEST_ENDPOINTS: HttptestEndpoint[] = [
  {
    path: "/get",
    example: "/get?foo=bar",
    methods: ["GET"],
    description: "Returns the GET request's args, headers, origin, and URL.",
    group: "methods",
  },
  {
    path: "/post",
    example: "/post",
    methods: ["POST"],
    description: "Returns the POST request's body, form, args, and headers.",
    group: "methods",
  },
  {
    path: "/put",
    example: "/put",
    methods: ["PUT"],
    description: "Returns the PUT request's body, form, args, and headers.",
    group: "methods",
  },
  {
    path: "/patch",
    example: "/patch",
    methods: ["PATCH"],
    description: "Returns the PATCH request's body, form, args, and headers.",
    group: "methods",
  },
  {
    path: "/delete",
    example: "/delete",
    methods: ["DELETE"],
    description: "Returns the DELETE request's body, form, args, and headers.",
    group: "methods",
  },
  {
    path: "/headers",
    example: "/headers",
    methods: ["GET"],
    description: "Returns the incoming request's headers.",
    group: "inspect",
  },
  {
    path: "/ip",
    example: "/ip",
    methods: ["GET"],
    description: "Returns the caller's origin IP address.",
    group: "inspect",
  },
  {
    path: "/user-agent",
    example: "/user-agent",
    methods: ["GET"],
    description: "Returns the caller's User-Agent header.",
    group: "inspect",
  },
  {
    path: "/anything/:path*",
    example: "/anything/hello",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    description:
      "Returns everything about the request, on any path and any method.",
    group: "inspect",
  },
  {
    path: "/status/:codes",
    example: "/status/418",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    description:
      "Responds with the given status code. Comma-separated picks one at random. ?Retry-After=n sets that header on the response.",
    group: "status",
  },
  {
    path: "/json",
    example: "/json",
    methods: ["GET"],
    description: "Returns a sample JSON document.",
    group: "formats",
  },
  {
    path: "/html",
    example: "/html",
    methods: ["GET"],
    description: "Returns a sample HTML document.",
    group: "formats",
  },
  {
    path: "/xml",
    example: "/xml",
    methods: ["GET"],
    description: "Returns a sample XML document.",
    group: "formats",
  },
  {
    path: "/uuid",
    example: "/uuid",
    methods: ["GET"],
    description: "Returns a freshly generated UUID v4.",
    group: "formats",
  },
  {
    path: "/delay/:n",
    example: "/delay/2",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    description: `Responds after an n-second delay (max ${MAX_DELAY_SECONDS}).`,
    group: "dynamic",
  },
  {
    path: "/bytes/:n",
    example: "/bytes/64",
    methods: ["GET"],
    description: `Returns n random bytes of binary data (max ${MAX_BYTES}).`,
    group: "dynamic",
  },
  {
    path: "/stream/:n",
    example: "/stream/5",
    methods: ["GET"],
    description: `Streams n newline-delimited JSON objects (max ${MAX_STREAM_LINES}).`,
    group: "dynamic",
  },
  {
    path: "/redirect/:n",
    example: "/redirect/3",
    methods: ["GET"],
    description: `Redirects n times before landing on /get (max ${MAX_REDIRECTS}).`,
    group: "redirects",
  },
  {
    path: "/basic-auth/:user/:passwd",
    example: "/basic-auth/user/passwd",
    methods: ["GET"],
    description: "Challenges with Basic auth; 401 until the creds match.",
    group: "auth",
  },
  {
    path: "/bearer",
    example: "/bearer",
    methods: ["GET"],
    description: "Challenges for a Bearer token; 401 when absent.",
    group: "auth",
  },
  {
    path: "/response-headers",
    example: "/response-headers?freeform=hello",
    methods: ["GET", "POST"],
    description:
      "Echoes each query param back as a real response header, and lists them in the body.",
    group: "response",
  },
  {
    path: "/cookies",
    example: "/cookies",
    methods: ["GET"],
    description: "Returns the cookies sent with the request.",
    group: "cookies",
  },
  {
    path: "/cookies/set",
    example: "/cookies/set?flavor=chocolate",
    methods: ["GET"],
    description:
      "Sets each query param as a cookie, then redirects to /cookies.",
    group: "cookies",
  },
  {
    path: "/cookies/delete",
    example: "/cookies/delete?flavor",
    methods: ["GET"],
    description: "Expires each named cookie, then redirects to /cookies.",
    group: "cookies",
  },
];

export const HTTPTEST_GROUPS = [
  "methods",
  "inspect",
  "status",
  "formats",
  "dynamic",
  "redirects",
  "auth",
  "response",
  "cookies",
] as const;
