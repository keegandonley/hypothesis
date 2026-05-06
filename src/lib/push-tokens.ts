import { pool } from "./db";

export type PushToken = {
  id: string;
  deviceId: string;
  token: string;
  platform: string;
  sandbox: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function upsertPushToken(
  deviceId: string,
  token: string,
  platform: string,
  sandbox: boolean,
): Promise<void> {
  await pool.query(
    `INSERT INTO push_tokens (device_id, token, platform, sandbox)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (device_id)
     DO UPDATE SET token = EXCLUDED.token, platform = EXCLUDED.platform, sandbox = EXCLUDED.sandbox, updated_at = NOW()`,
    [deviceId, token, platform, sandbox],
  );
}

export async function getPushTokenByDeviceId(
  deviceId: string,
): Promise<PushToken | null> {
  const result = await pool.query(
    "SELECT id, device_id, token, platform, sandbox, created_at, updated_at FROM push_tokens WHERE device_id = $1",
    [deviceId],
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    id: row.id,
    deviceId: row.device_id,
    token: row.token,
    platform: row.platform,
    sandbox: row.sandbox,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}
