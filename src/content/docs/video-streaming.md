# video streaming

Test and inspect HTML `<video>` element behavior with full telemetry — buffering, events, readyState, and playback state — all in the browser.

## Settings

All settings are persisted to `localStorage` and restored on reload. The video URL is also synced to the URL query parameter `src` for shareability.

### rebuild vs live

Settings are tagged **rebuild** or **live**:

- **rebuild** — changing these requires clicking "Load / Reload" or "Rebuild" to take effect. They are applied when the `<video>` element is created. Includes: `src`, `preload`, `crossorigin`, `autoplay`, `playsinline`.
- **live** — applied immediately to the existing `<video>` element without a rebuild. Includes: `loop`, `muted`, `controls`, `poster`, `disablePictureInPicture`, `playbackRate`, `volume`, `controlsList`.

## Player controls

| Control      | Description                                |
| ------------ | ------------------------------------------ |
| Play / Pause | `video.play()` / `video.pause()`           |
| video.load() | Forces a reload of the media resource      |
| −1f / +1f    | Step backward/forward one frame (~1/30s)   |
| seek %       | Jump to a percentage of the total duration |

## Range bars

Three bars visualize the browser's time ranges for the current video:

- **buffered** — portions of the media that have been downloaded
- **seekable** — portions the browser will allow seeking to
- **played** — portions that have already been played

The vertical line shows `currentTime`.

## Event log

All standard `HTMLMediaElement` events are captured. Use **quiet** mode to suppress noisy `timeupdate` and `progress` events (throttled to one every 500 ms). Toggle **autoscroll** to follow new events automatically.
