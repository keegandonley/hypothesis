# screen capture

Capture the current browser tab as a PNG image and open it in a new tab.

## How it works

Click **capture this tab** to trigger the browser's screen-sharing prompt. Select the current tab when asked. The page uses the [Screen Capture API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API) (`getDisplayMedia`) internally via [`@keegancodes/capture-screen`](https://www.npmjs.com/package/@keegancodes/capture-screen), which grabs a single frame from the video stream and renders it to a canvas before returning a PNG blob.

The resulting image is opened directly in a new browser tab via a temporary object URL — nothing is uploaded or sent to a server.

## Browser support

Chrome and Edge fully support the `preferCurrentTab` hint, which pre-selects the current tab in the sharing dialog. Firefox and Safari will show the standard screen-picker without the hint.

## Notes

- The capture happens at the moment you confirm the sharing dialog, not at the moment you clicked the button.
- Closing the new tab releases the object URL automatically.
