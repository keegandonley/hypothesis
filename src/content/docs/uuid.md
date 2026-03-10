# uuid

Generate UUIDs of any version with one click.

## Overview

`uuid` is a browser-based UUID generator. A new UUID is generated automatically on every page load — no input required. Choose between **v1**, **v4**, and **v7** depending on your use case. All generation happens in the browser using the `uuid` package.

## Versions

### v1 — Timestamp + MAC address

UUID v1 encodes the current timestamp and the MAC address (or a random node ID in environments where the MAC is unavailable). The timestamp component makes v1 UUIDs monotonically increasing within a node, but the embedded time and node information means they are not anonymous.

### v4 — Random

UUID v4 is entirely random (122 random bits). It is the most widely used version and the right default when you just need a unique identifier with no embedded meaning.

### v7 — Unix timestamp + random

UUID v7 encodes a Unix millisecond timestamp in the most-significant bits followed by random data. This makes v7 UUIDs **lexicographically sortable by creation time**, which is useful as a primary key in databases. v7 is the recommended version for new systems that need both uniqueness and time-ordering.

## Switching versions

Click **v1**, **v4**, or **v7** in the panel header to switch versions. Switching immediately generates a new UUID of the selected version. The version badge in the header updates to reflect the active version — blue for v4, yellow for v1 and v7.

## Regenerate

Click **Regenerate** to generate a new UUID of the currently selected version without leaving the page.

## Copy

Click **Copy** in the bottom-right of the panel to copy the UUID to your clipboard. The button briefly shows **Copied!** as confirmation.

## URL state

The URL tracks the selected version:

```
/uuid?version=4
```

No UUID value is stored in the URL — UUIDs are ephemeral by design. Navigating directly to `/uuid?version=7` will load the page with v7 selected and auto-generate a fresh v7 UUID.

| Parameter | Values | Default |
| --- | --- | --- |
| `version` | `1`, `4`, `7` | `4` |
