# Basic Auth

Generate and decode HTTP Basic Authentication headers - entirely in your browser, no server involved.

## How it works

HTTP Basic Auth encodes credentials as `username:password` in Base64, then prepends `Basic ` to form the header value:

```
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```

## Modes

**Encode** - enter a username and password to produce the `Authorization` header and the raw Base64 token. The password field has a show/hide toggle.

**Decode** - paste a full `Authorization: Basic ...` header, a `Basic <token>` value, or just the bare Base64 token. The tool strips the prefix, decodes the token, and shows the username and password separately. The decoded password is masked by default with a show/hide toggle.

If the input cannot be decoded as valid Base64, the input field turns red.

## Encode output fields

| Field                | Description                                   |
| -------------------- | --------------------------------------------- |
| Authorization Header | The full header ready to paste into a request |
| Base64 Token         | Just the encoded credential string            |

## Usage

```bash
# curl with explicit header
curl -H "Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=" https://example.com/api

# or use the shorthand
curl -u username:password https://example.com/api
```

## Security notes

- Basic Auth transmits credentials with every request. Always use it over HTTPS.
- The Base64 encoding is **not encryption** - anyone who intercepts the header can decode it instantly.
- Avoid storing Basic Auth URLs (which embed credentials in the URL) in browser history or logs.

## Permalinks

In Encode mode, the username is synced to the URL (`?username=`) so you can bookmark a pre-filled form. The password is intentionally excluded.

In Decode mode, the token input is synced to the URL (`?token=`) so a specific header can be bookmarked or shared for inspection.
