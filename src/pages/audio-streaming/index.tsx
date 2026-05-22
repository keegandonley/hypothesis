import React, { useCallback, useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import Link from "next/link";
import styles from "../../styles/audio-streaming.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";
import { MEDIA_FILES } from "@/data/media-files";

interface Settings {
  src: string;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  controls: boolean;
  disableRemotePlayback: boolean;
  preload: "none" | "metadata" | "auto";
  crossorigin: "" | "anonymous" | "use-credentials";
  clNodownload: boolean;
  clNoremoteplayback: boolean;
  initialCurrentTime: number;
  playbackRate: number;
  defaultPlaybackRate: number;
  volume: number;
}

interface BarSegment {
  start: number;
  end: number;
}

interface AudioSnapshot {
  networkState: number;
  readyState: number;
  currentSrc: string;
  duration: number;
  currentTime: number;
  paused: boolean;
  ended: boolean;
  seeking: boolean;
  playbackRate: number;
  volume: number;
  muted: boolean;
  errorCode: number | null;
  errorMessage: string;
  buffered: BarSegment[];
  seekable: BarSegment[];
  played: BarSegment[];
}

interface LogEntry {
  id: number;
  ts: string;
  event: string;
  detail: string;
}

const LOG_CAP = 500;

const DEFAULTS: Settings = {
  src: "",
  autoplay: false,
  loop: false,
  muted: false,
  controls: true,
  disableRemotePlayback: false,
  preload: "auto",
  crossorigin: "",
  clNodownload: false,
  clNoremoteplayback: false,
  initialCurrentTime: 0,
  playbackRate: 1,
  defaultPlaybackRate: 1,
  volume: 1,
};

const AUDIO_EVENTS = [
  "loadstart",
  "durationchange",
  "loadedmetadata",
  "loadeddata",
  "progress",
  "canplay",
  "canplaythrough",
  "play",
  "playing",
  "pause",
  "ended",
  "seeking",
  "seeked",
  "timeupdate",
  "ratechange",
  "volumechange",
  "waiting",
  "stalled",
  "suspend",
  "abort",
  "emptied",
  "error",
] as const;

type AudioEventName = (typeof AUDIO_EVENTS)[number];

const NOISY_EVENTS = new Set<AudioEventName>(["timeupdate", "progress"]);

const NETWORK_STATE_LABELS: Record<number, string> = {
  0: "EMPTY (0)",
  1: "IDLE (1)",
  2: "LOADING (2)",
  3: "NO_SOURCE (3)",
};

const READY_STATE_LABELS: Record<number, string> = {
  0: "HAVE_NOTHING (0)",
  1: "HAVE_METADATA (1)",
  2: "HAVE_CURRENT_DATA (2)",
  3: "HAVE_FUTURE_DATA (3)",
  4: "HAVE_ENOUGH_DATA (4)",
};

const ERROR_CODES: Record<number, string> = {
  1: "MEDIA_ERR_ABORTED",
  2: "MEDIA_ERR_NETWORK",
  3: "MEDIA_ERR_DECODE",
  4: "MEDIA_ERR_SRC_NOT_SUPPORTED",
};

function extractRanges(r: TimeRanges): BarSegment[] {
  const segs: BarSegment[] = [];
  for (let i = 0; i < r.length; i++)
    segs.push({ start: r.start(i), end: r.end(i) });
  return segs;
}

function snapshotAudio(a: HTMLAudioElement): AudioSnapshot {
  return {
    networkState: a.networkState,
    readyState: a.readyState,
    currentSrc: a.currentSrc,
    duration: a.duration,
    currentTime: a.currentTime,
    paused: a.paused,
    ended: a.ended,
    seeking: a.seeking,
    playbackRate: a.playbackRate,
    volume: a.volume,
    muted: a.muted,
    errorCode: a.error?.code ?? null,
    errorMessage: a.error?.message ?? "",
    buffered: extractRanges(a.buffered),
    seekable: extractRanges(a.seekable),
    played: extractRanges(a.played),
  };
}

function settingsToParams(s: Settings): string {
  const p = new URLSearchParams();
  if (s.src) p.set("src", s.src);
  if (s.autoplay) p.set("autoplay", "1");
  if (s.loop) p.set("loop", "1");
  if (s.muted) p.set("muted", "1");
  if (!s.controls) p.set("controls", "0");
  if (s.disableRemotePlayback) p.set("noRemote", "1");
  if (s.preload !== DEFAULTS.preload) p.set("preload", s.preload);
  if (s.crossorigin) p.set("crossorigin", s.crossorigin);
  if (s.clNodownload) p.set("clND", "1");
  if (s.clNoremoteplayback) p.set("clNRP", "1");
  if (s.initialCurrentTime !== 0)
    p.set("startAt", String(s.initialCurrentTime));
  if (s.playbackRate !== 1) p.set("rate", String(s.playbackRate));
  if (s.defaultPlaybackRate !== 1)
    p.set("dRate", String(s.defaultPlaybackRate));
  if (s.volume !== 1) p.set("volume", String(s.volume));
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

function paramsToSettings(search: string): Settings {
  const p = new URLSearchParams(search);
  const bool = (key: string, def: boolean) =>
    p.has(key) ? p.get(key) !== "0" : def;
  const num = (key: string, def: number) =>
    p.has(key) ? parseFloat(p.get(key)!) || def : def;
  return {
    src: p.get("src") ?? "",
    autoplay: bool("autoplay", DEFAULTS.autoplay),
    loop: bool("loop", DEFAULTS.loop),
    muted: bool("muted", DEFAULTS.muted),
    controls: bool("controls", DEFAULTS.controls),
    disableRemotePlayback: p.get("noRemote") === "1",
    preload: (p.get("preload") as Settings["preload"]) ?? DEFAULTS.preload,
    crossorigin: (p.get("crossorigin") as Settings["crossorigin"]) ?? "",
    clNodownload: p.get("clND") === "1",
    clNoremoteplayback: p.get("clNRP") === "1",
    initialCurrentTime: num("startAt", 0),
    playbackRate: num("rate", 1),
    defaultPlaybackRate: num("dRate", 1),
    volume: num("volume", 1),
  };
}

function fmtNum(n: number): string {
  return Number.isFinite(n) ? n.toFixed(3) : String(n);
}

const SEG_CLASS: Record<string, string> = {
  buffered: styles.segBuffered,
  seekable: styles.segSeekable,
  played: styles.segPlayed,
};

function RangeBar({
  segments,
  duration,
  currentTime,
  variant,
}: {
  segments: BarSegment[];
  duration: number;
  currentTime: number;
  variant: "buffered" | "seekable" | "played";
}) {
  const valid = isFinite(duration) && duration > 0;
  const pct = valid
    ? Math.min(100, Math.max(0, (100 * currentTime) / duration))
    : 0;
  return (
    <div className={styles.bar}>
      {valid &&
        segments.map((seg, i) => (
          <div
            key={i}
            className={`${styles.seg} ${SEG_CLASS[variant]}`}
            style={{
              left: `${(100 * seg.start) / duration}%`,
              width: `${Math.max(0.5, (100 * (seg.end - seg.start)) / duration)}%`,
            }}
          />
        ))}
      <div className={styles.playhead} style={{ left: `${pct}%` }} />
    </div>
  );
}

function logEntryClass(event: string): string {
  if (event === "error") return styles.logError;
  if (["waiting", "stalled", "suspend"].includes(event)) return styles.logWarn;
  if (
    ["canplay", "canplaythrough", "loadeddata", "loadedmetadata"].includes(
      event,
    )
  )
    return styles.logGood;
  if (["play", "playing"].includes(event)) return styles.logAccent;
  return "";
}

export default function AudioStreamingPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();

  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [initialized, setInitialized] = useState(false);
  const settingsRef = useRef<Settings>(DEFAULTS);
  settingsRef.current = settings;

  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [snap, setSnap] = useState<AudioSnapshot | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [logQuiet, setLogQuiet] = useState(true);
  const [logAutoscroll, setLogAutoscroll] = useState(true);
  const logQuietRef = useRef(true);
  logQuietRef.current = logQuiet;
  const logAutoscrollRef = useRef(true);
  logAutoscrollRef.current = logAutoscroll;
  const logRef = useRef<HTMLDivElement>(null);
  const logEntryIdRef = useRef(0);
  const lastTimeUpdateRef = useRef(0);

  const [seekPct, setSeekPct] = useState(50);
  const [exportCopied, setExportCopied] = useState(false);

  useEffect(() => {
    setSettings(paramsToSettings(window.location.search));
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    history.replaceState(
      null,
      "",
      window.location.pathname + settingsToParams(settings),
    );
  }, [settings, initialized]);

  const addLog = useCallback((event: string, detail: string) => {
    if (logQuietRef.current && NOISY_EVENTS.has(event as AudioEventName)) {
      if (event === "timeupdate") {
        const now = performance.now();
        if (now - lastTimeUpdateRef.current < 500) return;
        lastTimeUpdateRef.current = now;
      } else {
        return;
      }
    }
    const t = new Date();
    const ts =
      t.toLocaleTimeString("en-US", { hour12: false }) +
      "." +
      String(t.getMilliseconds()).padStart(3, "0");
    const entry: LogEntry = { id: ++logEntryIdRef.current, ts, event, detail };
    setLogEntries((prev) => {
      const next = [...prev, entry];
      return next.length > LOG_CAP ? next.slice(next.length - LOG_CAP) : next;
    });
    if (logAutoscrollRef.current) {
      requestAnimationFrame(() => {
        if (logRef.current)
          logRef.current.scrollTop = logRef.current.scrollHeight;
      });
    }
  }, []);

  const buildAudio = useCallback(() => {
    const s = settingsRef.current;
    const container = containerRef.current;
    if (!container) return;

    const old = audioRef.current;
    if (old) {
      try {
        old.pause();
      } catch {}
      old.removeAttribute("src");
      try {
        old.load();
      } catch {}
      old.remove();
      audioRef.current = null;
    }
    setErrorMsg("");

    const a = document.createElement("audio");
    a.preload = s.preload;
    if (s.crossorigin) a.crossOrigin = s.crossorigin;
    else a.removeAttribute("crossorigin");
    a.autoplay = s.autoplay;
    a.loop = s.loop;
    a.muted = s.muted;
    a.defaultMuted = s.muted;
    a.controls = s.controls;
    if ("disableRemotePlayback" in a) {
      (
        a as HTMLAudioElement & { disableRemotePlayback: boolean }
      ).disableRemotePlayback = s.disableRemotePlayback;
    }
    const clTokens: string[] = [];
    if (s.clNodownload) clTokens.push("nodownload");
    if (s.clNoremoteplayback) clTokens.push("noremoteplayback");
    if (clTokens.length) a.setAttribute("controlslist", clTokens.join(" "));
    a.defaultPlaybackRate = s.defaultPlaybackRate || 1;
    a.playbackRate = s.playbackRate || 1;
    a.volume = Math.min(1, Math.max(0, s.volume));

    for (const ev of AUDIO_EVENTS) {
      a.addEventListener(ev, () => {
        let d = "";
        if (ev === "error") {
          const code = a.error?.code;
          d =
            code != null
              ? `code=${code} (${ERROR_CODES[code] ?? "?"}) ${a.error?.message ?? ""}`
              : "unknown error";
          setErrorMsg(`Media error: ${d}`);
        } else if (ev === "durationchange") {
          d = `duration=${a.duration}`;
        } else if (ev === "loadedmetadata") {
          d = `duration=${a.duration}`;
          const t0 = settingsRef.current.initialCurrentTime;
          if (t0 > 0 && isFinite(a.duration) && t0 < a.duration) {
            try {
              a.currentTime = t0;
            } catch {}
          }
        } else if (ev === "progress") {
          const ranges: string[] = [];
          for (let i = 0; i < a.buffered.length; i++)
            ranges.push(
              `${a.buffered.start(i).toFixed(2)}–${a.buffered.end(i).toFixed(2)}`,
            );
          d = `buffered=[${ranges.join(", ")}]`;
        } else if (ev === "ratechange") {
          d = `rate=${a.playbackRate}`;
        } else if (ev === "volumechange") {
          d = `vol=${a.volume.toFixed(2)} muted=${a.muted}`;
        } else if (ev === "seeking" || ev === "seeked") {
          d = `t=${a.currentTime.toFixed(3)}`;
        }
        addLog(ev, d);
        setSnap(snapshotAudio(a));
      });
    }

    if (s.src) a.src = s.src;
    container.appendChild(a);
    audioRef.current = a;
    setSnap(snapshotAudio(a));
  }, [addLog]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a || !initialized) return;
    a.loop = settings.loop;
    a.muted = settings.muted;
    a.controls = settings.controls;
    if ("disableRemotePlayback" in a) {
      (
        a as HTMLAudioElement & { disableRemotePlayback: boolean }
      ).disableRemotePlayback = settings.disableRemotePlayback;
    }
    a.playbackRate = settings.playbackRate || 1;
    a.defaultPlaybackRate = settings.defaultPlaybackRate || 1;
    a.volume = Math.min(1, Math.max(0, settings.volume));
    const cl = (a as HTMLAudioElement & { controlsList?: DOMTokenList })
      .controlsList;
    if (cl) {
      if (settings.clNodownload) cl.add("nodownload");
      else cl.remove("nodownload");
      if (settings.clNoremoteplayback) cl.add("noremoteplayback");
      else cl.remove("noremoteplayback");
    }
    setSnap(snapshotAudio(a));
  }, [
    settings.loop,
    settings.muted,
    settings.controls,
    settings.disableRemotePlayback,
    settings.playbackRate,
    settings.defaultPlaybackRate,
    settings.volume,
    settings.clNodownload,
    settings.clNoremoteplayback,
    initialized,
  ]);

  useEffect(() => {
    if (!initialized) return;
    const container = containerRef.current;
    if (!container) return;
    const a = document.createElement("audio");
    a.controls = settingsRef.current.controls;
    if (settingsRef.current.src) {
      buildAudio();
    } else {
      container.appendChild(a);
      audioRef.current = a;
      setSnap(snapshotAudio(a));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a) {
        try {
          a.pause();
        } catch {}
        a.removeAttribute("src");
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let rafId: number;
    function tick() {
      const a = audioRef.current;
      if (a && !a.paused && !a.ended) setSnap(snapshotAudio(a));
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handlePlay = useCallback(() => {
    audioRef.current
      ?.play()
      .catch((e: unknown) => addLog("play-rejected", String(e)));
  }, [addLog]);

  const handlePause = useCallback(() => {
    audioRef.current?.pause();
  }, []);
  const handleLoad = useCallback(() => {
    audioRef.current?.load();
  }, []);

  const handleStepBack = useCallback(() => {
    const a = audioRef.current;
    if (a) a.currentTime = Math.max(0, a.currentTime - 5);
  }, []);

  const handleStepFwd = useCallback(() => {
    const a = audioRef.current;
    if (a && isFinite(a.duration))
      a.currentTime = Math.min(a.duration, a.currentTime + 5);
  }, []);

  const handleSeek = useCallback(() => {
    const a = audioRef.current;
    if (!a || !isFinite(a.duration)) return;
    a.currentTime = (a.duration * Math.max(0, Math.min(100, seekPct))) / 100;
  }, [seekPct]);

  const handleExport = useCallback(async () => {
    await copyToClipboard(window.location.href);
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 1500);
  }, []);

  const handleReset = useCallback(() => {
    if (!confirm("Reset all settings?")) return;
    history.replaceState(null, "", window.location.pathname);
    setSettings(DEFAULTS);
  }, []);

  const upd = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const dur = snap?.duration ?? NaN;

  return (
    <div className={styles.page}>
      <ToolHead
        title="audio streaming"
        description="Test and inspect HTML audio element behavior — buffering, events, and playback state — with full telemetry."
        path="/audio-streaming"
        brandName={branding.name}
      />

      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
          <Link
            href="/"
            target={isIframe ? "_blank" : undefined}
            rel={isIframe ? "noopener noreferrer" : undefined}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            {branding.domain}
          </Link>
          {"·"}
          <Link
            href="/docs/audio-streaming"
            style={{
              color: "inherit",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.3em",
            }}
          >
            <DocIcon /> docs
          </Link>
        </div>
        <h1 className={styles.title}>audio streaming</h1>
        <p className={styles.tagline}>
          Test HTML audio element behavior — buffering, events, and playback
          state — with full telemetry.
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.grid}>
        {/* ── Settings panel ──────────────────────────────────────────── */}
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Settings</h2>

          <div className={styles.group}>
            <div className={styles.groupTitle}>
              <span>Source</span>
              <span className={`${styles.tag} ${styles.tagRebuild}`}>
                rebuild
              </span>
            </div>
            <label className={styles.blockLabel} htmlFor="as-preset">
              Example file
            </label>
            <select
              id="as-preset"
              className={styles.select}
              value={MEDIA_FILES.find((f) => f.url === settings.src)?.url ?? ""}
              onChange={(e) => {
                if (e.target.value) upd("src", e.target.value);
              }}
            >
              <option value="">— paste a custom URL below —</option>
              {MEDIA_FILES.filter((f) => f.type === "audio").map((f) => (
                <option key={f.filename} value={f.url}>
                  {f.filename} ({f.label})
                </option>
              ))}
            </select>
            <label
              className={styles.blockLabel}
              style={{ marginTop: 8 }}
              htmlFor="as-src"
            >
              Custom URL
            </label>
            <input
              id="as-src"
              type="url"
              className={styles.input}
              placeholder="https://example.com/audio.mp3"
              autoComplete="off"
              spellCheck={false}
              value={settings.src}
              onChange={(e) => upd("src", e.target.value)}
            />
            <div className={styles.btnRow} style={{ marginTop: 8 }}>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                onClick={buildAudio}
              >
                Load / Reload
              </button>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={buildAudio}
                title="Recreate the audio element with current attributes"
              >
                Rebuild
              </button>
            </div>
            <p className={styles.helpText}>
              Changing the URL, <code>preload</code>, or{" "}
              <code>crossorigin</code> requires a rebuild.
            </p>
          </div>

          <div className={styles.group}>
            <div className={styles.groupTitle}>
              <span>Boolean attributes</span>
              <span className={styles.tag}>live</span>
            </div>
            <div className={styles.grid2}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={settings.autoplay}
                  onChange={(e) => upd("autoplay", e.target.checked)}
                />
                autoplay{" "}
                <span
                  className={styles.warnText}
                  title="Most browsers require muted for autoplay"
                >
                  ⚠︎
                </span>
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={settings.loop}
                  onChange={(e) => upd("loop", e.target.checked)}
                />
                loop
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={settings.muted}
                  onChange={(e) => upd("muted", e.target.checked)}
                />
                muted
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={settings.controls}
                  onChange={(e) => upd("controls", e.target.checked)}
                />
                controls
              </label>
              <label className={`${styles.checkLabel} ${styles.fullSpan}`}>
                <input
                  type="checkbox"
                  checked={settings.disableRemotePlayback}
                  onChange={(e) =>
                    upd("disableRemotePlayback", e.target.checked)
                  }
                />
                disable remote playback
              </label>
            </div>
            <p className={styles.helpText}>
              <code>autoplay</code> only applies on rebuild.
            </p>
          </div>

          <div className={styles.group}>
            <div className={styles.groupTitle}>
              <span>Load behavior</span>
              <span className={`${styles.tag} ${styles.tagRebuild}`}>
                rebuild
              </span>
            </div>
            <label className={styles.blockLabel} htmlFor="as-preload">
              preload
            </label>
            <select
              id="as-preload"
              className={styles.select}
              value={settings.preload}
              onChange={(e) =>
                upd("preload", e.target.value as Settings["preload"])
              }
            >
              <option value="none">none</option>
              <option value="metadata">metadata</option>
              <option value="auto">auto</option>
            </select>
            <label
              className={styles.blockLabel}
              style={{ marginTop: 8 }}
              htmlFor="as-crossorigin"
            >
              crossorigin
            </label>
            <select
              id="as-crossorigin"
              className={styles.select}
              value={settings.crossorigin}
              onChange={(e) =>
                upd("crossorigin", e.target.value as Settings["crossorigin"])
              }
            >
              <option value="">(unset)</option>
              <option value="anonymous">anonymous</option>
              <option value="use-credentials">use-credentials</option>
            </select>
          </div>

          <div className={styles.group}>
            <div className={styles.groupTitle}>
              <span>controlsList</span>
              <span className={styles.tag}>live</span>
            </div>
            <div className={styles.grid2}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={settings.clNodownload}
                  onChange={(e) => upd("clNodownload", e.target.checked)}
                />
                nodownload
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={settings.clNoremoteplayback}
                  onChange={(e) => upd("clNoremoteplayback", e.target.checked)}
                />
                noremoteplayback
              </label>
            </div>
          </div>

          <div className={styles.group}>
            <div className={styles.groupTitle}>
              <span>Playback</span>
              <span className={styles.tag}>live</span>
            </div>
            <div className={styles.grid2}>
              <div>
                <label className={styles.blockLabel} htmlFor="as-ict">
                  initial currentTime (s)
                </label>
                <input
                  id="as-ict"
                  type="number"
                  className={styles.input}
                  min={0}
                  step={0.1}
                  value={settings.initialCurrentTime}
                  onChange={(e) =>
                    upd("initialCurrentTime", parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <label className={styles.blockLabel} htmlFor="as-rate">
                  playbackRate
                </label>
                <input
                  id="as-rate"
                  type="number"
                  className={styles.input}
                  min={0.25}
                  max={4}
                  step={0.25}
                  value={settings.playbackRate}
                  onChange={(e) =>
                    upd("playbackRate", parseFloat(e.target.value) || 1)
                  }
                />
              </div>
              <div>
                <label className={styles.blockLabel} htmlFor="as-defaultRate">
                  defaultPlaybackRate
                </label>
                <input
                  id="as-defaultRate"
                  type="number"
                  className={styles.input}
                  min={0.25}
                  max={4}
                  step={0.25}
                  value={settings.defaultPlaybackRate}
                  onChange={(e) =>
                    upd("defaultPlaybackRate", parseFloat(e.target.value) || 1)
                  }
                />
              </div>
              <div>
                <label className={styles.blockLabel} htmlFor="as-volume">
                  volume{" "}
                  <span className={styles.mutedInline}>
                    {settings.volume.toFixed(2)}
                  </span>
                </label>
                <input
                  id="as-volume"
                  type="range"
                  className={styles.rangeInput}
                  min={0}
                  max={1}
                  step={0.01}
                  value={settings.volume}
                  onChange={(e) => upd("volume", parseFloat(e.target.value))}
                />
              </div>
            </div>
            <p className={styles.helpText}>
              Initial <code>currentTime</code> is applied after{" "}
              <code>loadedmetadata</code>.
            </p>
          </div>

          <div className={styles.btnRow}>
            <button
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={handleReset}
            >
              Reset settings
            </button>
            {!isIframe && (
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={handleExport}
              >
                {exportCopied ? "Copied!" : "Copy URL"}
              </button>
            )}
          </div>
        </section>

        {/* ── Player panel ────────────────────────────────────────────── */}
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Player</h2>

          {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}

          <div className={styles.audioWrap} ref={containerRef} />

          <div className={styles.ranges}>
            {(["buffered", "seekable", "played"] as const).map((variant) => (
              <div key={variant} className={styles.rangeRow}>
                <span className={styles.barLabel}>{variant}</span>
                <RangeBar
                  segments={snap?.[variant] ?? []}
                  duration={dur}
                  currentTime={snap?.currentTime ?? 0}
                  variant={variant}
                />
              </div>
            ))}
          </div>

          <div
            className={styles.btnRow}
            style={{ marginTop: 10, flexWrap: "wrap" }}
          >
            <button className={styles.btn} onClick={handlePlay}>
              Play
            </button>
            <button className={styles.btn} onClick={handlePause}>
              Pause
            </button>
            <button
              className={styles.btn}
              onClick={handleLoad}
              title="Calls audio.load()"
            >
              audio.load()
            </button>
            <button
              className={styles.btn}
              onClick={handleStepBack}
              title="Step back 5 seconds"
            >
              −5s
            </button>
            <button
              className={styles.btn}
              onClick={handleStepFwd}
              title="Step forward 5 seconds"
            >
              +5s
            </button>
            <label className={styles.seekLabel}>
              seek %
              <input
                type="number"
                className={styles.input}
                style={{ width: 60 }}
                min={0}
                max={100}
                step={1}
                value={seekPct}
                onChange={(e) => setSeekPct(Number(e.target.value))}
              />
            </label>
            <button className={styles.btn} onClick={handleSeek}>
              Seek
            </button>
          </div>
        </section>

        {/* ── Telemetry panel ─────────────────────────────────────────── */}
        <section className={`${styles.panel} ${styles.telemetryPanel}`}>
          <h2 className={styles.panelTitle}>State</h2>

          <div className={styles.kv}>
            <span className={styles.kvKey}>networkState</span>
            <span className={styles.kvVal}>
              {snap
                ? (NETWORK_STATE_LABELS[snap.networkState] ??
                  String(snap.networkState))
                : "–"}
            </span>

            <span className={styles.kvKey}>readyState</span>
            <span className={styles.kvVal}>
              {snap
                ? (READY_STATE_LABELS[snap.readyState] ??
                  String(snap.readyState))
                : "–"}
            </span>

            <span className={styles.kvKey}>currentSrc</span>
            <span className={styles.kvVal}>{snap?.currentSrc || "(none)"}</span>

            <span className={styles.kvKey}>duration</span>
            <span className={styles.kvVal}>
              {snap ? fmtNum(snap.duration) : "–"}
            </span>

            <span className={styles.kvKey}>currentTime</span>
            <span className={styles.kvVal}>
              {snap ? fmtNum(snap.currentTime) : "–"}
            </span>

            <span className={styles.kvKey}>paused</span>
            <span
              className={`${styles.kvVal} ${snap ? (snap.paused ? styles.colorWarn : styles.colorGood) : ""}`}
            >
              {snap ? String(snap.paused) : "–"}
            </span>

            <span className={styles.kvKey}>ended</span>
            <span className={styles.kvVal}>
              {snap ? String(snap.ended) : "–"}
            </span>

            <span className={styles.kvKey}>seeking</span>
            <span className={styles.kvVal}>
              {snap ? String(snap.seeking) : "–"}
            </span>

            <span className={styles.kvKey}>playbackRate</span>
            <span className={styles.kvVal}>
              {snap ? snap.playbackRate : "–"}
            </span>

            <span className={styles.kvKey}>volume</span>
            <span className={styles.kvVal}>
              {snap ? snap.volume.toFixed(2) : "–"}
            </span>

            <span className={styles.kvKey}>muted</span>
            <span className={styles.kvVal}>
              {snap ? String(snap.muted) : "–"}
            </span>

            <span className={styles.kvKey}>error</span>
            <span
              className={`${styles.kvVal} ${snap?.errorCode != null ? styles.colorBad : ""}`}
            >
              {snap?.errorCode != null
                ? `${snap.errorCode} ${ERROR_CODES[snap.errorCode] ?? ""} ${snap.errorMessage}`.trim()
                : "–"}
            </span>
          </div>

          <div className={styles.logHeader}>
            <h2 className={styles.panelTitle} style={{ margin: 0 }}>
              Event log
            </h2>
            <div className={styles.logControls}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={logQuiet}
                  onChange={(e) => setLogQuiet(e.target.checked)}
                />
                quiet
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={logAutoscroll}
                  onChange={(e) => setLogAutoscroll(e.target.checked)}
                />
                autoscroll
              </label>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                style={{ padding: "2px 6px" }}
                onClick={() => setLogEntries([])}
              >
                clear
              </button>
            </div>
          </div>

          <div className={styles.log} ref={logRef} aria-live="polite">
            {logEntries.map((entry) => (
              <div
                key={entry.id}
                className={`${styles.logEntry} ${logEntryClass(entry.event)}`}
              >
                <span className={styles.logTs}>{entry.ts}</span>
                <span className={styles.logEvent}>{entry.event}</span>
                <span className={styles.logDetail}>{entry.detail}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
