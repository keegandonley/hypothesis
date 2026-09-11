import { useEffect, useRef, useState } from "react";
import styles from "@/styles/photo-demo.module.css";
import { Badge, Button, PageLayout, PermalinkRow } from "@/components/ui";
import {
  buildTiles,
  GRID_COLS,
  GRID_ROWS,
  summarize,
  tileBox,
  tileDetail,
  tileSrc,
} from "@/lib/photo-demo";
import { useUrlSync } from "@/lib/useUrlSync";

/**
 * A full-bleed wall of everything the photo service serves.
 *
 * The tiling lives in `@/lib/photo-demo`: a gapless subdivision of a fixed
 * cell canvas, so tiles are placed explicitly here and the grid runs at
 * `gap: 0` with no holes to hide.
 *
 * Sizes are measured, not assumed. Both track lists are one whole-pixel cell
 * wide, so a tile's box is exactly `span × cell` and that is precisely what
 * it asks the service for — a `label` pattern prints its own real dimensions,
 * and nothing arrives scaled to fit. The cost is that the cell is only known
 * after layout, so the wall renders once the grid has been measured.
 */

const TILES = buildTiles();
const SUMMARY = summarize(TILES);

/** Cell rows above the fold on a typical viewport; the rest defer. */
const EAGER_ROWS = 4;

/**
 * Trailing debounce on re-measurement. A dragged window resize crosses a cell
 * boundary every `GRID_COLS` pixels, and each crossing re-requests the whole
 * wall at the new size.
 */
const RESIZE_DEBOUNCE_MS = 200;

interface Metrics {
  /** Rendered cell size in whole CSS pixels. */
  cell: number;
  pixelRatio: number;
}

function buildPageUrl(labels: boolean): string {
  const base = `${window.location.origin}${window.location.pathname}`;

  return labels ? `${base}?labels=1` : base;
}

export default function PhotoDemoPage(): React.ReactNode {
  const { replaceUrlNow } = useUrlSync();
  const [labels, setLabels] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Restore from the query string after hydration. The server cannot see the
  // client's URL, so reading it during render would mismatch.
  useEffect(() => {
    const restored =
      new URLSearchParams(window.location.search).get("labels") === "1";

    setLabels(restored); // eslint-disable-line react-hooks/set-state-in-effect
    const initialUrl = buildPageUrl(restored);

    replaceUrlNow(initialUrl);
    setPageUrl(initialUrl);
  }, [replaceUrlNow]);

  // Measure the cell from the element that owns the width. `ceil` means the
  // wall always more than fills its frame, which clips a few pixels off the
  // last column rather than leaving a strip of background down the edge.
  useEffect(() => {
    const frame = frameRef.current;

    if (frame === null) return;

    let timer: number | null = null;
    let measured = false;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;

      if (width <= 0) return;

      const next: Metrics = {
        cell: Math.max(1, Math.ceil(width / GRID_COLS)),
        pixelRatio: window.devicePixelRatio,
      };

      if (!measured) {
        // Don't make the first paint wait out the debounce.
        measured = true;
        setMetrics(next);

        return;
      }

      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        setMetrics(next);
      }, RESIZE_DEBOUNCE_MS);
    });

    observer.observe(frame);

    return () => {
      if (timer !== null) window.clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // `devicePixelRatio` changes with no change in CSS width when a window is
  // dragged between displays of different density, so the ResizeObserver above
  // never fires for it and the ratio would stay stale until an unrelated
  // resize happened to cross a cell boundary. Watching the current ratio as a
  // media query catches it directly; the query has to be rebuilt at the new
  // ratio each time, since it only reports when the value leaves where it was.
  useEffect(() => {
    let query: MediaQueryList | null = null;

    function handleChange(): void {
      setMetrics((previous) =>
        previous === null
          ? previous
          : { ...previous, pixelRatio: window.devicePixelRatio },
      );
      subscribe();
    }

    function subscribe(): void {
      query?.removeEventListener("change", handleChange);
      query = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      query.addEventListener("change", handleChange);
    }

    subscribe();

    return () => {
      query?.removeEventListener("change", handleChange);
    };
  }, []);

  const update = (next: boolean): void => {
    setLabels(next);
    const newUrl = buildPageUrl(next);

    replaceUrlNow(newUrl);
    setPageUrl(newUrl);
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Photo Grid Demo"
        metaDescription={`A full-bleed wall of ${SUMMARY.total} placeholder images — every source and format the photo service serves, each one pinned by seed or catalog id and requested at exactly the size it is drawn.`}
        path="/photo/demo"
        docsPath="/photo"
        h1="Photo grid demo"
        tagline="One edge-to-edge wall of every shape the placeholder service serves — photos and procedural patterns, jpg, webp and svg, each requested at exactly the size it renders."
        badge={<Badge>{SUMMARY.total} images</Badge>}
      >
        <div className={styles.toolbar}>
          <Button
            variant="toggle"
            active={labels}
            onClick={() => {
              update(!labels);
            }}
          >
            show sizes
          </Button>
          <span className={styles.hint}>
            every URL is pinned by seed or id and asks for the exact pixel box
            it fills — hover a tile for its source, or open it in a new tab
          </span>
          <span className={styles.counts}>
            {SUMMARY.photo} photo · {SUMMARY.gen} procedural · {SUMMARY.shapes}{" "}
            shapes
            {metrics !== null && ` · ${metrics.cell}px cell`}
          </span>
        </div>

        <PermalinkRow
          url={pageUrl}
          onReset={() => {
            update(false);
          }}
        />

        <div className={styles.bleed} ref={frameRef}>
          {metrics !== null && (
            <div
              className={styles.grid}
              data-labels={labels}
              style={
                {
                  "--cols": String(GRID_COLS),
                  "--rows": String(GRID_ROWS),
                  // Strings with units: a bare number here would be invalid in
                  // `repeat()`, and a numeric inline custom property can also
                  // pick up a `px` suffix of React's choosing.
                  "--cell": `${metrics.cell}px`,
                } as React.CSSProperties
              }
            >
              {TILES.map((tile) => {
                const box = tileBox(tile, metrics.cell);
                const src = tileSrc(tile, metrics.cell, metrics.pixelRatio);

                return (
                  <a
                    key={`${tile.x}-${tile.y}`}
                    className={styles.tile}
                    // A link, not a div: it makes every tile reachable by
                    // keyboard, gives the chip text a job as the accessible
                    // name, and opening the raw image is the thing you
                    // actually want from a placeholder wall.
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    // The expanded chip overflows its tile to the right, and
                    // the frame clips at the wall's edge — so the last column
                    // grows its chip leftward instead.
                    data-edge={
                      tile.x + tile.cols >= GRID_COLS ? "right" : undefined
                    }
                    style={{
                      gridColumn: `${tile.x + 1} / span ${tile.cols}`,
                      gridRow: `${tile.y + 1} / span ${tile.rows}`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      className={styles.img}
                      src={src}
                      // The link's own text names it; an alt here would only
                      // repeat that to a screen reader.
                      alt=""
                      width={box.w}
                      height={box.h}
                      loading={tile.y < EAGER_ROWS ? "eager" : "lazy"}
                      fetchPriority={tile.y < EAGER_ROWS ? "auto" : "low"}
                      decoding="async"
                    />
                    <span className={styles.label}>
                      <span className={styles.size}>
                        {box.w}×{box.h}
                      </span>
                      <span className={styles.detail}>
                        {" · "}
                        {tileDetail(tile, metrics.cell, metrics.pixelRatio)}
                      </span>
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </PageLayout>
    </div>
  );
}
