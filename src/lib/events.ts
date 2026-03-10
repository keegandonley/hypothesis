import { pool } from "./db";

export type WebhookEvent = {
  id: string;
  sessionId: string;
  method: string;
  headers: Record<string, string>;
  payload: unknown | null;
  rawBody: string | null;
  receivedAt: string;
};

export async function insertEvent(params: {
  id: string;
  sessionId: string;
  method: string;
  headers: Record<string, string>;
  payload: unknown | null;
  rawBody: string | null;
}): Promise<void> {
  await pool.query(
    "INSERT INTO webhook_events (id, session_id, method, headers, payload, raw_body) VALUES ($1, $2, $3, $4, $5, $6)",
    [
      params.id,
      params.sessionId,
      params.method,
      JSON.stringify(params.headers),
      params.payload !== null ? JSON.stringify(params.payload) : null,
      params.rawBody,
    ]
  );
}

export async function getEvents(params: {
  sessionId: string;
  after?: string;
  limit: number;
}): Promise<WebhookEvent[]> {
  let result;
  if (params.after) {
    result = await pool.query(
      "SELECT id, session_id, method, headers, payload, raw_body, received_at FROM webhook_events WHERE session_id = $1 AND received_at > $2 ORDER BY received_at DESC LIMIT $3",
      [params.sessionId, params.after, params.limit]
    );
  } else {
    result = await pool.query(
      "SELECT id, session_id, method, headers, payload, raw_body, received_at FROM webhook_events WHERE session_id = $1 ORDER BY received_at DESC LIMIT $2",
      [params.sessionId, params.limit]
    );
  }

  return result.rows.map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    method: row.method,
    headers: row.headers,
    payload: row.payload ?? null,
    rawBody: row.raw_body ?? null,
    receivedAt: new Date(row.received_at).toISOString(),
  }));
}
