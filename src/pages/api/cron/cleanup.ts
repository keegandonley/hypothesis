import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const eventsResult = await client.query(
      "DELETE FROM webhook_events WHERE session_id IN (SELECT id FROM sessions WHERE updated_at < NOW() - INTERVAL '1 hour')"
    );
    const sessionsResult = await client.query(
      "DELETE FROM sessions WHERE updated_at < NOW() - INTERVAL '1 hour'"
    );

    await client.query("COMMIT");

    return res.json({
      sessionsDeleted: sessionsResult.rowCount,
      eventsDeleted: eventsResult.rowCount,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("cleanup error", err);
    return res.status(500).json({ error: "internal server error" });
  } finally {
    client.release();
  }
}
