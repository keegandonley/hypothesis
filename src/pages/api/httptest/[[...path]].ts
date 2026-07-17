import { randomBytes, randomUUID } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  buildResponseHeaders,
  clampInt,
  collectHeaders,
  getOrigin,
  getRequestUrl,
  HTTPTEST_BASE,
  HTTPTEST_ENDPOINTS,
  MAX_BYTES,
  MAX_DELAY_SECONDS,
  MAX_REDIRECTS,
  MAX_STREAM_LINES,
  parseArgs,
  parseBody,
  parseCookies,
  parseStatusCode,
  PayloadTooLargeError,
  readRawBody,
  type ParsedBody,
  type QueryMap,
} from "@/lib/httptest";

/**
 * Head path segment → the methods that segment accepts, derived from the
 * catalog so the two can't drift. A segment with no entry falls through to the
 * 404 default; deriving rather than hand-listing means a new endpoint can't
 * silently accept every method by being forgotten here.
 */
const ALLOWED_METHODS = new Map<string, string[]>(
  HTTPTEST_ENDPOINTS.map((endpoint) => [
    endpoint.path.split("/")[1],
    endpoint.methods,
  ]),
);

// Bodies are reflected verbatim, so Next must not consume or reshape them.
// maxDuration must be a literal for Next's static config analysis — keep it
// above MAX_DELAY_SECONDS (10) so /delay always has headroom to respond.
export const config = {
  api: { bodyParser: false },
  maxDuration: 15,
};

// httpbin is deliberately callable from any origin — that is the point of it.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Expose-Headers": "*",
};

const SAMPLE_JSON = {
  slideshow: {
    author: "Yours Truly",
    date: "date of publication",
    slides: [
      { title: "Wake up to WonderWidgets!", type: "all" },
      {
        items: [
          "Why <em>WonderWidgets</em> are great",
          "Who <em>buys</em> WonderWidgets",
        ],
        title: "Overview",
        type: "all",
      },
    ],
    title: "Sample Slide Show",
  },
};

const SAMPLE_HTML = `<!DOCTYPE html>
<html>
  <head>
    <title>Sample HTML</title>
  </head>
  <body>
    <h1>Herman Melville - Moby-Dick</h1>
    <p>
      Availing himself of the mild, summer-cool weather that now reigned in
      these latitudes, and in preparation for the peculiarly active pursuits
      shortly to be anticipated, Perth, the begrimed, blistered old blacksmith,
      had not removed his portable forge to the hold again.
    </p>
  </body>
</html>
`;

const SAMPLE_XML = `<?xml version='1.0' encoding='us-ascii'?>
<slideshow title="Sample Slide Show" date="date of publication" author="Yours Truly">
  <slide type="all">
    <title>Wake up to WonderWidgets!</title>
  </slide>
  <slide type="all">
    <title>Overview</title>
    <item>Why <em>WonderWidgets</em> are great</item>
    <item>Who <em>buys</em> WonderWidgets</item>
  </slide>
</slideshow>
`;

interface Reflection {
  args: QueryMap;
  headers: Record<string, string>;
  origin: string;
  url: string;
}

function reflect(req: NextApiRequest, url: URL): Reflection {
  return {
    args: parseArgs(url.searchParams),
    headers: collectHeaders(req),
    origin: getOrigin(req),
    url: url.toString(),
  };
}

/** The /post-family shape: a reflection plus the request body's three views. */
function reflectWithBody(
  req: NextApiRequest,
  url: URL,
  body: ParsedBody,
): Reflection & ParsedBody {
  return { ...reflect(req, url), ...body };
}

function methodNotAllowed(res: NextApiResponse, allowed: string[]): void {
  res.setHeader("Allow", allowed.join(", "));
  res
    .status(405)
    .json({ error: `Method not allowed. Try ${allowed.join(", ")}.` });
}

/**
 * httpbin picks uniformly at random when given a comma-separated code list.
 * One bad code rejects the whole list rather than being dropped — silently
 * narrowing the caller's choices would be worse than a 400.
 */
function pickStatusCode(raw: string): number | null {
  const parts = raw.split(",");
  const codes = parts.map((part) => parseStatusCode(part));

  if (codes.some((code) => code === null)) return null;

  const valid = codes as number[];

  return valid[Math.floor(Math.random() * valid.length)];
}

function decodeBasicAuth(
  header: string | undefined,
): { user: string; passwd: string } | null {
  if (!header?.toLowerCase().startsWith("basic ")) return null;

  const decoded = Buffer.from(header.slice(6).trim(), "base64").toString(
    "utf8",
  );
  const sep = decoded.indexOf(":");

  if (sep === -1) return null;

  return { user: decoded.slice(0, sep), passwd: decoded.slice(sep + 1) };
}

