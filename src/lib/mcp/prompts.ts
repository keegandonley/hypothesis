import { z } from "zod";

export const webhookTestingPrompt = {
  name: "webhook-testing",
  description:
    "Step-by-step workflow for testing webhook integrations. Guides you through creating a session, sending test requests, and verifying delivery.",
  argsSchema: {
    deviceId: z
      .string()
      .optional()
      .describe(
        "Optional device ID for receiving push notifications when webhooks arrive",
      ),
  },
  handler: (args: { deviceId?: string }) => {
    const deviceId = args.deviceId ?? "YOUR_DEVICE_ID";

    return {
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `# Webhook Testing Workflow

Follow these steps to test webhook integrations using hypothesis.sh:

## Step 1: Create a Webhook Session

Use the \`create_webhook_session\` tool to create a new session. This returns:
- \`sessionId\`: A unique identifier for your session
- \`webhookUrl\`: The URL to send HTTP requests to

## Step 2: Send Test Requests

Use the \`post_webhook\` tool (or curl) to send test requests to your webhook URL.

Example with curl:
\`\`\`bash
curl -X POST <webhookUrl> \\
  -H "Content-Type: application/json" \\
  -d '{"hello":"world"}'
\`\`\`

You can send GET, POST, PUT, PATCH, or DELETE requests. The webhook accepts any JSON body up to 1MB.

## Step 3: Verify Events

Use the \`list_webhook_events\` tool with your sessionId to see all received events. Each event includes:
- HTTP method
- Headers
- Body (parsed JSON or raw text)
- Timestamp

## Step 4: Handle Session Expiry

Sessions expire after **5 minutes** of inactivity. If you get a \`410 Gone\` error when posting:
1. Create a new session with \`create_webhook_session\`
2. Update your webhook URL in your test configuration
3. Continue testing

## Rate Limits

- 500 requests per hour per session
- 3 sessions per IP per 10 minutes

${deviceId !== "YOUR_DEVICE_ID" ? `\n## Push Notifications\n\nDevice "${deviceId}" will receive push notifications when webhooks arrive (if registered via the iOS app).\n` : ""}`,
          },
        },
      ],
    };
  },
};

export const cicdNotificationSetupPrompt = {
  name: "cicd-notification-setup",
  description:
    "Guide for setting up CI/CD build and deployment notifications to a mobile device via hypothesis.sh webhooks.",
  argsSchema: {
    deviceId: z
      .string()
      .describe("The device ID to receive push notifications"),
  },
  handler: (args: { deviceId: string }) => {
    return {
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `# CI/CD Notification Setup

Set up build and deployment notifications to your iOS device using hypothesis.sh.

## Prerequisites

- Device ID: \`${args.deviceId}\`
- iOS app installed and registered

## Step 1: Test Push Notifications

First, verify push notifications work:

Use the \`send_push_notification\` tool:
- deviceId: \`${args.deviceId}\`
- title: "Test Notification"
- body: "CI/CD notifications are working!"

If you receive the notification, proceed to configure your CI/CD system.

## Step 2: Configure Your CI/CD System

### GitHub Actions

Add a webhook step to your workflow:

\`\`\`yaml
- name: Notify on Build
  if: always()
  run: |
    curl -X POST https://hypothesis.sh/api/webhook/SESSION_ID \\
      -H "Content-Type: application/json" \\
      -d '{
        "event": "github_build",
        "status": "\${{ job.status }}",
        "repo": "\${{ github.repository }}",
        "branch": "\${{ github.ref_name }}",
        "commit": "\${{ github.sha }}",
        "run_url": "\${{ github.server_url }}/\${{ github.repository }}/actions/runs/\${{ github.run_id }}"
      }'
\`\`\`

### Vercel Deployment Webhooks

1. Go to your Vercel project settings → Webhooks
2. Add a new webhook:
   - URL: \`https://hypothesis.sh/api/vercel-webhook/${args.deviceId}\`
   - Events: Deployment (optional: filter by status)
3. Save and test by triggering a deployment

### Xcode Cloud

1. In App Store Connect → Xcode Cloud → Settings
2. Add a webhook:
   - URL: \`https://hypothesis.sh/api/xcode-webhook/${args.deviceId}\`
   - Events: Build completion
3. Save and trigger a test build

## Step 3: Create a Persistent Webhook Session

For CI/CD integration, you need a webhook URL:

Use \`create_webhook_session\` to get a session ID and webhook URL.

**Note:** Web sessions expire after 5 minutes of inactivity. For persistent notifications, consider using the native webhook endpoints:
- \`/api/vercel-webhook/{deviceId}\` for Vercel
- \`/api/xcode-webhook/{deviceId}\` for Xcode Cloud

These endpoints are tied to your device and don't expire.

## Step 4: Verify Notifications

After configuring your CI/CD system:
1. Trigger a build/deployment
2. Check your iOS device for push notifications
3. Use \`list_webhook_events\` to inspect the webhook payload if needed

## Troubleshooting

- **No push notification?** Use \`send_push_notification\` to test directly
- **Webhook returns 410?** Session expired — create a new one or use native endpoints
- **Events not showing?** Verify the webhook URL is correct and the session is active`,
          },
        },
      ],
    };
  },
};
