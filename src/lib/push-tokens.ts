import { pbkdf2, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

import { pool } from "./db";

const pbkdf2Async = promisify(pbkdf2);

export type PushToken = {
  id: string;
  deviceId: string;
  token: string | null;
  platform: string;
  sandbox: boolean;
  createdAt: string;
  updatedAt: string;
};

async function hashSecret(secret: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await pbkdf2Async(secret, salt, 310_000, 32, "sha256");

  return `${salt}:${derived.toString("hex")}`;
}

async function verifySecret(secret: string, stored: string): Promise<boolean> {
  const [salt, hex] = stored.split(":");

  if (!salt || !hex) {
    return false;
  }

  const derived = await pbkdf2Async(secret, salt, 310_000, 32, "sha256");
  const storedBuf = Buffer.from(hex, "hex");

  if (derived.length !== storedBuf.length) return false;
  return timingSafeEqual(derived, storedBuf);
}

export async function verifyDeviceSecret(
  deviceId: string,
  incomingSecret?: string | null,
): Promise<boolean> {
  const result = await pool.query<{ secret: string | null }>(
    "SELECT secret FROM push_tokens WHERE device_id = $1",
    [deviceId],
  );

  const row = result.rows[0];

  if (!row?.secret) {
    // Legacy device — no secret set yet, allow through
    return true;
  }

  if (!incomingSecret) {
    // Device is secured but caller provided no secret
    return false;
  }

  return verifySecret(incomingSecret, row.secret);
}

export async function upsertPushToken(
  deviceId: string,
  token: string,
  platform: string,
  sandbox: boolean,
  deviceSecret?: string,
): Promise<void> {
  if (!deviceSecret) {
    // No secret provided — legacy client. Allow the upsert unconditionally
    // but only if no secret is set yet (preserves security once a device is secured).
    await pool.query(
      `INSERT INTO push_tokens (device_id, token, platform, sandbox)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (device_id)
       DO UPDATE SET
         token = EXCLUDED.token,
         platform = EXCLUDED.platform,
         sandbox = EXCLUDED.sandbox,
         updated_at = NOW()
       WHERE push_tokens.secret IS NULL`,
      [deviceId, token, platform, sandbox],
    );

    return;
  }

  // Check if there is an existing row with a secret already set.
  const existing = await pool.query<{ secret: string | null }>(
    "SELECT secret FROM push_tokens WHERE device_id = $1",
    [deviceId],
  );

  const row = existing.rows[0];

  if (row?.secret) {
    // Row exists and is secured — verify the incoming secret before allowing update.
    const ok = await verifySecret(deviceSecret, row.secret);

    if (!ok) {
      throw new Error("secret_mismatch");
    }

    await pool.query(
      `UPDATE push_tokens
       SET token = $2, platform = $3, sandbox = $4, updated_at = NOW()
       WHERE device_id = $1`,
      [deviceId, token, platform, sandbox],
    );
  } else {
    // New device or legacy row without a secret — insert or migrate by hashing the secret now.
    const hashed = await hashSecret(deviceSecret);

    await pool.query(
      `INSERT INTO push_tokens (device_id, token, platform, sandbox, secret)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (device_id)
       DO UPDATE SET
         token = EXCLUDED.token,
         platform = EXCLUDED.platform,
         sandbox = EXCLUDED.sandbox,
         secret = EXCLUDED.secret,
         updated_at = NOW()`,
      [deviceId, token, platform, sandbox, hashed],
    );
  }
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
    token: row.token ?? null,
    platform: row.platform,
    sandbox: row.sandbox,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

// Register a device that denied push notification permissions — no token yet.
// If the device is already registered this is a no-op. When the user later
// grants permissions the normal register endpoint will upsert the real token.
export async function registerDeviceWithoutToken(
  deviceId: string,
  deviceSecret?: string | null,
): Promise<void> {
  const existing = await pool.query(
    "SELECT device_id FROM push_tokens WHERE device_id = $1",
    [deviceId],
  );
  if (existing.rows.length > 0) return;

  const hashed = deviceSecret ? await hashSecret(deviceSecret) : null;
  await pool.query(
    `INSERT INTO push_tokens (device_id, token, platform, sandbox, secret)
     VALUES ($1, NULL, '', false, $2)
     ON CONFLICT (device_id) DO NOTHING`,
    [deviceId, hashed],
  );
}
