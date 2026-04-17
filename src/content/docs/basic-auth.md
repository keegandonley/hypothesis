# Basic Auth Generator

Generate the `Authorization` header value for HTTP Basic Authentication from a username and password.

## How it works

HTTP Basic Auth encodes credentials as `username:password` in Base64, then prepends `Basic ` to form the header value:

```
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```

The encoding is done entirely in your browser — credentials are never sent to a server.

## Output fields

| Field | Description |
|-------|-------------|
| Authorization Header | The full header ready to paste into a request |
| Base64 Token | Just the encoded credential string |
| Decoded | The raw `username:password` string before encoding |

## Usage

```bash
# curl
curl -H "Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=" https://example.com/api

# or use the shorthand
curl -u username:password https://example.com/api
```

## Security notes

- Basic Auth transmits credentials with every request. Always use it over HTTPS.
- The Base64 encoding is **not encryption** — anyone who intercepts the header can decode it instantly.
- Avoid storing Basic Auth URLs (which embed credentials in the URL) in browser history or logs.
