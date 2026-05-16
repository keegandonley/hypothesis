import { pool } from "./db";
import { incrementStat } from "./stats";

export type PushNotification = {
  id: string;
  deviceId: string;
  title: string;
  body: string;
  subtitle: string | null;
  data: Record<string, unknown> | null;
  apnsId: string | null;
  success: boolean;
  sentAt: string;
};

export async function insertPushNotification(params: {
  deviceId: string;
  title: string;
  body: string;
  subtitle?: string | null;
  data?: object | null;
  apnsId?: string | null;
  success: boolean;
}): Promise<void> {
  await pool.query(
    "INSERT INTO push_notifications (device_id, title, body, subtitle, data, apns_id, success) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [
      params.deviceId,
      params.title,
      params.body,
      params.subtitle ?? null,
      params.data !== undefined && params.data !== null ? JSON.stringify(params.data) : null,
      params.apnsId ?? null,
      params.success,
    ]
  );
  incrementStat("push_events_sent").catch(() => {});
}

export async function getPushNotifications(params: {
  deviceId: string;
  after?: string;
  limit: number;
}): Promise<PushNotification[]> {
  let result;
  if (params.after) {
    result = await pool.query(
      "SELECT id, device_id, title, body, subtitle, data, apns_id, success, sent_at FROM push_notifications WHERE device_id = $1 AND sent_at > $2 ORDER BY sent_at DESC LIMIT $3",
      [params.deviceId, params.after, params.limit]
    );
  } else {
    result = await pool.query(
      "SELECT id, device_id, title, body, subtitle, data, apns_id, success, sent_at FROM push_notifications WHERE device_id = $1 ORDER BY sent_at DESC LIMIT $2",
      [params.deviceId, params.limit]
    );
  }

  return result.rows.map((row) => ({
    id: row.id,
    deviceId: row.device_id,
    title: row.title,
    body: row.body,
    subtitle: row.subtitle ?? null,
    data: row.data ?? null,
    apnsId: row.apns_id ?? null,
    success: row.success,
    sentAt: new Date(row.sent_at).toISOString(),
  }));
}
