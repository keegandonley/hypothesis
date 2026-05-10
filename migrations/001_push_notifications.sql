CREATE TABLE push_notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id  TEXT        NOT NULL REFERENCES push_tokens(device_id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  subtitle   TEXT,
  data       JSONB,
  apns_id    TEXT,
  success    BOOLEAN     NOT NULL,
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX push_notifications_device_id_sent_at_idx
  ON push_notifications (device_id, sent_at DESC);
