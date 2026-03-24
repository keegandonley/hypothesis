# gist proxy

Serve a public GitHub Gist's raw file content via a stable URL.

## Overview

`/api/gist` fetches a public GitHub Gist by URL and returns the file content with the correct `Content-Type`. The primary use case is hosting ephemeral HTML snippets — paste a gist URL into the query param and share the proxy URL instead.

## Usage

```
GET /api/gist?url=<gist-url>
GET /api/gist?url=<gist-url>&file=<filename>
```

Calling `/api/gist` with no params redirects here.

| Param | Required | Description |
| --- | --- | --- |
| `url` | Yes | Full GitHub Gist URL (`https://gist.github.com/user/id`) |
| `file` | No | Filename to serve when the gist has multiple files. Defaults to the first file alphabetically. |

## Examples

Serve the only (or first) file in a gist:

```bash
curl https://hypothesis.sh/api/gist?url=https://gist.github.com/octocat/abc123
```

Serve a specific file from a multi-file gist:

```bash
curl "https://hypothesis.sh/api/gist?url=https://gist.github.com/octocat/abc123&file=index.html"
```

## Content-Type

The `Content-Type` response header is set from the file's detected type as reported by the GitHub API. An HTML file returns `text/html`, a JSON file returns `application/json`, and so on — so browsers will render or display the content appropriately.

## Caching

Responses are cached for 60 seconds (`Cache-Control: public, max-age=60`). Updates to the underlying gist will be reflected after at most one minute.

## Limitations

- **Public gists only.** Private gists return a 404.
- **No authentication.** Requests to the GitHub API are unauthenticated and subject to GitHub's anonymous rate limits (60 requests/hour per IP).
- The gist content is fetched on each (uncached) request — this is not a permanent hosting solution.

## Error responses

| Status | Meaning |
| --- | --- |
| 400 | Missing or invalid `url` param, or `file` not found in the gist |
| 404 | Gist does not exist or is private |
| 502 | GitHub API unreachable or returned an unexpected error |
