# csp analyzer

Parse, visualize, and audit a `Content-Security-Policy` header, then optionally fetch a live policy from any URL.

## Overview

CSP analyzer takes a Content-Security-Policy header value and breaks it into three views:

- **Audit** — security findings ranked High → Medium → Low → Info, each with an explanation and remediation.
- **Effective policy** — what actually applies to each resource type after `default-src` fallback resolution.
- **Directives** — the raw parsed directives and their source lists.

The parsing and audit run **entirely in your browser**. The only server interaction is the optional "Fetch from URL" feature (see below), which retrieves a remote header — analysis still happens client-side.

## Pasting a policy

Paste a header value into the **Policy** box. You can paste either the bare value:

```
default-src 'self'; script-src 'self' 'unsafe-inline'
```

…or the full header line — a leading `Content-Security-Policy:` (or `Content-Security-Policy-Report-Only:`) prefix is stripped automatically.

Click **Sample** to load an intentionally flawed policy and see the audit in action.

## What the audit checks

Script execution risks:

- `'unsafe-inline'` in `script-src` (and whether a nonce/hash/`'strict-dynamic'` neutralizes it for modern browsers)
- `'unsafe-eval'` and `'unsafe-hashes'`
- Wildcard `*` and scheme-only sources (`https:`, `http:`, `data:`) in `script-src`
- Presence of nonces and `'strict-dynamic'` (informational, with caveats)

Missing protections:

- No `default-src` fallback
- `object-src` not locked to `'none'`
- Missing `base-uri` (base-tag injection)
- Missing `frame-ancestors` (clickjacking)
- Missing `form-action`
- `'unsafe-inline'` in `style-src`

Hygiene:

- Deprecated `report-uri` without `report-to`
- Unknown / misspelled directives (silently ignored by browsers)
- Duplicate directives (only the first occurrence applies)

## Effective policy

CSP has a subtlety that trips people up: most **fetch directives** (`script-src`, `img-src`, `connect-src`, …) fall back to `default-src` when omitted — but `base-uri`, `form-action`, and `frame-ancestors` **do not**. The Effective policy table resolves each directive and labels how its value was derived:

- **explicit** — the directive was set directly
- **via default-src** — inherited from `default-src`
- **unrestricted** — neither set, so the browser applies no restriction

## Fetch from URL

Browsers cannot read another site's response headers from client-side JavaScript (CORS blocks it), so the **Fetch** button calls a small server endpoint (`/api/csp-fetch`) that retrieves the target's headers and returns only the CSP-related ones. The retrieved policy is dropped into the Policy box and analyzed client-side as usual.

The fetch endpoint is hardened against SSRF:

- Only `http`/`https` URLs are allowed.
- Requests to `localhost`, private, loopback, link-local, and cloud-metadata addresses are refused — including after DNS resolution and on every redirect hop.
- Redirects are capped and re-validated at each hop; requests time out quickly.
- Only response **headers** are read — the response body is never fetched or returned.

## Permalinks

The current policy is stored in the URL as `?policy=…`, so you can share an analysis or reload it later.

```
/csp?policy=default-src%20'self'%3B%20script-src%20'self'%20'unsafe-inline'
```

Use the **Copy** button in the Permalink row to copy the URL, or **Reset** to clear everything.
