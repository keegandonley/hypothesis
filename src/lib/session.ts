import { pool } from "./db";

export type Session = {
  id: string;
  ipAddress: string;
  createdAt: string;
  updatedAt: string;
};

export async function getSession(id: string): Promise<Session | null> {
  const result = await pool.query(
    "SELECT id, ip_address, created_at, updated_at FROM sessions WHERE id = $1",
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    ipAddress: row.ip_address,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function createSession(
  id: string,
  ipAddress: string
): Promise<Session> {
  await pool.query(
    "INSERT INTO sessions (id, ip_address) VALUES ($1, $2)",
    [id, ipAddress]
  );
  return (await getSession(id))!;
}

export async function countRecentSessionsByIp(ipAddress: string): Promise<number> {
  const result = await pool.query(
    "SELECT COUNT(*) FROM sessions WHERE ip_address = $1 AND created_at > NOW() - INTERVAL '10 minutes'",
    [ipAddress]
  );
  return parseInt(result.rows[0].count, 10);
}

export async function touchSession(
  id: string
): Promise<Session | null> {
  await pool.query(
    "UPDATE sessions SET updated_at = NOW() WHERE id = $1",
    [id]
  );
  return getSession(id);
}
