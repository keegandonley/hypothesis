import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import styles from "@/styles/reference.module.css";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";
import { MEDIA_FILES } from "@/data/media-files";

const BADGE_STYLES: Record<string, { color: string; subtle: string; border: string }> = {
  standard: { color: "#60a5fa", subtle: "#60a5fa18", border: "#60a5fa33" },
  "fast-start": { color: "#34d399", subtle: "#34d39918", border: "#34d39933" },
  "ogg vorbis": { color: "#c084fc", subtle: "#c084fc18", border: "#c084fc33" },
  mp3: { color: "#fb923c", subtle: "#fb923c18", border: "#fb923c33" },
  wav: { color: "#f472b6", subtle: "#f472b618", border: "#f472b633" },
};

const DESCRIPTIONS: Record<string, string> = {
  "bbb-short.mp4": "Short clip of the standard file. Useful for quick tests where the full-length file is too long.",
  "bbb-short-fast.mp4": "Short clip with the moov atom at the front. Fast-start variant of the short file.",
  "bbb.mp4": "Standard H.264/AAC MP4 with the moov atom at the end of the file. The browser must download to the end of the file before it can read metadata and begin playback.",
  "bbb-fast.mp4": "Fast-start MP4 with the moov atom relocated to the front of the file. The browser can begin buffering and playing immediately without waiting for the full file to download.",
  "livery-stable-blues.ogg": "Ogg Vorbis audio file. For testing HTML audio element behavior and streaming.",
  "bull-frog-blues.mp3": "MP3 audio file. For testing HTML audio element behavior with the MP3 format.",
  "bull-frog-blues.wav": "Uncompressed WAV audio file. Larger than compressed formats; useful for testing raw PCM playback and audio element behavior.",
};

export default function MediaFilesPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  function handleCopy(url: string) {
    copyToClipboard(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1500);
  }

  const description =
    "Example MP4 video files for testing HTML video behavior: a standard file and a fast-start variant with the moov atom at the front for immediate buffering.";

  return (
    <div className={styles.page}>
      <Head>
        <title>{branding.name.toUpperCase()} — MEDIA FILES</title>
        <meta name="description" content={description} />
        <meta property="og:title" content="Media Files" />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <link
          rel="canonical"
          href={`https://${branding.domain}/references/media-files`}
        />
      </Head>

      <div className={styles.inner}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.backLink}>
            <span>←</span> {branding.name}
          </Link>
          <span className={styles.refBadge}>reference</span>
        </nav>

        <hr className={styles.divider} />

        <div className={styles.header}>
          <h1 className={styles.title}>Media Files</h1>
          <p className={styles.tagline}>
            Example media files hosted at{" "}
            <code>example.hypothesis.donley.xyz</code> for testing HTML video
            and audio element behavior, buffering, and fast-start optimizations.
          </p>
        </div>

        <div className={styles.content}>
          <p className={styles.codeDesc} style={{ marginBottom: 24, lineHeight: 1.7 }}>
            A <strong>fast-start</strong> MP4 has its <code>moov</code> atom
            moved to the front of the file so browsers can begin playback before
            the full file downloads. A standard MP4 places the moov atom at the
            end, requiring a full download first.{" "}
            <Link href="/video-streaming">
              Test these files in the video streaming experiment →
            </Link>
          </p>

          <div className={styles.codeList}>
            {MEDIA_FILES.map((file) => {
              const badge = BADGE_STYLES[file.label];
              return (
                <div key={file.filename} className={styles.codeRowFull}>
                  <div className={styles.codeInfo}>
                    <div className={styles.flagRow}>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: badge.color,
                          background: badge.subtle,
                          border: `1px solid ${badge.border}`,
                          borderRadius: 3,
                          padding: "1px 6px",
                          lineHeight: 1.6,
                        }}
                      >
                        {file.label}
                      </span>
                      <span className={styles.codeNameMono}>{file.filename}</span>
                    </div>

                    <span className={styles.codeDesc}>
                      {DESCRIPTIONS[file.filename]}
                    </span>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 6,
                      }}
                    >
                      <code className={styles.codeDesc} style={{ opacity: 0.7 }}>
                        {file.url}
                      </code>
                      {!isIframe && (
                        <button
                          onClick={() => handleCopy(file.url)}
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 10,
                            color: copiedUrl === file.url ? "#34d399" : "var(--muted)",
                            background: "transparent",
                            border: "1px solid var(--border)",
                            borderRadius: 3,
                            padding: "2px 7px",
                            cursor: "pointer",
                            letterSpacing: "0.05em",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                          aria-label={`Copy ${file.url}`}
                        >
                          {copiedUrl === file.url ? "Copied!" : "Copy"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
