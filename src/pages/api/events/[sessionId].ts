import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getEvents } from "@/lib/events";

export const config = { runtime: "edge" };

export default async function handler(req: NextRequest) {
  if (req.method !== "GET") {
    return NextResponse.json({ error: "method not allowed" }, { status: 405 });
  }

  const url = new URL(req.url);
  const sessionId = url.pathname.split("/").pop()!;
  const afterParam = url.searchParams.get("after");
  const limitParam = url.searchParams.get("limit");

  if (afterParam) {
    const ts = Date.parse(afterParam);
    if (isNaN(ts)) {
      return NextResponse.json(
        { error: "invalid 'after' parameter — expected ISO 8601 date" },
        { status: 400 }
      );
    }
  }

  const limit = Math.min(parseInt(limitParam ?? "50", 10) || 50, 200);

  try {
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "session not found" }, { status: 404 });
    }

    const events = await getEvents({
      sessionId: session.id,
      after: afterParam ?? undefined,
      limit,
    });

    return NextResponse.json({ events, count: events.length });
  } catch (err) {
    console.error("events error", err);
    return NextResponse.json({ error: "internal server error" }, { status: 500 });
  }
}
