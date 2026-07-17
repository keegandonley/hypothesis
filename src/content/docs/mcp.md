# MCP Server

Connect coding agents to hypothesis.sh for mobile push notifications and webhook testing.

## Overview

The hypothesis.sh MCP (Model Context Protocol) server lets AI coding agents send push notifications to your iOS device and test webhook integrations. Agents can create webhook sessions, receive HTTP requests, and verify delivery — all through natural language commands.

## Configuration

Add the hypothesis MCP server to your agent's configuration:

### Claude Code

```bash
claude mcp add hypothesis --transport http https://hypothesis.sh/api/mcp
```

### Cursor

Add to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "hypothesis": {
      "url": "https://hypothesis.sh/api/mcp"
    }
  }
}
```

### Other MCP Clients

The server speaks the Streamable HTTP transport. Any MCP-compatible client can connect to:

```
https://hypothesis.sh/api/mcp
```

No authentication required.

> **Using the old SSE endpoint?** `https://hypothesis.sh/api/mcp/sse` (`--transport sse`) has been **retired** and now returns `410 Gone`. Remove the old configuration and re-add the server with the `http` transport command above.

## Available Tools

The MCP server exposes three tools that agents can call:

### send_push_notification

Send a push notification to a pre-registered iOS device.

**Parameters:**

| Parameter | Type   | Required | Description                              |
| --------- | ------ | -------- | ---------------------------------------- |
| deviceId  | string | yes      | Device ID from the hypothesis.sh iOS app |
| title     | string | yes      | Notification title                       |
| body      | string | yes      | Notification body text                   |

**Example:**

```
Send a push notification to device abc-123 with title "Build Complete" and body "Your deployment finished successfully"
```

**Response:**

On success, returns the APNS ID. On failure, returns an error message.

**Finding your device ID:**

1. Open the hypothesis.sh iOS app
2. Go to **Settings**
3. Copy the **Device ID** shown there

### create_webhook_session

Create a new webhook session for receiving HTTP requests.

**Parameters:** None

**Example:**

```
Create a webhook session so I can test incoming GitHub webhooks
```

**Response:**

Returns a JSON object with:

```json
{
  "sessionId": "55bc106c-49d4-4d8f-aec9-e801fdc3ede5",
  "webhookUrl": "https://hypothesis.sh/api/webhook/55bc106c-49d4-4d8f-aec9-e801fdc3ede5"
}
```

Use the `webhookUrl` to receive HTTP requests. The `sessionId` is used with `list_webhook_events`.

### list_webhook_events

List recent webhook events received by a session.

**Parameters:**

| Parameter | Type   | Required | Description                                      |
| --------- | ------ | -------- | ------------------------------------------------ |
| sessionId | string | yes      | Session ID returned by create_webhook_session    |
| limit     | number | no       | Maximum events to return (default: 50, max: 200) |

**Example:**

```
Show me the webhook events for session 55bc106c-49d4-4d8f-aec9-e801fdc3ede5
```

**Response:**

Returns a JSON array of events, each containing:

- `method` — HTTP verb (GET, POST, etc.)
- `headers` — Request headers
- `payload` — Parsed JSON body (if applicable)
- `rawBody` — Raw body text (if not JSON)
- `receivedAt` — ISO 8601 timestamp

## Prompt Templates

The MCP server provides two prompt templates that guide agents through common workflows:

### webhook-testing

Step-by-step workflow for testing webhook integrations. Includes:

- Creating a session
- Sending test requests with curl
- Verifying events were received
- Handling session expiry

**Usage:**

```
Help me test webhooks using the webhook-testing workflow
```

### cicd-notification-setup

Guide for setting up CI/CD build and deployment notifications to your mobile device. Covers:

- Testing push notifications
- Configuring GitHub Actions
- Setting up Vercel webhooks
- Integrating Xcode Cloud

**Usage:**

```
Help me set up CI/CD notifications using the cicd-notification-setup workflow
```

## Sending Webhooks

Once you have a webhook URL from `create_webhook_session`, you can send HTTP requests to it using curl or any HTTP client:

```bash
curl -X POST https://hypothesis.sh/api/webhook/55bc106c-49d4-4d8f-aec9-e801fdc3ede5 \
  -H "Content-Type: application/json" \
  -d '{"event":"build","status":"success"}'
```

The webhook accepts **GET, POST, PUT, PATCH, and DELETE** requests. CORS is fully open, so you can send requests from browsers or any cross-origin context.

**Body parsing:** If the request body is valid JSON, it's parsed and stored as `payload`. Otherwise, it's stored as `rawBody`.

## Session Expiry

Webhook sessions expire after **5 minutes** of inactivity. If you try to send a request to an expired session, you'll receive:

```
HTTP 410 Gone
{"error": "session expired"}
```

**Handling expiry:**

When your agent encounters a 410 error:

1. Call `create_webhook_session` to get a new session
2. Update your webhook URL in your test configuration
3. Continue testing

The `webhook-testing` prompt template includes guidance on handling session expiry gracefully.

## Rate Limits

To protect the service, these limits apply:

- **Session creation:** 3 sessions per IP per 10 minutes
- **Requests per session:** 500 requests per hour
- **Request body size:** 1 MB maximum

Requests exceeding these limits receive `HTTP 429 Too Many Requests` or `HTTP 413 Content Too Large`.

## Example Workflows

### Testing a GitHub Webhook

```
1. Create a webhook session
2. Configure GitHub to send events to the webhook URL
3. Trigger an event in your GitHub repo
4. List the webhook events to verify delivery
```

### CI/CD Notifications

```
1. Get your device ID from the hypothesis.sh iOS app
2. Send a test push notification to verify it works
3. Configure your CI/CD system to call the push notification tool
4. Receive build/deployment notifications on your device
```

### Webhook Debugging

```
1. Create a webhook session
2. Send test requests with different payloads
3. List events to inspect headers and body parsing
4. Iterate until your integration works correctly
```

## Security

- **Device IDs:** Treat your device ID like a secret. Anyone with it can send push notifications to your device.
- **Webhook sessions:** Session IDs are UUIDs and not easily guessable, but don't share them publicly.
- **No authentication:** The MCP endpoint is public. Security relies on knowing the device ID and session UUID.

## Troubleshooting

### Push notification fails with "No push token found"

The device ID isn't registered. Install the hypothesis.sh iOS app and open it to register your device.

### Push notification fails with APNS error

Check that the server has APNS environment variables configured (APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY_P8, APNS_BUNDLE_ID). This is typically only an issue in local development — production deployments have these configured.

### Webhook returns 410 Gone

The session expired after 5 minutes of inactivity. Create a new session with `create_webhook_session`.

### Webhook returns 429 Too Many Requests

You've exceeded the 500 requests per hour limit. Wait for the rolling hour window to reset, or create a new session.

### Events not showing up

- Verify the webhook URL is correct (includes the full session ID)
- Check that you're sending to the correct HTTP method
- Use `list_webhook_events` with the correct session ID
- Ensure the session hasn't expired

## Related Documentation

- [Push Test](/docs/push-test) — Manual push notification testing tool
- [Webhook](/docs/webhook) — Browser-based webhook inspection tool
