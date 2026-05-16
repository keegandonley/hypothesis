import { pool } from "./db";

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

