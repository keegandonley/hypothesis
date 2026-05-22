import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).end();

    return;
  }

  const authHeader = req.headers.authorization;

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: "unauthorized" });

    return;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const eventsResult = await client.query(
      "DELETE FROM webhook_events WHERE session_id IN (SELECT id FROM sessions WHERE updated_at < NOW() - INTERVAL '1 hour' AND device_id IS NULL)",
    );
    const sessionsResult = await client.query(
      "DELETE FROM sessions WHERE updated_at < NOW() - INTERVAL '1 hour' AND device_id IS NULL",
    );

    await client.query("COMMIT");

    res.json({
      sessionsDeleted: sessionsResult.rowCount,
      eventsDeleted: eventsResult.rowCount,
    });

    return;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("cleanup error", err);

    res.status(500).json({ error: "internal server error" });

    return;
  } finally {
    client.release();
  }
}
