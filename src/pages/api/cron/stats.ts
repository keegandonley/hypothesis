import type { NextApiRequest, NextApiResponse } from "next";
import { snapshotWebhookStats, snapshotDeviceTotal } from "@/lib/stats";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    await Promise.all([snapshotWebhookStats(), snapshotDeviceTotal()]);
    return res.json({ ok: true });
  } catch (err) {
    console.error("stats cron error", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
