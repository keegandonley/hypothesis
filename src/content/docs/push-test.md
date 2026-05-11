# push test

Send a test push notification to a registered mobile device.

## Overview

Enter a device ID (stored in `localStorage` between sessions), compose a title and body, and optionally attach a JSON data payload. Hitting Send calls `/api/push/send` and reports the delivery status — useful for verifying that a device is registered and reachable without going through a full app flow.

## Getting started

1. Install the [hypothesis.sh app on the App Store](https://apps.apple.com/us/app/hypothesis-sh/id6764898246). (iOS only for now, Android coming in the near future)
2. Open the app and go to **Settings**.
3. Copy the **Device ID** shown there — it's a UUID that identifies your device for push delivery.
4. Paste it into the Device ID field and send a notification.

## Fields

| Field     | Required | Description                                                         |
| --------- | -------- | ------------------------------------------------------------------- |
| Device ID | yes      | UUID shown in the app under Settings, identifying the target device |
| Title     | yes      | Notification title displayed on the device                          |
| Body      | yes      | Notification body text                                              |
| Subtitle  | no       | Secondary line displayed beneath the title                          |
| Sound     | no       | Sound name to play; use `default` for the system sound              |
| Badge     | no       | Number to display on the app icon badge                             |
| Data      | no       | Arbitrary JSON object attached to the notification payload          |

## Result

On success, the APNs ID is shown. On failure, the error message from the push service is displayed.

The device ID is persisted in `localStorage` so you don't have to re-enter it between sessions. Clear the field and send once to remove it.

## Native integrations

Two webhook endpoints deliver push notifications directly from external services to your device. Both use the same device ID from the app's Settings screen.

### Vercel

Receive push notifications for Vercel deployment events.

**Webhook URL:**
```
https://hypothesis.sh/api/vercel-webhook/<device-id>
```

Add this URL in the Vercel dashboard under **Team Settings → Webhooks**. All event types are supported — deployments, promotions, project changes, and domain events.

### Xcode Cloud

Receive push notifications for Xcode Cloud build events.

**Webhook URL:**
```
https://hypothesis.sh/api/xcode-webhook/<device-id>
```

Add this URL in App Store Connect under your app's **Xcode Cloud → Settings → Webhooks**. Notifications are sent for build started, succeeded, failed, errored, and canceled events, and include the product name, branch, and build number.

## Security

Treat your device ID like a secret. Anyone who has it can send push notifications to your device. Don't share it publicly or include it in screenshots.
