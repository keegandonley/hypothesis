import { createHmac, timingSafeEqual } from "node:crypto";
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

      data += chunk.toString();
    });
    req.on("end", () => {
      resolve(data);
    });
    req.on("error", reject);
  });
}

interface VercelEvent {
  type: string;
  createdAt: number;
  payload?: {
    project?: { id?: string; name?: string };
    deployment?: { id?: string; name?: string; url?: string };
    domain?: { name?: string };
    alias?: { name?: string };
    check?: { name?: string };
    integration?: { name?: string };
  };
}

function formatNotification(event: VercelEvent): {
  title: string;
  body: string;
} {
  const project =
    event.payload?.project?.name ??
    event.payload?.deployment?.name ??
    "Unknown Project";

  switch (event.type) {
    case "deployment.created":
      return { title: project, body: "Deployment started" };
    case "deployment.succeeded":
      return { title: project, body: "Deployment succeeded" };
    case "deployment.error":
      return { title: project, body: "Deployment failed" };
    case "deployment.canceled":
      return { title: project, body: "Deployment canceled" };
    case "deployment.promoted":
      return { title: project, body: "Promoted to production" };
    case "project.created":
      return { title: project, body: "Project created" };
    case "project.removed":
      return { title: project, body: "Project removed" };
    case "domain.created":
      return {
        title: event.payload?.domain?.name ?? "New domain",
        body: "Domain added to Vercel",
      };
    case "integration-configuration.permission-upgraded":
      return { title: project, body: "Integration permissions upgraded" };
    case "integration-configuration.removed":
      return { title: project, body: "Integration removed" };
    case "integration-configuration.scope-change-confirmed":
      return { title: project, body: "Integration scope change confirmed" };
    default:
      return { title: project, body: event.type };
  }
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
    rawBody = await readBody(req);
  } catch (e) {
    if ((e as Error).message === "PAYLOAD_TOO_LARGE") {
      res.status(413).json({ error: "payload too large" });

      return;
    }

    throw e;
  }

  const signature = req.headers["x-vercel-signature"];

  if (!signature || typeof signature !== "string") {
    res.status(401).json({ error: "missing signature" });

    return;
  }

  const secret = process.env.VERCEL_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[vercel-webhook] VERCEL_WEBHOOK_SECRET not set");

    res.status(500).json({ error: "server misconfiguration" });

    return;
  }

  const computed = createHmac("sha1", secret).update(rawBody).digest("hex");
  const sigBuf = Buffer.from(signature);
  const computedBuf = Buffer.from(computed);

  if (
    sigBuf.length !== computedBuf.length ||
    !timingSafeEqual(sigBuf, computedBuf)
  ) {
    res.status(401).json({ error: "invalid signature" });

    return;
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

  let event: VercelEvent;

  try {
    event = JSON.parse(rawBody) as VercelEvent;
  } catch {
    res.status(400).json({ error: "invalid JSON" });

    return;
  }

  const { title, body } = formatNotification(event);
  const data = {
    type: "vercel_event",
    eventType: event.type,
    projectName:
      event.payload?.project?.name ?? event.payload?.deployment?.name,
    icon: "logo-vercel",
  };

  const result = await sendApnsNotification(
    device.token,
    title,
    body,
    data,
    undefined,
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
    console.error("[vercel-webhook] failed to record notification", err);
  });

  try {
    await track("Vercel Webhook Received", {
      eventType: event.type,
      success: result.ok,
    });
  } catch (err) {
    console.warn("[analytics] failed to track Vercel Webhook Received", err);
  }

  if (!result.ok) {
    console.error(
      `[vercel-webhook] APNS error for device ${deviceId}:`,
      result.error,
    );
  }

  res.status(200).json({ ok: true });
}
