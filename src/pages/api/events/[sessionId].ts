import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "@/lib/session";
import { getEvents } from "@/lib/events";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).json({ error: "method not allowed" });

    return;
  }

  const {
    sessionId,
    after: afterParam,
    limit: limitParam,
  } = req.query as {
    sessionId: string;
    after?: string;
    limit?: string;
  };

  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!UUID_RE.test(sessionId)) {
    res.status(404).json({ error: "session not found" });

    return;
  }

  if (afterParam) {
    const ts = Date.parse(afterParam);

    if (isNaN(ts)) {
      res
        .status(400)
        .json({ error: "invalid 'after' parameter — expected ISO 8601 date" });

      return;
    }
  }

  const limit = Math.min(parseInt(limitParam ?? "50", 10) || 50, 200);

  try {
    const session = await getSession(sessionId);

    if (!session) {
      res.status(404).json({ error: "session not found" });

      return;
    }

    const events = await getEvents({
      sessionId: session.id,
      after: afterParam,
      limit,
    });

    res.json({ events, count: events.length });

    return;
  } catch (err) {
    console.error("events error", err);

    res.status(500).json({ error: "internal server error" });

    return;
  }
}
