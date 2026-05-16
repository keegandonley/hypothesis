import { pool } from "./db";
import type { PoolClient } from "pg";

type StatField =
  | "devices_registered"
  | "webhook_sessions_web"
  | "webhook_events_web"
  | "webhook_events_native"
  | "push_events_sent";

export async function incrementStat(field: StatField, by = 1): Promise<void> {
  await pool.query(
    `INSERT INTO hourly_stats (hour, ${field})
     VALUES (DATE_TRUNC('hour', NOW()), $1)
     ON CONFLICT (hour) DO UPDATE SET ${field} = hourly_stats.${field} + EXCLUDED.${field}`,
    [by],
  );
}

export async function snapshotDeviceTotal(): Promise<void> {
  await pool.query(
    `INSERT INTO hourly_stats (hour, devices_total)
     VALUES (DATE_TRUNC('hour', NOW()), (SELECT COUNT(*)::INTEGER FROM push_tokens))
     ON CONFLICT (hour) DO UPDATE SET devices_total = EXCLUDED.devices_total`,
  );
}

// Runs inside the cleanup cron's transaction. Aggregates web session/event counts
// by creation-hour and upserts them before the rows are deleted.
export async function flushWebhookStats(client: PoolClient): Promise<void> {
  await client.query(
    `INSERT INTO hourly_stats (hour, webhook_sessions_web, webhook_events_web)
     SELECT
       DATE_TRUNC('hour', s.created_at),
       COUNT(DISTINCT s.id)::INTEGER,
       COUNT(we.id)::INTEGER
     FROM sessions s
     LEFT JOIN webhook_events we ON we.session_id = s.id
     WHERE s.device_id IS NULL
       AND s.updated_at < NOW() - INTERVAL '1 hour'
     GROUP BY 1
     ON CONFLICT (hour) DO UPDATE SET
       webhook_sessions_web = hourly_stats.webhook_sessions_web + EXCLUDED.webhook_sessions_web,
       webhook_events_web   = hourly_stats.webhook_events_web   + EXCLUDED.webhook_events_web`,
  );
}
