import { createSign } from "node:crypto";

const TOKEN_HOST = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const FCM_HOST = "https://fcm.googleapis.com";

interface FcmConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

// Three discrete env vars rather than a service-account JSON blob, matching the
// APNS_* convention. A JSON.parse of the blob would, on malformed input, quote
// the text *near the fault* — i.e. the private key — straight into function
// logs via the SyntaxError message.
//
// All-or-nothing: with none of the three set, Android push is simply off and
// the APNs path is untouched, so this ships safely before a Firebase project
// exists. A partial config is a typo rather than an intentional state, so it
// warns (variable NAMES only, never values) and still stays off — throwing here
// would surface as a 500 on the webhook paths, and a 500 makes the sender
// redeliver, duplicating notifications.
function fcmConfig(): FcmConfig | null {
  const projectId = process.env.FCM_PROJECT_ID;
  const clientEmail = process.env.FCM_CLIENT_EMAIL;
  const privateKey = process.env.FCM_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      projectId,
      clientEmail,
      // Vercel keeps the PEM's newlines escaped, exactly like APNS_KEY_P8.
      privateKey: privateKey.replace(/\\n/g, "\n"),
    };
  }

  const missing = [
    !projectId && "FCM_PROJECT_ID",
    !clientEmail && "FCM_CLIENT_EMAIL",
    !privateKey && "FCM_PRIVATE_KEY",
  ].filter((name): name is string => typeof name === "string");

  if (missing.length < 3) {
    console.warn(
      "[fcm] partially configured — Android push is off. Missing:",
      missing.join(", "),
    );
  }

  return null;
}

export function isFcmConfigured(): boolean {
  return fcmConfig() !== null;
}

// Google's OAuth2 assertion, hand-rolled the same way apns.ts hand-rolls the
// APNs ES256 token. Google service accounts sign RS256 (PKCS#1 v1.5), so this
// uses the default padding rather than APNs' ieee-p1363 encoding.
function generateJwt(config: FcmConfig): string {
  const now = Math.floor(Date.now() / 1000);

  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: config.clientEmail,
      scope: SCOPE,
      aud: TOKEN_HOST,
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");
  const signingInput = `${header}.${payload}`;

  const sign = createSign("RSA-SHA256");

  sign.update(signingInput);
  sign.end();
  const signature = sign.sign(config.privateKey, "base64url");

  return `${signingInput}.${signature}`;
}

// Access tokens live ~1 hour. Minting one per request costs an extra round trip
// to Google on every push, so we cache at module scope: on Vercel that survives
// for the life of a warm function instance and is simply cold on a fresh one.
// The cache is therefore an optimization only — nothing here depends on it
// persisting, and a miss just mints a new token.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(config: FcmConfig): Promise<string> {
  // 60s of slack so a token can't expire in flight.
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const res = await fetch(TOKEN_HOST, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: generateJwt(config),
    }).toString(),
  });

  // CREDENTIAL HYGIENE: Google's OAuth2 error response quotes the JWT assertion
  // back at us, and that assertion is signed with the service-account key. The
  // status is the only part of a failed mint that may be recorded. Never
  // interpolate the response body here — it reaches callers' console.error and,
  // via lib/mcp/tools.ts, the text returned to an MCP tool caller.
  if (!res.ok) {
    throw new Error(`FCM token exchange failed with status ${res.status}`);
  }

  // The SUCCESS body is just as sensitive: it contains the access token, and a
  // JSON.parse SyntaxError quotes the input near the fault. Swallow it.
  let parsed: { access_token?: string; expires_in?: number };

  try {
    parsed = JSON.parse(await res.text()) as typeof parsed;
  } catch {
    throw new Error("FCM token exchange returned a malformed response body");
  }

  if (!parsed.access_token) {
    throw new Error("FCM token exchange returned no access_token");
  }

  cachedToken = {
    value: parsed.access_token,
    expiresAt: Date.now() + (parsed.expires_in ?? 3600) * 1000,
  };

  return parsed.access_token;
}

export interface FcmResult {
  ok: boolean;
  messageId?: string;
  statusCode: number;
  error?: string;
}

export interface FcmOptions {
  subtitle?: string;
  sound?: string | null;
  badge?: number;
}

interface FcmErrorBody {
  error?: {
    status?: string;
    details?: { errorCode?: string }[];
  };
}

// FCM surfaces the actionable reason (UNREGISTERED, SENDER_ID_MISMATCH,
// INVALID_ARGUMENT…) in error.details[].errorCode. That is the closest analogue
// to the APNs `reason` string the apns.ts path returns, so prefer it and fall
// back to error.status. error.message and the raw body are deliberately NOT
// surfaced: they are free-form text that can echo parts of the request.
function errorReason(body: string, statusCode: number): string {
  try {
    const parsed = JSON.parse(body) as FcmErrorBody;
    const detail = parsed.error?.details?.find((d) => d.errorCode)?.errorCode;

    return detail ?? parsed.error?.status ?? `FCM error ${statusCode}`;
  } catch {
    return `FCM error ${statusCode}`;
  }
}

