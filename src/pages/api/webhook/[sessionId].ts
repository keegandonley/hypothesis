import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getSession } from "@/lib/session";
import { insertEvent } from "@/lib/events";

export const config = { runtime: "edge" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

export default async function handler(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const { pathname } = new URL(req.url);
  const sessionId = pathname.split("/").pop()!;

  try {
    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "session not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const headersObj: Record<string, string> = {};
    req.headers.forEach((v, k) => {
      headersObj[k] = v;
    });

    let payload: unknown = null;
    let rawBody: string | null = null;

    const contentType = req.headers.get("content-type") ?? "";
    const bodyText = await req.text();

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

    const eventId = uuidv4();
    await insertEvent({
      id: eventId,
      sessionId: session.id,
      method: req.method,
      headers: headersObj,
      payload,
      rawBody,
    });

    return NextResponse.json(
      { ok: true, eventId },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("webhook error", err);
    return NextResponse.json(
      { error: "internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
