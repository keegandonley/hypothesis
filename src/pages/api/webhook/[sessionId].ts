import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "@/lib/session";
import { insertEvent } from "@/lib/events";

export const config = { api: { bodyParser: false } };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

function readBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => { data += chunk; });
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

    const headersObj: Record<string, string> = {};
    Object.entries(req.headers).forEach(([k, v]) => {
      headersObj[k] = Array.isArray(v) ? v.join(", ") : (v ?? "");
    });

    let payload: unknown = null;
    let rawBody: string | null = null;

    const contentType = (req.headers["content-type"] as string) ?? "";
    const bodyText = await readBody(req);

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
