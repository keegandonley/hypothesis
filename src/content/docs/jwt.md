# jwt

Decode JWT tokens and inspect header, payload claims, and expiry status — entirely in your browser with no server involved.

## Overview

JWTs (JSON Web Tokens) are composed of three base64url-encoded parts separated by dots:

```
<header>.<payload>.<signature>
```

This tool decodes the header and payload as JSON and displays them in separate panels. The signature is shown as-is (raw base64url string) since verifying it requires a secret or public key, which this tool does not support.

## Decoding

Paste any JWT into the input panel. The tool immediately splits the token and decodes each part:

- **Header** — algorithm and token type (e.g. `{ "alg": "HS256", "typ": "JWT" }`)
- **Payload** — claims such as `sub`, `iat`, `exp`, and any custom fields
- **Signature** — the raw base64url-encoded signature bytes (not verified)

If the token is malformed (not three dot-separated base64url segments, or non-JSON header/payload), a **malformed** badge appears and no output is shown.

## Expiry Status

The payload panel shows a status badge based on the `exp` claim:

| Badge | Meaning |
|-------|---------|
| `valid` | `exp` is in the future |
| `expired` | `exp` is in the past |
| `no exp` | No `exp` claim present |

The check uses `Date.now()` in your local browser — no server clock is involved.

## Generate

Click **Generate** in the token input header to create a structurally valid JWT on the spot. Each generated token has:

- **Header** — `{ "alg": "HS256", "typ": "JWT" }`
- **Payload** — a random `sub` (UUID), `name`, `role`, `iat` (now), and `exp` (1 hour from now)
- **Signature** — 32 random bytes, base64url-encoded (not a real HMAC — the token is not cryptographically valid)

This is useful for quickly seeing how the decoder works without needing a real token.

## Permalinks

Every token you paste is reflected into the URL as `?v=<token>`. You can share or bookmark these URLs to reopen the decoder with the same token pre-filled.

- **Copy** — copies the current permalink to your clipboard
- **Reset** — clears the token and removes the URL parameter

## See also

- [HTTP Headers](/references/http-headers) — request and response headers including `Authorization`, caching, CORS, and security fields
- [HTTP Status Codes](/references/http-status-codes) — complete reference for 1xx–5xx response codes
