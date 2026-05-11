import type { NextApiRequest, NextApiResponse } from "next";
import { sendApnsNotification } from "@/lib/apns";
import { getPushTokenByDeviceId } from "@/lib/push-tokens";
import { insertPushNotification } from "@/lib/push-notifications";
import { track } from "@vercel/analytics/server";

export const config = { api: { bodyParser: false } };

const MAX_BODY_BYTES = 1_048_576;

function readBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    let byteLength = 0;
    req.on("data", (chunk: Buffer) => {
      byteLength += chunk.byteLength;
      if (byteLength > MAX_BODY_BYTES) {
        req.destroy();
        reject(new Error("PAYLOAD_TOO_LARGE"));
        return;
      }
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

type XcodeCloudEvent = {
  metadata?: {
    attributes?: {
      eventType?: string;
    };
  };
  ciProduct?: {
    attributes?: {
      name?: string;
    };
  };
  ciWorkflow?: {
    attributes?: {
      name?: string;
    };
  };
  ciBuildRun?: {
    attributes?: {
      number?: number;
      executionProgress?: string;
      sourceCommit?: {
        commitSha?: string;
        author?: { displayName?: string };
      };
    };
  };
  scmGitReference?: {
    attributes?: {
      name?: string;
      kind?: string;
    };
  };
};

function formatNotification(event: XcodeCloudEvent): { title: string; subtitle: string; body: string } {
  const productName = event.ciProduct?.attributes?.name ?? "Unknown App";
  const buildNumber = event.ciBuildRun?.attributes?.number;
  const branch = event.scmGitReference?.attributes?.name;
  const eventType = event.metadata?.attributes?.eventType;

  const detail = [
    branch ?? null,
    buildNumber != null ? `#${buildNumber}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  let title: string;
  switch (eventType) {
    case "BUILD_STARTED":   title = "Build started";   break;
    case "BUILD_SUCCEEDED": title = "Build succeeded"; break;
    case "BUILD_FAILED":    title = "Build failed";    break;
    case "BUILD_ERRORED":   title = "Build errored";   break;
    case "BUILD_CANCELED":  title = "Build canceled";  break;
    default:                title = eventType ?? "Unknown event"; break;
  }

  return { title, subtitle: productName, body: detail };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { deviceId } = req.query as { deviceId: string };

  let rawBody: string;
  try {
    rawBody = await readBody(req);
  } catch (e) {
    if ((e as Error).message === "PAYLOAD_TOO_LARGE") {
      return res.status(413).json({ error: "payload too large" });
    }
    throw e;
  }

  const device = await getPushTokenByDeviceId(deviceId);
  if (!device) return res.status(404).json({ error: "device not found" });
  if (!device.token) return res.status(200).end();

  let event: XcodeCloudEvent;
  try {
    event = JSON.parse(rawBody) as XcodeCloudEvent;
  } catch {
    return res.status(400).json({ error: "invalid JSON" });
  }

  const eventType = event.metadata?.attributes?.eventType;
  const { title, subtitle, body } = formatNotification(event);
  const data = {
    type: "xcode_cloud_event",
    eventType: eventType,
    productName: event.ciProduct?.attributes?.name,
    buildNumber: event.ciBuildRun?.attributes?.number,
    icon: "logo-apple-appstore",
  };

  const result = await sendApnsNotification(device.token, title, body, data, { subtitle }, device.sandbox);

  await insertPushNotification({
    deviceId,
    title,
    body,
    data,
    apnsId: result.apnsId ?? null,
    success: result.ok,
  }).catch((err) => console.error("[xcode-webhook] failed to record notification", err));

  try {
    await track("Xcode Cloud Webhook Received", { eventType: eventType ?? "unknown", success: result.ok });
  } catch (err) {
    console.warn("[analytics] failed to track Xcode Cloud Webhook Received", err);
  }

  if (!result.ok) {
    console.error(`[xcode-webhook] APNS error for device ${deviceId}:`, result.error);
  }

  return res.status(200).json({ ok: true });
}
