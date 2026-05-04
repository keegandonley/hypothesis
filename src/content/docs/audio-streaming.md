# audio streaming

Test and inspect HTML `<audio>` element behavior with full telemetry — buffering, events, readyState, and playback state — all in the browser.

## Settings

### rebuild vs live

Settings are tagged **rebuild** or **live**:

- **rebuild** — changing these requires clicking "Load / Reload" or "Rebuild" to take effect. They are applied when the `<audio>` element is created. Includes: `src`, `preload`, `crossorigin`, `autoplay`.
- **live** — applied immediately to the existing `<audio>` element without a rebuild. Includes: `loop`, `muted`, `controls`, `disableRemotePlayback`, `playbackRate`, `volume`, `controlsList`.

## Player controls

| Control | Description |
|---|---|
| Play / Pause | `audio.play()` / `audio.pause()` |
| audio.load() | Forces a reload of the media resource |
| −5s / +5s | Step backward/forward five seconds |
| seek % | Jump to a percentage of the total duration |

## Range bars

Three bars visualize the browser's time ranges for the current audio:

- **buffered** — portions of the media that have been downloaded
- **seekable** — portions the browser will allow seeking to
- **played** — portions that have already been played

The vertical line shows `currentTime`.

## Event log

All standard `HTMLMediaElement` events are captured. Use **quiet** mode to suppress noisy `timeupdate` and `progress` events (throttled to one every 500 ms). Toggle **autoscroll** to follow new events automatically.
