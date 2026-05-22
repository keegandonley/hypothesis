import type { NextApiRequest, NextApiResponse } from "next";
import {
  createSession,
  touchSession,
  countRecentSessionsByIp,
} from "@/lib/session";
import { track } from "@vercel/analytics/server";
import { incrementStat } from "@/lib/stats";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });

    return;
  }

  // Prefer Vercel's trusted IP header (not client-appendable); fall back for local dev
  const ip =
    (req.headers["x-vercel-forwarded-for"] as string) ??
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ??
    (req.headers["x-real-ip"] as string) ??
    "0.0.0.0";

  let body: { sessionId?: string } = {};
  const contentType = req.headers["content-type"] ?? "";

  if (contentType.includes("application/json")) {
    body = (req.body as { sessionId?: string }) ?? {};
  }

  const ALLOWED_HOSTS = new Set([
    "hypothesis.sh",
    "observation.sh",
    "conclusion.sh",
    "falsify.sh",
    "localhost:3000",
    "localhost:3001",
  ]);

  try {
    const host = req.headers.host ?? "";

    if (!ALLOWED_HOSTS.has(host) && !host.endsWith("k10y-team.vercel.app")) {
      res.status(400).json({ error: "invalid host" });

      return;
    }

    const protocol = (req.headers["x-forwarded-proto"] as string) ?? "http";
    const webhookBase = `${protocol}://${host}`;

    if (body.sessionId) {
      const session = await touchSession(body.sessionId);

      if (!session) {
        res.status(404).json({ error: "session not found" });

        return;
      }

      res.json({
        sessionId: session.id,
        webhookUrl: `${webhookBase}/api/webhook/${session.id}`,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      });

      return;
    }

    if (ip !== "::1") {
      const recentCount = await countRecentSessionsByIp(ip);

      if (recentCount >= 3) {
        res.status(429).json({
          error: "rate limit exceeded: max 3 sessions per IP per 10 minutes",
        });

        return;
      }
    }

    const sessionId = crypto.randomUUID();
    const session = await createSession(sessionId, ip);

    await incrementStat("webhook_sessions_web").catch((err: unknown) => {
      console.error("[stats] failed to increment webhook_sessions_web", err);
    });
    try {
      await track("Session Created");
    } catch (err) {
      console.warn("[analytics] failed to track Session Created", err);
    }

    res.json({
      sessionId: session.id,
      webhookUrl: `${webhookBase}/api/webhook/${session.id}`,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });

    return;
  } catch (err) {
    console.error("session error", err);

    res.status(500).json({ error: "internal server error" });

    return;
  }
}
