-- Android (FCM) push support.
--
-- WARNING: push_tokens has no CREATE TABLE migration in this directory — the
-- table was created directly in the live database, so its real column types
-- and constraints are not in version control. Run `\d push_tokens` and
-- `\d push_notifications` BEFORE applying this file and confirm the
-- assumptions below. Every statement here is written to be re-runnable.

-- 1. Widen push_tokens.token. APNs device tokens are 64 hex characters; FCM
--    registration tokens run roughly 160-200 characters and are not hex, so a
--    VARCHAR(64) column rejects every Android registration on insert. This is
--    the highest-risk item in the file — if the column is already TEXT the
--    block below is a no-op.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'push_tokens'
      AND column_name = 'token'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE push_tokens ALTER COLUMN token TYPE TEXT;
  END IF;
END $$;

-- 2. Backfill platform. registerDeviceWithoutToken (src/lib/push-tokens.ts)
--    inserts platform = '' for devices that denied notification permission, so
--    production carries empty-string rows that mean "unknown", not "ios".
UPDATE push_tokens
SET platform = 'unknown'
WHERE platform IS NULL OR btrim(platform) = '';

-- 3. Constrain platform to the values the senders understand, including
--    'android'. '' stays permitted on purpose: the insert in
--    registerDeviceWithoutToken still writes it, and this constraint must not
--    break that endpoint the moment it is applied. Drop '' from the list once
--    that insert writes 'unknown' instead.
--
--    NOTE: if `\d push_tokens` shows a pre-existing CHECK on platform under a
--    DIFFERENT name, drop it by hand — this only replaces the name below.
ALTER TABLE push_tokens DROP CONSTRAINT IF EXISTS push_tokens_platform_check;
ALTER TABLE push_tokens
  ADD CONSTRAINT push_tokens_platform_check
  CHECK (platform IN ('ios', 'android', 'unknown', ''));

-- 4. sandbox and bundle_id are APNs-only concepts (APNs environment and APNs
--    topic). Android rows carry neither, so both must be nullable. Dropping a
--    NOT NULL that is not there is a no-op.
ALTER TABLE push_tokens ALTER COLUMN sandbox DROP NOT NULL;
ALTER TABLE push_tokens ALTER COLUMN bundle_id DROP NOT NULL;

-- 5. Provider-neutral message id on push_notifications. apns_id is KEPT and
--    must keep being populated for iOS sends: the shipped iOS client reads the
--    `apnsId` field off /api/native/notifications and cannot be updated
--    retroactively. FCM sends populate provider_message_id only.
ALTER TABLE push_notifications ADD COLUMN IF NOT EXISTS provider_message_id TEXT;

UPDATE push_notifications
SET provider_message_id = apns_id
WHERE provider_message_id IS NULL AND apns_id IS NOT NULL;