// Keys expo-notifications reads for presentation (NotificationData.kt),
// channel routing (FirebaseNotificationTrigger.kt) and notification identity
// (FirebaseMessagingDelegate.getNotificationIdentifier). Caller data must never
// clobber these when it is mirrored into the flat FCM data map.
const RESERVED_DATA_KEYS = new Set([
  "title",
  "message",
  "body",
  "subtitle",
  "sound",
  "badge",
  "vibrate",
  "sticky",
  "color",
  "autoDismiss",
  "categoryId",
  "channelId",
  "tag",
]);

// The FCM data map is Record<string, string>, so mirror the caller's payload as
// flat string entries: scalars stringified, nested values JSON-encoded. FCM
// rejects the whole message if any data value is a non-string, not just the
// offending key.
function flatten(
  payload: Record<string, string>,
  data: Record<string, unknown>,
): void {
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (RESERVED_DATA_KEYS.has(key)) continue;

    if (typeof value === "string") {
      payload[key] = value;
      continue;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      payload[key] = String(value);
      continue;
    }

    // Objects and arrays go in JSON-encoded; anything unserializable
    // (functions, symbols) is dropped rather than stringified to junk.
    const encoded = JSON.stringify(value);

    if (encoded !== undefined) payload[key] = encoded;
  }
}

export async function sendFcmNotification(
  deviceToken: string,
  title: string,
  body: string,
  data?: object,
  options?: FcmOptions,
): Promise<FcmResult> {
  const config = fcmConfig();

  if (!config) {
    return { ok: false, statusCode: 0, error: "fcm_not_configured" };
  }

  // Data-only message: no `notification` block, and deliberately no
  // `android.notification` either — setting either one gives the RemoteMessage
  // a notification payload, at which point Firebase renders the notification
  // itself whenever the app is backgrounded and never calls
  // expo-notifications' onMessageReceived. The app's channel/icon config would
  // be skipped and the tap response would arrive without its data. Data-only
  // routes every message through expo in both foreground and background,
  // matching the iOS path.
  //
  // Key names follow Expo's Android push payload spec (NotificationData.kt in
  // expo-notifications): `title`/`message` are the displayed text, and `body`
  // is a JSON *string* that expo parses and hands to JS as
  // `notification.request.content.data` (see mapNotificationResponse.ts, which
  // does `mappedContent.data = JSON.parse(dataString)`). That is the exact
  // position the iOS payload lands in, so the client's first-priority read of
  // `content.data.type` behaves identically on both platforms.
  const payload: Record<string, string> = {
    title,
    message: body,
    body: JSON.stringify(data ?? {}),
    // FirebaseNotificationTrigger.getNotificationChannel() falls back to
    // data["channelId"], so we can target the app's "default" channel without
    // an android.notification block. Omitting it would route to expo's
    // FALLBACK_CHANNEL_ID and silently ignore the app's channel config.
    channelId: "default",
  };

  // Mirrored flat so the client's third-priority read,
  // trigger.remoteMessage.data, also carries `type` and friends as plain
  // strings. `body` stays valid JSON, so expo takes the dataString branch and
  // these flat keys never leak into content.data.
  if (data) flatten(payload, data as Record<string, unknown>);

  if (options?.subtitle) payload.subtitle = options.subtitle;
  // Expo plays the channel's default sound when `sound` is absent, which
  // matches the APNs default of aps.sound = "default". A named sound passes
  // through; `sound: null` (silence) has no representation in the Android spec.
  if (options?.sound) payload.sound = options.sound;
  if (options?.badge !== undefined) payload.badge = String(options.badge);

  const message = {
    message: {
      token: deviceToken,
      data: payload,
      android: {
        // "HIGH" is the REST enum's declared name. Some Firebase docs samples
        // show lowercase "high" instead; if the first live send comes back
        // INVALID_ARGUMENT, this is the first thing to check. Left as-is rather
        // than changed speculatively.
        priority: "HIGH",
        // FCM's default TTL is four weeks, which would announce a build that
        // started last month. These are all "something just happened" alerts.
        ttl: "3600s",
      },
    },
  };

  console.log("[fcm] sending notification", {
    deviceToken: `${deviceToken.slice(0, 8)}…`,
    payload,
  });

  const accessToken = await getAccessToken(config);

  const res = await fetch(
    `${FCM_HOST}/v1/projects/${config.projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(message),
    },
  );

  const responseBody = await res.text();

  if (res.status === 200) {
    let messageId: string | undefined;

    try {
      messageId = (JSON.parse(responseBody) as { name?: string }).name;
    } catch {
      messageId = undefined;
    }

    return { ok: true, messageId, statusCode: res.status };
  }

  // NOTE: nothing here prunes the stored token, mirroring apns.ts, which does
  // not prune on 410 Unregistered / BadDeviceToken either. If pruning is added
  // later: 404/UNREGISTERED may prune, but 403 SENDER_ID_MISMATCH must NEVER
  // prune — it means this server holds the wrong project's credential, not that
  // the device is gone, so pruning on it turns one bad env var into fleet-wide
  // data loss on the first fan-out. 400 INVALID_ARGUMENT, 401 and 429 also
  // never prune.
  return {
    ok: false,
    statusCode: res.status,
    error: errorReason(responseBody, res.status),
  };
}
