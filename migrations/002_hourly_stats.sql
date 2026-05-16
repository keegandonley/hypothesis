CREATE TABLE hourly_stats (
  hour                    TIMESTAMPTZ PRIMARY KEY,
  devices_registered      INTEGER NOT NULL DEFAULT 0,
  webhook_sessions_web    INTEGER NOT NULL DEFAULT 0,
  webhook_events_web      INTEGER NOT NULL DEFAULT 0,
  webhook_events_native   INTEGER NOT NULL DEFAULT 0,
  push_events_sent        INTEGER NOT NULL DEFAULT 0
);
