import { getPushTokenByDeviceId } from "./push-tokens";

export async function sendWebhookPushNotification(
  deviceId: string,
  method: string,
  eventId: string,
): Promise<void> {
  const device = await getPushTokenByDeviceId(deviceId);
  if (!device) return;

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: device.token,
      title: "Webhook",
      body: `${method} request received`,
      data: { type: "webhook_event", method, eventId },
    }),
  });
}