async function handleDelay(
  req: NextApiRequest,
  res: NextApiResponse,
  url: URL,
  raw: string,
  seconds: number,
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));

  res
    .status(200)
    .json(
      reflectWithBody(
        req,
        url,
        parseBody(raw, req.headers["content-type"] ?? ""),
      ),
    );
}

function handleStream(
  req: NextApiRequest,
  res: NextApiResponse,
  url: URL,
  lines: number,
): void {
  res.setHeader("Content-Type", "application/json");
  res.status(200);

  const base = reflect(req, url);

  for (let id = 0; id < lines; id++) {
    res.write(`${JSON.stringify({ ...base, id })}\n`);
  }

  res.end();
}

function handleResponseHeaders(res: NextApiResponse, url: URL): void {
  const result = buildResponseHeaders([...url.searchParams.entries()]);

  if (result === null) {
    res
      .status(400)
      .json({ error: "Query contains an invalid header name or value." });

    return;
  }

  for (const [name, values] of result.headers) {
    res.setHeader(name, values.length === 1 ? values[0] : values);
  }

  // This endpoint is uniquely dangerous to host: it puts caller-controlled bytes
  // in the body AND lets the caller set Content-Type, so
  // ?Content-Type=text/html&x=<script> is a live XSS. httpbin.org tolerates that
  // because it is a sacrificial domain; hypothesis.sh serves real tools from
  // this origin and sets no global CSP, so an opaque-origin sandbox blocks
  // script execution while leaving every header the caller asked for intact —
  // programmatic clients read headers exactly as they would from httpbin.
  //
  // Set after the body is built, so it is not reflected — the same way httpbin's
  // own CORS headers are added post-view and stay out of its body.
  res.setHeader("Content-Security-Policy", "sandbox");

  res.status(200).send(result.body);
}

function handleCookiesSet(res: NextApiResponse, url: URL): void {
  const cookies = [...url.searchParams.entries()].map(
    ([name, value]) =>
      `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/`,
  );

  if (cookies.length > 0) res.setHeader("Set-Cookie", cookies);
  res.redirect(302, `${HTTPTEST_BASE}/cookies`);
}

