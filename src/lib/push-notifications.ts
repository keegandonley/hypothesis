import { pool } from "./db";
import type { QueryResult } from "pg";
import { incrementStat } from "./stats";

export interface PushNotification {
  id: string;
  deviceId: string;
  title: string;
  body: string;
  subtitle: string | null;
  data: Record<string, unknown> | null;
  apnsId: string | null;
  success: boolean;
  sentAt: string;
}

export async function insertPushNotification(params: {
  deviceId: string;
  title: string;
  body: string;
  subtitle?: string | null;
  data?: object | null;
  // APNs-only, and deliberately so: the shipped iOS client reads `apnsId` off
  // /api/native/notifications and cannot be updated retroactively, so this
  // column's iOS behavior must not change. FCM sends leave it null.
  apnsId?: string | null;
  // Provider-neutral id: the APNs id on iOS, the FCM message name on Android.
  // Requires migration 005_android_push.sql (adds provider_message_id).
  providerMessageId?: string | null;
  success: boolean;
}): Promise<void> {
  await pool.query(
    "INSERT INTO push_notifications (device_id, title, body, subtitle, data, apns_id, provider_message_id, success) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
    [
      params.deviceId,
      params.title,
      params.body,
      params.subtitle ?? null,
      params.data !== undefined && params.data !== null
        ? JSON.stringify(params.data)
        : null,
      params.apnsId ?? null,
      params.providerMessageId ?? null,
      params.success,
    ],
  );
  await incrementStat("push_events_sent").catch((err: unknown) => {
    console.error("[stats] failed to increment push_events_sent", err);
  });
}

interface PushNotificationRow {
  id: string;
  device_id: string;
  title: string;
  body: string;
  subtitle: string | null;
  data: object | null;
  apns_id: string | null;
  success: boolean;
  sent_at: string;
}

export async function getPushNotifications(params: {
  deviceId: string;
  after?: string;
  limit: number;
}): Promise<PushNotification[]> {
  const result: QueryResult<PushNotificationRow> = params.after
    ? await pool.query(
        "SELECT id, device_id, title, body, subtitle, data, apns_id, success, sent_at FROM push_notifications WHERE device_id = $1 AND sent_at > $2 ORDER BY sent_at DESC LIMIT $3",
        [params.deviceId, params.after, params.limit],
      )
    : await pool.query(
        "SELECT id, device_id, title, body, subtitle, data, apns_id, success, sent_at FROM push_notifications WHERE device_id = $1 ORDER BY sent_at DESC LIMIT $2",
        [params.deviceId, params.limit],
      );

  return result.rows.map((row) => ({
    id: row.id,
    deviceId: row.device_id,
    title: row.title,
    body: row.body,
    subtitle: row.subtitle ?? null,
    data: (row.data as Record<string, unknown>) ?? null,
    apnsId: row.apns_id ?? null,
    success: row.success,
    sentAt: new Date(row.sent_at).toISOString(),
  }));
}
