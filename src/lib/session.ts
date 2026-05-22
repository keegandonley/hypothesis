import { pool } from "./db";
import type { QueryResult } from "pg";

export interface Session {
  id: string;
  ipAddress: string;
  createdAt: string;
  updatedAt: string;
  deviceId?: string | null;
}

interface SessionRow {
  id: string;
  ip_address: string;
  created_at: string;
  updated_at: string;
  device_id: string | null;
}

export async function getSession(id: string): Promise<Session | null> {
  const result: QueryResult<SessionRow> = await pool.query(
    "SELECT id, ip_address, created_at, updated_at, device_id FROM sessions WHERE id = $1",
    [id],
  );
  const row = result.rows[0];

  if (!row) return null;

  return {
    id: row.id,
    ipAddress: row.ip_address,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    deviceId: row.device_id ?? null,
  };
}

export async function createSession(
  id: string,
  ipAddress: string,
): Promise<Session> {
  await pool.query("INSERT INTO sessions (id, ip_address) VALUES ($1, $2)", [
    id,
    ipAddress,
  ]);

  const session = await getSession(id);

  /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- just inserted */
  return session!;
}

export async function countRecentSessionsByIp(
  ipAddress: string,
): Promise<number> {
  const result: QueryResult<{ count: string }> = await pool.query(
    "SELECT COUNT(*) FROM sessions WHERE ip_address = $1 AND created_at > NOW() - INTERVAL '10 minutes'",
    [ipAddress],
  );

  return parseInt(result.rows[0].count, 10);
}

export async function touchSession(id: string): Promise<Session | null> {
  await pool.query("UPDATE sessions SET updated_at = NOW() WHERE id = $1", [
    id,
  ]);

  return getSession(id);
}

export async function getOrCreateNativeSession(
  deviceId: string,
): Promise<Session> {
  const existing: QueryResult<{ id: string }> = await pool.query(
    "SELECT id FROM sessions WHERE device_id = $1",
    [deviceId],
  );

  if (existing.rows[0]) {
    await touchSession(existing.rows[0].id);

    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- session exists since rows[0] matched */
    return (await getSession(existing.rows[0].id))!;
  }

  const id = crypto.randomUUID();

  await pool.query(
    "INSERT INTO sessions (id, ip_address, device_id) VALUES ($1, $2, $3)",
    [id, "::native", deviceId],
  );

  /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- just inserted */
  return (await getSession(id))!;
}

export async function isNativeSession(sessionId: string): Promise<boolean> {
  const result: QueryResult<{ device_id: string | null }> = await pool.query(
    "SELECT device_id FROM sessions WHERE id = $1",
    [sessionId],
  );

  return result.rows[0]?.device_id != null;
}
