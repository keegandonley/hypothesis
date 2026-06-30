import React, { useEffect, useState } from "react";
import type { GetServerSideProps } from "next";
import styles from "@/styles/delay-loading.module.css";
import { Badge, Button, PageLayout, PermalinkRow } from "@/components/ui";

const MAX_DELAY_MS = 60000;
const DEFAULT_DELAY_MS = 3000;

function clampDelay(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_DELAY_MS;

  return Math.min(Math.max(Math.round(value), 0), MAX_DELAY_MS);
}

interface DelayLoadingProps {
  delayMs: number;
}

export const getServerSideProps: GetServerSideProps<DelayLoadingProps> = (
  context,
) => {
  const raw = context.query.delay;
  const parsed = typeof raw === "string" ? parseInt(raw, 10) : NaN;
  const delayMs = Number.isFinite(parsed)
    ? clampDelay(parsed)
    : DEFAULT_DELAY_MS;

  return Promise.resolve({ props: { delayMs } });
};

export default function DelayLoadingPage({
  delayMs,
}: DelayLoadingProps): React.ReactNode {
  const [loaded, setLoaded] = useState(false);
  const [loadedAfterMs, setLoadedAfterMs] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(delayMs);
  const [draft, setDraft] = useState(String(delayMs));
  const [url, setUrl] = useState("");

  // Register the service worker that delays the pixel client-side. On the very
  // first visit the worker isn't controlling this document yet, so the SSR
  // `/api/delay` request falls back to the (rarely hit) server route; the
  // worker then intercepts every later navigation entirely in the browser — no
  // serverless sleep. The one-time reload below is a backstop for browsers
  // where `clients.claim()` hasn't taken control by the time the worker is
  // ready (in Chromium, claim sets `controller` first, so the reload is
  // skipped and control simply applies from the next navigation).
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (navigator.serviceWorker.controller) {
      sessionStorage.removeItem("delaySwReloaded");

      return;
    }

    let cancelled = false;

    navigator.serviceWorker
      .register("/delay-sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then(() => {
        if (cancelled || navigator.serviceWorker.controller) return;
        if (sessionStorage.getItem("delaySwReloaded") === "1") return;

        sessionStorage.setItem("delaySwReloaded", "1");
        window.location.reload();
      })
      .catch(() => {
        // Service worker unavailable — the /api/delay fallback still works.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const start = performance.now();

    const permalink = `${window.location.origin}${window.location.pathname}?delay=${delayMs}`;

    setUrl(permalink); // eslint-disable-line react-hooks/set-state-in-effect
    history.replaceState(
      null,
      "",
      `${window.location.pathname}?delay=${delayMs}`,
    );

    const markLoaded = (): void => {
      const elapsed = Math.round(performance.now() - start);

      setLoaded(true);
      setLoadedAfterMs(elapsed);
      setRemainingMs(0);
      // Surface an explicit relayed event for the iframe-proxy debug panel.
      window.parent.postMessage({ event: "delay-loaded", delayMs }, "*");
    };

    if (document.readyState === "complete") {
      markLoaded();

      return;
    }

    window.addEventListener("load", markLoaded);

    const interval = window.setInterval(() => {
      setRemainingMs(
        Math.max(delayMs - Math.round(performance.now() - start), 0),
      );
    }, 100);

    return () => {
      window.removeEventListener("load", markLoaded);
      window.clearInterval(interval);
    };
  }, [delayMs]);

  const handleApply = (): void => {
    const next = clampDelay(parseInt(draft, 10));

    // The delay only takes effect on a fresh document load, so navigate fully
    // rather than soft-replacing the URL — this re-runs getServerSideProps and
    // re-injects the delaying image.
    window.location.assign(`${window.location.pathname}?delay=${next}`);
  };

  const handleReset = (): void => {
    window.location.assign(window.location.pathname);
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Delay Loading"
        metaDescription="Defer the page load event by a configurable number of milliseconds. A slow-loading target page for testing iframe load handling."
        path="/delay-loading"
        h1="delay loading"
        tagline="Defer the page load event by a configurable number of milliseconds."
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/delay?ms=${delayMs}`}
          alt=""
          aria-hidden
          style={{ display: "none" }}
        />

        <div className={styles.body}>
          <div className={styles.controlRow}>
            <label className={styles.label} htmlFor="delay-input">
              delay (ms)
            </label>
            <input
              id="delay-input"
              className={styles.input}
              type="number"
              min={0}
              max={MAX_DELAY_MS}
              step={100}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApply();
              }}
              spellCheck={false}
            />
            <Button variant="toggle" onClick={handleApply}>
              Apply &amp; reload
            </Button>
            <span className={styles.hint}>max {MAX_DELAY_MS} ms</span>
          </div>

          <div className={styles.status}>
            {loaded ? (
              <>
                <Badge>loaded</Badge>
                <span className={styles.statusText}>
                  load event fired after {loadedAfterMs} ms
                </span>
              </>
            ) : (
              <>
                <Badge color="error">loading</Badge>
                <span className={styles.statusText}>
                  deferring load &mdash; {(remainingMs / 1000).toFixed(1)}s left
                </span>
              </>
            )}
          </div>

          <p className={styles.note}>
            A hidden image requests{" "}
            <code className={styles.code}>/api/delay</code>, which a service
            worker holds open client-side for the configured time. The
            browser&rsquo;s <code className={styles.code}>load</code> event
            &mdash; and any parent iframe&rsquo;s{" "}
            <code className={styles.code}>onload</code> &mdash; wait for it to
            settle. No serverless function stays open during the delay.
          </p>
        </div>

        <hr className={styles.divider} />

        <PermalinkRow url={url} onReset={handleReset} />
      </PageLayout>
    </div>
  );
}
