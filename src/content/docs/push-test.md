# push test

Send a test push notification to a registered mobile device.

## Overview

Enter a device ID (stored in `localStorage` between sessions), compose a title and body, and optionally attach a JSON data payload. Hitting Send calls `/api/push/send` and reports the delivery status — useful for verifying that a device is registered and reachable without going through a full app flow.

## Fields

| Field | Required | Description |
|-------|----------|-------------|
| Device ID | yes | UUID identifying the target device, as registered via the push registration API |
| Title | yes | Notification title displayed on the device |
| Body | yes | Notification body text |
| Data | no | Arbitrary JSON object attached to the notification payload |

## Result

On success, the ticket ID is shown. On failure, the error message from the push service is displayed.

The device ID is persisted in `localStorage` so you don't have to re-enter it between sessions. Clear the field and send once to remove it.
