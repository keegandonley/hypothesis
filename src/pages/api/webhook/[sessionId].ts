import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "@/lib/session";
import { insertEvent, countRecentEvents } from "@/lib/events";

export const config = { api: { bodyParser: false } };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const MAX_BODY_BYTES = 1_048_576; // 1MB

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const { sessionId } = req.query as { sessionId: string };

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(sessionId)) {
    return res.status(404).json({ error: "session not found" });
  }

  const SESSION_TIMEOUT_MS = 5 * 60 * 1000;

  try {
    const session = await getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: "session not found" });
    }

    const age = Date.now() - new Date(session.updatedAt).getTime();
    if (age > SESSION_TIMEOUT_MS) {
      return res.status(410).json({ error: "session expired" });
    }

    if (session.ipAddress !== "::1") {
      const recentCount = await countRecentEvents(sessionId);
      if (recentCount >= 500) {
        return res.status(429).json({ error: "rate limit exceeded: max 500 events per hour" });
      }
    }

    const headersObj: Record<string, string> = {};
    Object.entries(req.headers).forEach(([k, v]) => {
      headersObj[k] = Array.isArray(v) ? v.join(", ") : (v ?? "");
    });

    let payload: unknown = null;
    let rawBody: string | null = null;

    const contentType = (req.headers["content-type"] as string) ?? "";
    let bodyText: string;
    try {
      bodyText = await readBody(req);
    } catch (err) {
      if (err instanceof Error && err.message === "PAYLOAD_TOO_LARGE") {
        return res.status(413).json({ error: "payload too large: max 1MB" });
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
      method: req.method!,
      headers: headersObj,
      payload,
      rawBody,
    });

    return res.status(200).json({ ok: true, eventId });
  } catch (err) {
    console.error("webhook error", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
