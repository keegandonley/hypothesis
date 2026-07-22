import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "@/lib/session";
import { insertEvent, countRecentEvents } from "@/lib/events";
import { sendWebhookPushNotification } from "@/lib/webhook-push";
import { incrementStat } from "@/lib/stats";
import { readRawBody, PayloadTooLargeError } from "@/lib/raw-body";
import { track } from "@vercel/analytics/server";

export const config = { api: { bodyParser: false } };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") {
    res.status(204).end();

    return;
  }

  const { sessionId } = req.query as { sessionId: string };

  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!UUID_RE.test(sessionId)) {
    res.status(404).json({ error: "session not found" });

    return;
  }

  const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

  try {
    const session = await getSession(sessionId);

    if (!session) {
      res.status(404).json({ error: "session not found" });

      return;
    }

    const native = session.deviceId != null;

    if (!native) {
      const age = Date.now() - new Date(session.updatedAt).getTime();

      if (age > SESSION_TIMEOUT_MS) {
        res.status(410).json({ error: "session expired" });

        return;
      }
    }

    if (session.ipAddress !== "::1" && session.ipAddress !== "::native") {
      const recentCount = await countRecentEvents(sessionId);

      if (recentCount >= 500) {
        res
          .status(429)
          .json({ error: "rate limit exceeded: max 500 events per hour" });

        return;
      }
    }

    const STRIP_HEADER_PREFIXES = ["x-vercel-", "x-forwarded-"];
    const STRIP_HEADERS = new Set([
      "forwarded",
      "x-real-ip",
      "x-matched-path",
      "connection",
    ]);

    const headersObj: Record<string, string> = {};

    Object.entries(req.headers).forEach(([k, v]) => {
      if (
        STRIP_HEADERS.has(k) ||
        STRIP_HEADER_PREFIXES.some((p) => k.startsWith(p))
      )
        return;
      headersObj[k] = Array.isArray(v) ? v.join(", ") : (v ?? "");
    });

    let payload: unknown = null;
    let rawBody: string | null = null;

    const contentType = req.headers["content-type"] ?? "";
    let bodyText: string;

    try {
      bodyText = await readRawBody(req);
    } catch (err) {
      if (err instanceof PayloadTooLargeError) {
        // Only tear the socket down once the 413 has actually flushed —
        // destroying earlier resets the connection before the client sees it.
        res.once("finish", () => req.destroy());
        res.status(413).json({ error: "payload too large: max 1MB" });

        return;
      }

      throw err;
    }

    if (bodyText) {
      rawBody = bodyText;
      if (contentType.includes("application/json")) {
        try {
          payload = JSON.parse(bodyText);
          rawBody = null;
        } catch {
          // not valid JSON — keep rawBody, leave payload null
        }
      }
    }

    const eventId = crypto.randomUUID();

    await insertEvent({
      id: eventId,
      sessionId: session.id,
      method: req.method ?? "",
      headers: headersObj,
      payload,
      rawBody,
    });

    if (native && session.deviceId) {
      await sendWebhookPushNotification(
        session.deviceId,
        req.method ?? "",
        eventId,
      ).catch(() => {
        /* noop */
      });
      await incrementStat("webhook_events_native").catch((err: unknown) => {
        console.error("[stats] failed to increment webhook_events_native", err);
      });
    } else {
      await incrementStat("webhook_events_web").catch((err: unknown) => {
        console.error("[stats] failed to increment webhook_events_web", err);
      });
    }

    try {
      await track("Webhook Received", { method: req.method ?? "", native });
    } catch (err) {
      console.warn("[analytics] failed to track Webhook Received", err);
    }

    res.status(200).json({ ok: true, eventId });

    return;
  } catch (err) {
    console.error("webhook error", err);

    res.status(500).json({ error: "internal server error" });

    return;
  }
}
