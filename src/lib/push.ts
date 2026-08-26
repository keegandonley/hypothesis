import { sendApnsNotification, type ApnsOptions } from "./apns";
import { sendFcmNotification } from "./fcm";

export type PushOptions = ApnsOptions;

export interface PushResult {
  ok: boolean;
  // Provider-neutral id: the APNs id on iOS, the FCM message name on Android.
  messageId?: string;
  // Preserved for iOS. The shipped client and push_notifications.apns_id both
  // read this, so the APNs path keeps populating it exactly as before; the FCM
  // path leaves it unset and reports through messageId instead.
  apnsId?: string;
  statusCode: number;
  error?: string;
}

// Send to whichever push service the device registered with. `platform` is the
// value stored on the push_tokens row, which the app sets from
// expo-notifications' DevicePushToken.type — "ios" or "android".
//
// Anything that isn't "android" routes to APNs: rows predating Android support
// carry assorted platform strings, and the empty string that
// registerDeviceWithoutToken writes. Those rows all have a NULL token and every
// caller already guards on that, but defaulting to APNs keeps the iOS fleet's
// behavior unchanged regardless.
//
// `sandbox` is an APNs-only concept. The client sends it for both platforms, so
// it is accepted here and simply not forwarded to FCM.
export async function sendPushNotification(
  platform: string,
  deviceToken: string,
  title: string,
  body: string,
  data?: object,
  options?: PushOptions,
  sandbox?: boolean | null,
): Promise<PushResult> {
  if (platform.trim().toLowerCase() === "android") {
    const result = await sendFcmNotification(
      deviceToken,
      title,
      body,
      data,
      options,
    );

    return {
      ok: result.ok,
      messageId: result.messageId,
      statusCode: result.statusCode,
      error: result.error,
    };
  }

  // Normalizing null to undefined preserves apns.ts's own default
  // (APNS_PRODUCTION !== "true"): a JS default parameter fires on undefined but
  // NOT on null, and null would fall through to host(null) and silently pick
  // the production host.
  const result = await sendApnsNotification(
    deviceToken,
    title,
    body,
    data,
    options,
    sandbox ?? undefined,
  );

  return { ...result, messageId: result.apnsId };
}
