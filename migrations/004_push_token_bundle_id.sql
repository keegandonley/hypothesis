-- Per-device APNs topic: devices registered by apps other than the original
-- native app (e.g. the Hypothesis Proxy approval app) carry their own bundle
-- id so the relay can address them. NULL keeps the legacy behavior of using
-- the APNS_BUNDLE_ID env var for every send.
ALTER TABLE push_tokens ADD COLUMN bundle_id TEXT;
