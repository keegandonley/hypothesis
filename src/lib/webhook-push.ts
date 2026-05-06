import { getPushTokenByDeviceId } from "./push-tokens";
import { sendApnsNotification } from "./apns";

export async function sendWebhookPushNotification(
  deviceId: string,
  method: string,
  eventId: string,
): Promise<void> {
  const device = await getPushTokenByDeviceId(deviceId);
  if (!device) return;

  await sendApnsNotification(device.token, "Webhook", `${method} request received`, {
    type: "webhook_event",
    method,
    eventId,
  }, undefined, device.sandbox);
}