function handleCookiesDelete(res: NextApiResponse, url: URL): void {
  const expired = [...new Set(url.searchParams.keys())].map(
    (name) =>
      `${encodeURIComponent(name)}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0`,
  );

  if (expired.length > 0) res.setHeader("Set-Cookie", expired);
  res.redirect(302, `${HTTPTEST_BASE}/cookies`);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") {
    res.status(204).end();

    return;
  }

  // A test service must never be answered from a cache — every call reflects
  // the live request.
  res.setHeader("Cache-Control", "no-store");

  const url = getRequestUrl(req);
  const rawPath = req.query.path;
  const segments = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [];
  const method = req.method ?? "GET";

  // Read the body once, up front: several endpoints reflect it, and an unread
  // request stream would otherwise leave the connection hanging.
  let raw: string;

  try {
    raw = await readRawBody(req);
  } catch (e) {
    if (e instanceof PayloadTooLargeError) {
      // The request stream is paused mid-upload with data still inbound. Only
      // tear the socket down once the 413 has flushed — destroying it sooner
      // would hand the client a connection reset instead of the error.
      res.once("finish", () => req.destroy());
      res.status(413).json({ error: e.message });

      return;
    }

    res.status(400).json({ error: "Could not read request body." });

    return;
  }

  const body = (): ParsedBody =>
    parseBody(raw, req.headers["content-type"] ?? "");

  // Root: a machine-readable index, standing in for httpbin's Swagger page.
  if (segments.length === 0) {
    res.status(200).json({
      service: "httptest — httpbin-compatible test endpoints",
      base: HTTPTEST_BASE,
      endpoints: HTTPTEST_ENDPOINTS.map(({ path, methods, description }) => ({
        path,
        methods,
        description,
      })),
    });

    return;
  }

  const [head, ...rest] = segments;

  const allowed = ALLOWED_METHODS.get(head);

  if (allowed && !allowed.includes(method)) {
    methodNotAllowed(res, allowed);

    return;
  }

  switch (head) {
    case "get":
      res.status(200).json(reflect(req, url));

      return;

    case "post":
    case "put":
    case "patch":
    case "delete":
      res.status(200).json(reflectWithBody(req, url, body()));

      return;

    case "anything":
      res.status(200).json({
        ...reflectWithBody(req, url, body()),
        method,
      });

      return;

    case "headers":
      res.status(200).json({ headers: collectHeaders(req) });

      return;

    case "ip":
      res.status(200).json({ origin: getOrigin(req) });

      return;

    case "user-agent":
      res.status(200).json({ "user-agent": req.headers["user-agent"] ?? null });

      return;

    case "status": {
      const code = rest[0] ? pickStatusCode(rest[0]) : null;

      if (code === null) {
        res.status(400).json({ error: "Usage: /status/:code (100-599)" });

        return;
      }

      // Retry-After is the one query param /status honors, so retry/backoff
      // logic can be tested against a real 429 or 503. Arbitrary
      // param-to-header echo is deliberately NOT supported here: it would open
      // redirects via ?Location= on a 3xx and break response framing via
      // ?Content-Length= on the empty body. Echoing headers is
      // /response-headers' job, and only ever at 200.
      // First match wins on duplicate/mixed-case params — same first-wins
      // convention as URLSearchParams.get(), and it fails closed (a bad first
      // value 400s rather than falling through to a later one).
      const retryAfter = [...url.searchParams.entries()].find(
        ([name]) => name.toLowerCase() === "retry-after",
      )?.[1];

      if (retryAfter !== undefined) {
        // Delta-seconds only — the HTTP-date form is valid per RFC 9110 but
        // date values would need CRLF screening, and clients testing backoff
        // parse the integer form.
        if (!/^\d+$/.test(retryAfter)) {
          res.status(400).json({
            error: "Retry-After must be a non-negative integer (seconds).",
          });

          return;
        }

        res.setHeader("Retry-After", retryAfter);
      }

      // httpbin returns an empty body for /status — the code is the payload.
      res.status(code).end();

      return;
    }

    case "json":
      res.status(200).json(SAMPLE_JSON);

      return;

    case "html":
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.status(200).send(SAMPLE_HTML);

      return;

    case "xml":
      res.setHeader("Content-Type", "application/xml");
      res.status(200).send(SAMPLE_XML);

      return;

    case "uuid":
      res.status(200).json({ uuid: randomUUID() });

      return;

    case "delay": {
      const seconds = rest[0] ? clampInt(rest[0], 0, MAX_DELAY_SECONDS) : null;

      if (seconds === null) {
        res
          .status(400)
          .json({ error: `Usage: /delay/:n (0-${MAX_DELAY_SECONDS} seconds)` });

        return;
      }

      await handleDelay(req, res, url, raw, seconds);

      return;
    }

    case "bytes": {
      const count = rest[0] ? clampInt(rest[0], 0, MAX_BYTES) : null;

      if (count === null) {
        res.status(400).json({ error: `Usage: /bytes/:n (0-${MAX_BYTES})` });

        return;
      }

      res.setHeader("Content-Type", "application/octet-stream");
      res.status(200).send(randomBytes(count));

      return;
    }

    case "stream": {
      const lines = rest[0] ? clampInt(rest[0], 1, MAX_STREAM_LINES) : null;

      if (lines === null) {
        res
          .status(400)
          .json({ error: `Usage: /stream/:n (1-${MAX_STREAM_LINES})` });

        return;
      }

      handleStream(req, res, url, lines);

      return;
    }

    case "redirect": {
      const hops = rest[0] ? clampInt(rest[0], 1, MAX_REDIRECTS) : null;

      if (hops === null) {
        res
          .status(400)
          .json({ error: `Usage: /redirect/:n (1-${MAX_REDIRECTS})` });

        return;
      }

      res.redirect(
        302,
        hops <= 1
          ? `${HTTPTEST_BASE}/get`
          : `${HTTPTEST_BASE}/redirect/${hops - 1}`,
      );

      return;
    }

    case "basic-auth": {
      const [expectedUser, expectedPasswd] = rest;

      if (expectedUser === undefined || expectedPasswd === undefined) {
        res.status(400).json({ error: "Usage: /basic-auth/:user/:passwd" });

        return;
      }

      const supplied = decodeBasicAuth(req.headers.authorization);

      // Plain comparison is deliberate: the expected credentials arrive in the
      // request path, so there is no secret here for a timing attack to learn.
      if (
        supplied?.user !== expectedUser ||
        supplied.passwd !== expectedPasswd
      ) {
        res.setHeader("WWW-Authenticate", 'Basic realm="Fake Realm"');
        res.status(401).end();

        return;
      }

      res.status(200).json({ authenticated: true, user: supplied.user });

      return;
    }

    case "bearer": {
      const auth = req.headers.authorization;

      if (!auth?.toLowerCase().startsWith("bearer ")) {
        res.setHeader("WWW-Authenticate", "Bearer");
        res.status(401).end();

        return;
      }

      res
        .status(200)
        .json({ authenticated: true, token: auth.slice(7).trim() });

      return;
    }

    case "response-headers":
      handleResponseHeaders(res, url);

      return;

    case "cookies": {
      const action = rest[0];

      if (action === "set") {
        handleCookiesSet(res, url);

        return;
      }

      if (action === "delete") {
        handleCookiesDelete(res, url);

        return;
      }

      if (action !== undefined) {
        res.status(404).json({ error: `No such endpoint: ${url.pathname}` });

        return;
      }

      res.status(200).json({ cookies: parseCookies(req) });

      return;
    }

    default:
      res.status(404).json({ error: `No such endpoint: ${url.pathname}` });
  }
}
