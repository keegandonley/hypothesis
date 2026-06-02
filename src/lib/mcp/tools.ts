import { z } from "zod";
import { getPushTokenByDeviceId } from "../push-tokens";
import { sendApnsNotification } from "../apns";
import { createSession } from "../session";
import { getEvents } from "../events";
import type { NextApiRequest } from "next";

function getBaseUrl(req: NextApiRequest): string {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;

  return `${proto}://${host}`;
}

function getIpFromRequest(req: NextApiRequest): string {
  const vercelForwarded = req.headers["x-vercel-forwarded-for"];

  if (typeof vercelForwarded === "string" && vercelForwarded) {
    return vercelForwarded.split(",")[0]?.trim() ?? "unknown";
  }

  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  const realIp = req.headers["x-real-ip"];

  if (typeof realIp === "string" && realIp) {
    return realIp;
  }

  return "unknown";
}

export const sendPushNotificationTool = {
  name: "send_push_notification",
  description:
    "Send a push notification to a pre-registered iOS device. The deviceId must be known upfront (e.g., configured in MCP settings or obtained from the iOS app).",
  inputSchema: {
    deviceId: z.string().describe("The device ID to send the notification to"),
    title: z.string().describe("Notification title"),
    body: z.string().describe("Notification body text"),
  },
  handler: async ({
    deviceId,
    title,
    body,
  }: {
    deviceId: string;
    title: string;
    body: string;
  }) => {
    const device = await getPushTokenByDeviceId(deviceId);

    if (!device?.token) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: No push token found for device "${deviceId}". The device must be registered via the iOS app first.`,
          },
        ],
        isError: true,
      };
    }

    try {
      const result = await sendApnsNotification(
        device.token,
        title,
        body,
        undefined,
        undefined,
        device.sandbox,
      );

      if (!result.ok) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error sending push notification: ${result.error ?? `HTTP ${result.statusCode}`}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Push notification sent successfully to device "${deviceId}". APNS ID: ${result.apnsId ?? "N/A"}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error sending push notification: ${error instanceof Error ? error.message : "Unknown error"}. Check that APNS environment variables are configured (APNS_KEY_ID, APNS_TEAM_ID, APNS_KEY_P8, APNS_BUNDLE_ID).`,
          },
        ],
        isError: true,
      };
    }
  },
};

export const createWebhookSessionTool = {
  name: "create_webhook_session",
  description:
    "Create a new webhook session. Returns the session ID and webhook URL that can be used to receive HTTP requests.",
  inputSchema: {},
  handler: async (req: NextApiRequest) => {
    const sessionId = crypto.randomUUID();
    const baseUrl = getBaseUrl(req);
    const webhookUrl = `${baseUrl}/api/webhook/${sessionId}`;
    const ipAddress = getIpFromRequest(req);

    await createSession(sessionId, ipAddress);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ sessionId, webhookUrl }, null, 2),
        },
      ],
    };
  },
};

export const listWebhookEventsTool = {
  name: "list_webhook_events",
  description:
    "List recent webhook events received by a session. Use this to verify that webhooks were received correctly.",
  inputSchema: {
    sessionId: z.string().describe("The session ID to list events for"),
    limit: z
      .number()
      .optional()
      .default(50)
      .describe("Maximum number of events to return (default: 50, max: 200)"),
  },
  handler: async ({
    sessionId,
    limit = 50,
  }: {
    sessionId: string;
    limit?: number;
  }) => {
    const events = await getEvents({
      sessionId,
      limit: Math.min(limit, 200),
    });

    const formatted = events.map((event) => ({
      id: event.id,
      method: event.method,
      headers: event.headers,
      payload: event.payload,
      rawBody: event.rawBody,
      receivedAt: event.receivedAt,
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ count: events.length, events: formatted }, null, 2),
        },
      ],
    };
  },
};
