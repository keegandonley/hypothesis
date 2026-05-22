import { getPushTokenByDeviceId } from "./push-tokens";
import { sendApnsNotification } from "./apns";
import { insertPushNotification } from "./push-notifications";

export async function sendWebhookPushNotification(
  deviceId: string,
  method: string,
  eventId: string,
): Promise<void> {
  const device = await getPushTokenByDeviceId(deviceId);

  if (!device?.token) return;

  const title = "Webhook";
  const body = `${method} request received`;
  const data = { type: "webhook_event", method, eventId };

  const result = await sendApnsNotification(
    device.token,
    title,
    body,
    data,
    undefined,
    device.sandbox,
  );

  await insertPushNotification({
    deviceId,
    title,
    body,
    data,
    apnsId: result.apnsId ?? null,
    success: result.ok,
  }).catch((err: unknown) => {
    console.error("[webhook-push] failed to record notification", err);
  });
}
