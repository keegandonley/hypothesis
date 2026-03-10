import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createSession, touchSession } from "@/lib/session";

export const config = { runtime: "edge" };

export default async function handler(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "method not allowed" }, { status: 405 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0";

  let body: { sessionId?: string } = {};
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
    }
  }

  try {
    const webhookBase = new URL(req.url).origin;

    if (body.sessionId) {
      const session = await touchSession(body.sessionId, ip);
      if (!session) {
        return NextResponse.json(
          { error: "session not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        sessionId: session.id,
        webhookUrl: `${webhookBase}/api/webhook/${session.id}`,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      });
    }

    const sessionId = uuidv4();
    const session = await createSession(sessionId, ip);
    return NextResponse.json({
      sessionId: session.id,
      webhookUrl: `${webhookBase}/api/webhook/${session.id}`,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (err) {
    console.error("session error", err);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
