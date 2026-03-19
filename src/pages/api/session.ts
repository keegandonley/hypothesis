import type { NextApiRequest, NextApiResponse } from "next";
import {
  createSession,
  touchSession,
  countRecentSessionsByIp,
} from "@/lib/session";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  // Prefer Vercel's trusted IP header (not client-appendable); fall back for local dev
  const ip =
    (req.headers["x-vercel-forwarded-for"] as string) ??
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ??
    (req.headers["x-real-ip"] as string) ??
    "0.0.0.0";

  let body: { sessionId?: string } = {};
  const contentType = (req.headers["content-type"] as string) ?? "";
  if (contentType.includes("application/json")) {
    body = req.body ?? {};
  }

  const ALLOWED_HOSTS = new Set([
    "hypothesis.sh",
    "observation.sh",
    "conclusion.sh",
    "falsify.sh",
    "localhost:3000",
  ]);

  try {
    const host = req.headers.host ?? "";
    if (!ALLOWED_HOSTS.has(host)) {
      return res.status(400).json({ error: "invalid host" });
    }
    const protocol = (req.headers["x-forwarded-proto"] as string) ?? "http";
    const webhookBase = `${protocol}://${host}`;

    if (body.sessionId) {
      const session = await touchSession(body.sessionId);
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

    if (ip !== "::1") {
      const recentCount = await countRecentSessionsByIp(ip);
      if (recentCount >= 3) {
        return res
          .status(429)
          .json({
            error: "rate limit exceeded: max 3 sessions per IP per 10 minutes",
          });
      }
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
