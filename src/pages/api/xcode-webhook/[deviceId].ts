import type { NextApiRequest, NextApiResponse } from "next";
import { sendApnsNotification } from "@/lib/apns";
import { getPushTokenByDeviceId } from "@/lib/push-tokens";
import { insertPushNotification } from "@/lib/push-notifications";
import { readRawBody, PayloadTooLargeError } from "@/lib/raw-body";
import { track } from "@vercel/analytics/server";

export const config = { api: { bodyParser: false } };

interface XcodeCloudEvent {
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
}

function formatNotification(event: XcodeCloudEvent): {
  title: string;
  subtitle: string;
  body: string;
} {
  const productName = event.ciProduct?.attributes?.name ?? "Unknown App";
  const buildNumber = event.ciBuildRun?.attributes?.number;
  const branch = event.scmGitReference?.attributes?.name;
  const eventType = event.metadata?.attributes?.eventType ?? "";

  const detail = [
    branch ?? null,
    buildNumber != null ? `#${buildNumber}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  let title: string;

  switch (eventType) {
    case "BUILD_CREATED":
      title = "Build created";
      break;
    case "BUILD_STARTED":
      title = "Build started";
      break;
    case "BUILD_SUCCEEDED":
      title = "Build succeeded";
      break;
    case "BUILD_FAILED":
      title = "Build failed";
      break;
    case "BUILD_ERRORED":
      title = "Build errored";
      break;
    case "BUILD_CANCELED":
      title = "Build canceled";
      break;
    case "BUILD_COMPLETED":
      title = "Build completed";
      break;
    default:
      title = eventType ?? "Unknown event";
      break;
  }

  return { title, subtitle: productName, body: detail };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).end();

    return;
  }

  const { deviceId } = req.query as { deviceId: string };

  let rawBody: string;

  try {
    rawBody = await readRawBody(req);
  } catch (e) {
    if (e instanceof PayloadTooLargeError) {
      // Only tear the socket down once the 413 has actually flushed —
      // destroying earlier resets the connection before the client sees it.
      res.once("finish", () => req.destroy());
      res.status(413).json({ error: "payload too large" });

      return;
    }

    throw e;
  }

  const device = await getPushTokenByDeviceId(deviceId);

  if (!device) {
    res.status(404).json({ error: "device not found" });

    return;
  }

  if (!device.token) {
    res.status(200).end();

    return;
  }

  let event: XcodeCloudEvent;

  try {
    event = JSON.parse(rawBody) as XcodeCloudEvent;
  } catch {
    res.status(400).json({ error: "invalid JSON" });

    return;
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

  const result = await sendApnsNotification(
    device.token,
    title,
    body,
    data,
    { subtitle },
    device.sandbox,
  );

  await insertPushNotification({
    deviceId,
    title,
    body,
    data,
    apnsId: result.apnsId ?? null,
    success: result.ok,
  }).catch((err: unknown) => {
    console.error("[xcode-webhook] failed to record notification", err);
  });

  try {
    await track("Xcode Cloud Webhook Received", {
      eventType: eventType ?? "unknown",
      success: result.ok,
    });
  } catch (err) {
    console.warn(
      "[analytics] failed to track Xcode Cloud Webhook Received",
      err,
    );
  }

  if (!result.ok) {
    console.error(
      `[xcode-webhook] APNS error for device ${deviceId}:`,
      result.error,
    );
  }

  res.status(200).json({ ok: true });
}
