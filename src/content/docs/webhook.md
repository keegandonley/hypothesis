# webhook

Inspect incoming HTTP requests in real time with a personal webhook URL.

## Overview

`webhook` gives you a unique URL that accepts any HTTP request and displays it instantly in your browser. Send a request from curl, a CI job, a third-party service, or anywhere else — the method, headers, and body appear in the panel within seconds. No account required.

## Your webhook URL

When you open the webhook page, a session is created and your personal URL is shown at the top of the panel:

```
https://hypothesis.sh/api/webhook/<session-id>
```

The URL accepts **GET, POST, PUT, PATCH, and DELETE** requests. CORS is fully open (`Access-Control-Allow-Origin: *`), so you can send requests directly from a browser or any cross-origin context.

## Capturing requests

Every request sent to your webhook URL is captured and displayed in the panel. Each entry shows:

- **Method** — HTTP verb (GET, POST, etc.)
- **Headers** — all request headers
- **Body** — the request body, if present

**Body parsing:** If the request body is valid JSON, it is parsed and displayed as formatted JSON. If the body is not valid JSON, it is stored and shown as raw text.

Click any request in the list to expand it and inspect the full headers and body.

The panel polls for new requests every **2.5 seconds**.

## curl helper

The curl panel generates a ready-to-run curl command pointed at your webhook URL. Use the method toggle to switch between GET, POST, PUT, PATCH, and DELETE — the command updates automatically. Click **Copy** to copy it to your clipboard.

## Sessions

A session is created automatically on your first visit and its ID is saved in `localStorage`. Returning to the page restores the same session and resumes capturing requests — no setup needed.

Click **New session** to discard the current session and start fresh with a new URL.

## Sharing

Append `?s=<session-id>` to the webhook page URL to view someone else's session:

```
https://hypothesis.sh/webhook?s=<session-id>
```

Viewing a shared URL is read-only and does **not** overwrite your own session stored in `localStorage`. Your session remains untouched.

| Scenario                       | Result                                                     |
| ------------------------------ | ---------------------------------------------------------- |
| Open `/webhook` with no params | Your own session is loaded (or created)                    |
| Open `/webhook?s=<other-id>`   | The shared session is displayed; your session is unchanged |
| Open `/webhook?s=<your-id>`    | Your session is displayed as normal                        |

## Keeping sessions alive

While the webhook page is open, the browser sends a **heartbeat** to the server every **60 seconds**. This resets the inactivity clock and keeps your webhook URL active.

If you navigate away or close the tab, heartbeats stop. After **5 minutes of inactivity**, the webhook receiver returns **HTTP 410 Gone** to any incoming requests. Returning to the page or reloading it resumes heartbeats and reactivates the session immediately.

## Session expiry and cleanup

There are two distinct inactivity thresholds:

1. **Webhook receiver timeout — 5 minutes.** If no heartbeat or incoming request has been seen for 5 minutes, the server returns `410 Gone` for any new requests to that webhook URL. The session still exists; it just stops accepting requests until the page is open again.

2. **Database cleanup — 1 hour.** Sessions that have been inactive for more than 1 hour are permanently deleted. This runs daily at **02:00 UTC**.

While the webhook page is open, the 60-second heartbeat resets both clocks, so neither threshold is reached during normal use.

## URL state

| Parameter | Description                             |
| --------- | --------------------------------------- |
| `s`       | Session ID for viewing a shared session |
