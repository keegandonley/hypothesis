import type { NextApiRequest, NextApiResponse } from "next";
import { createSession, touchSession } from "@/lib/session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ??
    (req.headers["x-real-ip"] as string) ??
    "0.0.0.0";

  let body: { sessionId?: string } = {};
  const contentType = (req.headers["content-type"] as string) ?? "";
  if (contentType.includes("application/json")) {
    body = req.body ?? {};
  }

  try {
    const protocol = (req.headers["x-forwarded-proto"] as string) ?? "http";
    const host = req.headers.host;
    const webhookBase = `${protocol}://${host}`;

    if (body.sessionId) {
      const session = await touchSession(body.sessionId, ip);
      if (!session) {
        return res.status(404).json({ error: "session not found" });
      }
      return res.json({
        sessionId: session.id,
        webhookUrl: `${webhookBase}/api/webhook/${session.id}`,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      });
    }

    const sessionId = crypto.randomUUID();
    const session = await createSession(sessionId, ip);
    return res.json({
      sessionId: session.id,
      webhookUrl: `${webhookBase}/api/webhook/${session.id}`,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (err) {
    console.error("session error", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
