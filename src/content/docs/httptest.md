# httptest

An **httpbin-compatible HTTP request & response service**, plus a browser explorer for firing at it. Point a client, test suite, or CI job at it when you need an endpoint that reflects your request back, forces a status code, challenges for auth, stalls on purpose, or hands you junk bytes.

It exists because [httpbin.org](https://httpbin.org) has a habit of being down.

## Base URL

```
https://hypothesis.sh/api/httptest
```

Every endpoint hangs off that prefix, so migrating from httpbin is a find-and-replace:

```diff
- curl https://httpbin.org/get
+ curl https://hypothesis.sh/api/httptest/get
```

## Conventions

These hold across every endpoint unless noted otherwise.

|                  |                                                                                                                                                            |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CORS**         | Wide open — `Access-Control-Allow-Origin: *`, all methods, all headers. Browser clients work with no proxy. `OPTIONS` preflight returns `204`.             |
| **Caching**      | `Cache-Control: no-store`. A cached answer would defeat the point. (One exception: `/response-headers` lets you overwrite it — that's the endpoint's job.) |
| **Wrong method** | `405` with an `Allow` header listing what's accepted.                                                                                                      |
| **Unknown path** | `404` with a JSON error.                                                                                                                                   |
| **Body limit**   | 1 MB. Larger returns `413`.                                                                                                                                |

Error bodies are always JSON:

```bash
curl https://hypothesis.sh/api/httptest/post          # GET on a POST-only endpoint
```

```json
{ "error": "Method not allowed. Try POST." }
```

```bash
curl https://hypothesis.sh/api/httptest/nope
```

```json
{ "error": "No such endpoint: /api/httptest/nope" }
```

## The explorer

The [`/httptest`](/httptest) page lists every endpoint and fires real requests from your browser — status, timing, response headers, and body. Pick from the catalog or type any path. `POST`/`PUT`/`PATCH`/`DELETE` reveal a body field sent as `application/json`. Binary responses are summarized by length rather than rendered as mojibake.

The current method and path live in the URL, so a specific request is shareable:

```
/httptest?path=/status/418
/httptest?path=/anything/test&method=POST
```

## Request methods

### `GET /get`

Reflects the query args, request headers, caller IP, and full URL.

```bash
curl 'https://hypothesis.sh/api/httptest/get?foo=bar&foo=baz'
```

```json
{
  "args": { "foo": ["bar", "baz"] },
  "headers": {
    "Host": "hypothesis.sh",
    "User-Agent": "curl/8.7.1",
    "Accept": "*/*"
  },
  "origin": "203.0.113.7",
  "url": "https://hypothesis.sh/api/httptest/get?foo=bar&foo=baz"
}
```

A param given once is a string; **repeated params become an array** — the quickest way to check how your client serializes lists.

### `POST /post` · `PUT /put` · `PATCH /patch` · `DELETE /delete`

Everything `/get` returns, plus four views of the request body: `data`, `form`, `json`, `files`.

**A JSON body** populates `data` (raw) and `json` (parsed):

```bash
curl -X POST -H 'Content-Type: application/json' \
     -d '{"name":"ada","id":42}' \
     https://hypothesis.sh/api/httptest/post
```

```json
{
  "args": {},
  "headers": { "Content-Type": "application/json", "Content-Length": "22" },
  "origin": "203.0.113.7",
  "url": "https://hypothesis.sh/api/httptest/post",
  "data": "{\"name\":\"ada\",\"id\":42}",
  "form": {},
  "json": { "name": "ada", "id": 42 },
  "files": {}
}
```

**A form body** populates `form` and leaves `data` empty — repeats become arrays here too:

```bash
curl -X POST -d 'x=1&x=2&y=3' https://hypothesis.sh/api/httptest/post
```

```json
{
  "data": "",
  "form": { "x": ["1", "2"], "y": "3" },
  "json": null,
  "files": {}
}
```

**Unparseable JSON** is not an error — you get the raw `data` and a `null` `json`, so you can see exactly what you sent:

```bash
curl -X POST -H 'Content-Type: application/json' -d '{oops' \
     https://hypothesis.sh/api/httptest/post
```

```json
{ "data": "{oops", "json": null }
```

`/put`, `/patch`, and `/delete` behave identically to `/post` — only the method changes.

> `multipart/form-data` is **not** decoded — it lands in `data` as raw text and `files` stays empty. This is the one deliberate parity gap; see [Differences](#differences-from-httpbinorg).

## Request inspection

### `GET /headers`

Just the request headers, title-cased the way httpbin reports them.

```bash
curl -H 'X-Request-Id: abc-123' https://hypothesis.sh/api/httptest/headers
```

```json
{
  "headers": {
    "Host": "hypothesis.sh",
    "User-Agent": "curl/8.7.1",
    "Accept": "*/*",
    "X-Request-Id": "abc-123"
  }
}
```

### `GET /ip`

```bash
curl https://hypothesis.sh/api/httptest/ip
```

```json
{ "origin": "203.0.113.7" }
```

### `GET /user-agent`

```bash
curl -A 'my-client/2.1' https://hypothesis.sh/api/httptest/user-agent
```

```json
{ "user-agent": "my-client/2.1" }
```

### `/anything/*` — any method, any path

The catch-all. Accepts `GET`, `POST`, `PUT`, `PATCH`, `DELETE` on **any** trailing path, and adds `method` to the full reflection. Reach for it when you want one endpoint that never 405s.

```bash
curl -X PATCH -H 'Content-Type: application/json' -d '{"k":"v"}' \
     https://hypothesis.sh/api/httptest/anything/foo/bar
```

```json
{
  "args": {},
  "headers": { "Content-Type": "application/json" },
  "origin": "203.0.113.7",
  "url": "https://hypothesis.sh/api/httptest/anything/foo/bar",
  "data": "{\"k\":\"v\"}",
  "form": {},
  "json": { "k": "v" },
  "files": {},
  "method": "PATCH"
}
```

## Status codes

### `/status/:codes` — all methods

Responds with the status you name. The body is empty; the status line **is** the payload.

```bash
curl -i https://hypothesis.sh/api/httptest/status/418
```

```http
HTTP/1.1 418 I'm a Teapot
```

Give a comma-separated list to have one picked at random — useful for exercising retry logic against a flaky-looking endpoint:

```bash
curl -o /dev/null -w '%{http_code}\n' \
     https://hypothesis.sh/api/httptest/status/200,200,500
```

Accepts `100`–`599`. Anything else — `/status/999`, `/status/abc` — is a `400`, **not** a clamp: answering with a status you never asked for is worse than an error.

## Response formats

### `GET /json`

A fixed sample document, identical to httpbin's.

```bash
curl https://hypothesis.sh/api/httptest/json
```

```json
{
  "slideshow": {
    "author": "Yours Truly",
    "date": "date of publication",
    "slides": [
      { "title": "Wake up to WonderWidgets!", "type": "all" },
      {
        "items": [
          "Why <em>WonderWidgets</em> are great",
          "Who <em>buys</em> WonderWidgets"
        ],
        "title": "Overview",
        "type": "all"
      }
    ],
    "title": "Sample Slide Show"
  }
}
```

### `GET /html`

A small HTML document (`text/html; charset=utf-8`) — a Moby-Dick excerpt.

```bash
curl https://hypothesis.sh/api/httptest/html
```

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Sample HTML</title>
  </head>
  ...
</html>
```

### `GET /xml`

A sample slideshow document (`application/xml`).

```bash
curl https://hypothesis.sh/api/httptest/xml
```

```xml
<?xml version='1.0' encoding='us-ascii'?>
<slideshow title="Sample Slide Show" date="date of publication" author="Yours Truly">
  <slide type="all">
    <title>Wake up to WonderWidgets!</title>
  </slide>
  ...
</slideshow>
```

### `GET /uuid`

A fresh UUID v4 on every call.

```bash
curl https://hypothesis.sh/api/httptest/uuid
```

```json
{ "uuid": "98a87d14-2c69-44d3-b66f-61df3a1ad239" }
```

## Dynamic data

### `/delay/:n` — all methods

Responds after `n` seconds with the `/get` shape. **Max 10 seconds**; higher values clamp rather than error.

```bash
curl -o /dev/null -w '%{http_code} in %{time_total}s\n' \
     https://hypothesis.sh/api/httptest/delay/2
# 200 in 2.003790s
```

The obvious use — prove your client's timeout actually fires:

```bash
curl --max-time 1 https://hypothesis.sh/api/httptest/delay/5
# curl: (28) Operation timed out after 1000 milliseconds
```

### `GET /bytes/:n`

`n` random bytes as `application/octet-stream`. **Max 100 KB**, clamped.

```bash
curl -s https://hypothesis.sh/api/httptest/bytes/16 | xxd
# 00000000: c33e 4697 d89b ba4f bd72 d829 b0ba f22b  .>F....O.r.)...+
```

### `GET /stream/:n`

`n` newline-delimited JSON objects, each the `/get` reflection plus an incrementing `id`. **Max 100 lines**, clamped. Good for exercising a streaming/NDJSON parser.

```bash
curl -s https://hypothesis.sh/api/httptest/stream/3
```

```
{"args":{},"headers":{...},"origin":"203.0.113.7","url":"...","id":0}
{"args":{},"headers":{...},"origin":"203.0.113.7","url":"...","id":1}
{"args":{},"headers":{...},"origin":"203.0.113.7","url":"...","id":2}
```

> The response is `application/json` but is **not** a single JSON document — parse it line by line.

## Redirects

### `GET /redirect/:n`

Redirects `n` times with `302`, landing on `/get`. **Max 10 hops**, clamped.

```bash
curl -i https://hypothesis.sh/api/httptest/redirect/2
```

```http
HTTP/1.1 302 Found
Location: /api/httptest/redirect/1
```

```bash
curl -sL -o /dev/null -w '%{num_redirects} hops -> %{url_effective}\n' \
     https://hypothesis.sh/api/httptest/redirect/3
# 3 hops -> https://hypothesis.sh/api/httptest/get
```

Use it to check your client actually caps redirect chains:

```bash
curl -sL --max-redirs 2 -o /dev/null https://hypothesis.sh/api/httptest/redirect/5
# curl: (47) Maximum (2) redirects followed
```

## Auth

Nothing here is a real secret — the expected credentials arrive **in the request URL**. These exist to exercise a client's auth handling, not to protect anything.

### `GET /basic-auth/:user/:passwd`

Challenges with Basic auth. Wrong or missing credentials get a `401`:

```bash
curl -i https://hypothesis.sh/api/httptest/basic-auth/user/passwd
```

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Basic realm="Fake Realm"
```

Correct credentials get a `200`:

```bash
curl -u user:passwd https://hypothesis.sh/api/httptest/basic-auth/user/passwd
```

```json
{ "authenticated": true, "user": "user" }
```

Any user/password pair works — they're taken from the path, so `/basic-auth/ada/hunter2` expects `ada:hunter2`.

### `GET /bearer`

Any non-empty Bearer token is accepted and echoed back — the point is the header handling, not the token.

```bash
curl -H 'Authorization: Bearer tok_abc123' https://hypothesis.sh/api/httptest/bearer
```

```json
{ "authenticated": true, "token": "tok_abc123" }
```

No token, or a non-Bearer scheme, gets `401` with `WWW-Authenticate: Bearer`.

## Response inspection

### `GET`/`POST` `/response-headers`

Echoes every query param back as a **real response header**, and lists the response's headers in the body.

```bash
curl -i 'https://hypothesis.sh/api/httptest/response-headers?X-Custom=hello&Cache-Control=no-cache'
```

```http
HTTP/1.1 200 OK
Cache-Control: no-cache
Content-Type: application/json
X-Custom: hello
Content-Security-Policy: sandbox
Content-Length: 104

{"Cache-Control":"no-cache","Content-Length":"104","Content-Type":"application/json","X-Custom":"hello"}
```

Two behaviors look like bugs and aren't — both match httpbin exactly:

- **Params are _added_, not substituted.** `?Content-Type=text/html` leaves **two** `Content-Type` headers, and the body reports an array: `{"Content-Type": ["application/json", "text/html"]}`.
- **Repeated params repeat the header.** `?a=1&a=2` emits two `a:` lines and reports `"a": ["1","2"]`.

The body reports its own `Content-Length` — so writing that number changes the body's length. The value is resolved by re-serializing to a fixpoint, exactly as httpbin does, and always matches the bytes actually sent.

Unusable header names or values are rejected with `400`.

> **This endpoint is sandboxed.** It lets a caller put arbitrary bytes in the body _and_ set `Content-Type`, so `?Content-Type=text/html&x=<script>…` is a live XSS on real httpbin. httpbin.org gets away with that as a sacrificial domain; this one shares an origin with every other tool here, so responses carry `Content-Security-Policy: sandbox`. Scripts can't execute, every header you asked for is still set, and programmatic clients see no difference. The header is added after the body is built, so it isn't reflected — the same way httpbin's own CORS headers aren't.

## Cookies

### `GET /cookies`

Returns the cookies you sent.

```bash
curl -b 'flavor=chocolate' https://hypothesis.sh/api/httptest/cookies
```

```json
{ "cookies": { "flavor": "chocolate" } }
```

### `GET /cookies/set?name=value`

Sets each query param as a cookie on `Path=/`, then `302`s to `/cookies`.

```bash
curl -i 'https://hypothesis.sh/api/httptest/cookies/set?flavor=chocolate&count=2'
```

```http
HTTP/1.1 302 Found
Set-Cookie: flavor=chocolate; Path=/
Set-Cookie: count=2; Path=/
Location: /api/httptest/cookies
```

Follow the redirect with a cookie jar to see the round trip:

```bash
curl -sLc jar.txt -o /dev/null 'https://hypothesis.sh/api/httptest/cookies/set?flavor=chocolate'
curl -sb jar.txt https://hypothesis.sh/api/httptest/cookies
# {"cookies":{"flavor":"chocolate"}}
```

### `GET /cookies/delete?name`

Expires each **named** cookie (the value is ignored), then `302`s to `/cookies`.

```bash
curl -sLb jar.txt -c jar.txt 'https://hypothesis.sh/api/httptest/cookies/delete?flavor'
# {"cookies":{}}
```

## Index

`GET /api/httptest` returns a machine-readable catalog of every endpoint — this stands in for httpbin's Swagger landing page.

```bash
curl https://hypothesis.sh/api/httptest
```

```json
{
  "service": "httptest — httpbin-compatible test endpoints",
  "base": "/api/httptest",
  "endpoints": [
    {
      "path": "/get",
      "methods": ["GET"],
      "description": "Returns the GET request's args, headers, origin, and URL."
    }
  ]
}
```

## Limits

| Endpoint         | Cap         | Over the cap |
| ---------------- | ----------- | ------------ |
| `/delay/:n`      | 10 seconds  | Clamped      |
| `/bytes/:n`      | 100 KB      | Clamped      |
| `/stream/:n`     | 100 lines   | Clamped      |
| `/redirect/:n`   | 10 hops     | Clamped      |
| `/status/:codes` | `100`–`599` | **`400`**    |
| Request body     | 1 MB        | **`413`**    |

Sizes and durations clamp, matching httpbin. Status codes don't — see [Status codes](#status-codes).

## Differences from httpbin.org

This is a **TypeScript port of httpbin's core surface**, not the Flask app. Known deviations, all verified against `psf/httpbin` 0.10.4 running locally:

- **Multipart bodies are not decoded.** `multipart/form-data` lands in `data` as raw text with `files` empty; real httpbin populates `files`. Form-encoded and JSON bodies behave identically.
- **`/json`, `/html`, and `/xml` can return `304 Not Modified`** to a conditional `If-None-Match` request, because the framework attaches an `ETag` to static bodies. Real httpbin sets no `ETag` and always returns `200`. Rarely hit in practice — every response is `no-store`, so a well-behaved cache never revalidates — and the reflection endpoints are immune, since echoing `If-None-Match` into the body changes the body and the tag never matches.
- **`/response-headers` is sandboxed** (see the note above) and **won't emit a duplicate `Content-Length`**: real httpbin honors `?Content-Length=999` with a _second, conflicting_ header, which is response-smuggling material rather than a testable behavior. The body still reports what you asked for; only the true length is sent. Real httpbin also returns `500` on a CRLF-bearing value; this returns `400`.
- **`/delay` caps at 10 seconds**, matching httpbin's own limit. Each delayed request holds a serverless function open, so the ceiling is enforced, not advisory.
- **JSON key order differs.** Real httpbin sorts keys (Flask's `jsonify`); this returns a fixed but unsorted order. JSON objects are unordered — every key and value matches.
- **A `__proto__` query param or request header won't round-trip.** Next.js strips `__proto__` from the query string, and Node's HTTP parser drops a `__proto__` request header — both before this handler runs. A `__proto__` _cookie_ round-trips correctly. Real httpbin, backed by a Python dict, reflects all three.
- **Not implemented:** `/gzip`, `/brotli`, `/deflate`, `/image/*`, `/robots.txt`, `/deny`, `/links/:n`, `/range/:n`, `/drip`, `/digest-auth`, `/forms/post`, `/cache`, `/etag/:tag`, `/base64/:value`, `/relative-redirect/:n`, `/absolute-redirect/:n`, `/redirect-to?url=`.

> Why a port and not the real thing? [postmanlabs/httpbin](https://github.com/postmanlabs/httpbin) has not had a commit to `master` since **November 2018** and no longer imports on a modern install — `core.py` still does `from werkzeug.wrappers import BaseResponse`, which Werkzeug removed in 2.1.0. The maintained descendant is [psf/httpbin](https://github.com/psf/httpbin) (what `pip install httpbin` actually gives you), but running Flask here would mean adding a Python toolchain and restructuring the Vercel deploy config around [Services](https://vercel.com/docs/services). A focused TypeScript port keeps the whole thing in one handler with no new runtime.
