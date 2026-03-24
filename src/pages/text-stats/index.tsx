import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/text-stats.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

interface TextStats {
  characters: { total: number; withoutSpaces: number };
  words: number;
  lines: number;
  sentences: number;
  paragraphs: number;
  readingTime: { minutes: number; seconds: number };
  speakingTime: { minutes: number; seconds: number };
  avgWordLength: number;
  longestWord: string;
  wordFrequency: Array<{ word: string; count: number }>;
  charFrequency: Array<{ char: string; count: number }>;
}

const DEFAULT_WPM = 250;
const SPEAKING_WPM = 150;

function analyzeText(text: string, wpm: number): TextStats {
  if (!text) {
    return {
      characters: { total: 0, withoutSpaces: 0 },
      words: 0,
      lines: 0,
      sentences: 0,
      paragraphs: 0,
      readingTime: { minutes: 0, seconds: 0 },
      speakingTime: { minutes: 0, seconds: 0 },
      avgWordLength: 0,
      longestWord: "",
      wordFrequency: [],
      charFrequency: [],
    };
  }

  const total = text.length;
  const withoutSpaces = text.replace(/\s/g, "").length;

  // Words: split by whitespace and filter empty
  const wordsArray = text.split(/\s+/).filter((w) => w.length > 0);
  const words = wordsArray.length;

  // Lines: split by newline
  const lines = text.split("\n").length;

  // Sentences: split by . ! ?
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;

  // Paragraphs: split by double newline or more
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;

  // Reading time (default 250 WPM for reading)
  const readingMinutes = words / wpm;
  const readingMins = Math.floor(readingMinutes);
  const readingSecs = Math.round((readingMinutes - readingMins) * 60);

  // Speaking time (150 WPM for speaking)
  const speakingMinutes = words / SPEAKING_WPM;
  const speakingMins = Math.floor(speakingMinutes);
  const speakingSecs = Math.round((speakingMinutes - speakingMins) * 60);

  // Average word length
  const totalWordLength = wordsArray.reduce((sum, word) => sum + word.length, 0);
  const avgWordLength = words > 0 ? totalWordLength / words : 0;

  // Longest word (strip punctuation before comparing)
  const longestWord = wordsArray
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter((w) => w.length > 0)
    .reduce((longest, word) => (word.length > longest.length ? word : longest), "");

  // Word frequency (top 20, case-insensitive, alphabetic only)
  const wordMap = new Map<string, number>();
  wordsArray.forEach((word) => {
    const clean = word.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (clean.length > 0) {
      wordMap.set(clean, (wordMap.get(clean) || 0) + 1);
    }
  });
  const wordFrequency = Array.from(wordMap.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Character frequency (excluding spaces, top 20)
  const charMap = new Map<string, number>();
  for (const char of text) {
    if (char !== " " && char !== "\n" && char !== "\t") {
      charMap.set(char, (charMap.get(char) || 0) + 1);
    }
  }
  const charFrequency = Array.from(charMap.entries())
    .map(([char, count]) => ({ char, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return {
    characters: { total, withoutSpaces },
    words,
    lines,
    sentences,
    paragraphs,
    readingTime: { minutes: readingMins, seconds: readingSecs },
    speakingTime: { minutes: speakingMins, seconds: speakingSecs },
    avgWordLength,
    longestWord,
    wordFrequency,
    charFrequency,
  };
}

export default function TextStatsPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [text, setText] = useState("");
  const [wpm, setWpm] = useState(DEFAULT_WPM);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stats = analyzeText(text, wpm);

  const buildUrl = (txt: string, wordsPerMin: number) => {
    if (!txt) return `${window.location.origin}${window.location.pathname}`;
    const encoded = btoa(encodeURIComponent(txt));
    const params = new URLSearchParams({ v: encoded });
    if (wordsPerMin !== DEFAULT_WPM) params.set("wpm", wordsPerMin.toString());
    return `${window.location.origin}${window.location.pathname}?${params}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("v");
    const wpmParam = params.get("wpm");

    if (encoded) {
      try {
        const decoded = decodeURIComponent(atob(encoded));
        setText(decoded);
      } catch {
        // Invalid encoding, ignore
      }
    }

    if (wpmParam) {
      const parsedWpm = parseInt(wpmParam, 10);
      if (parsedWpm > 0 && parsedWpm < 1000) setWpm(parsedWpm);
    }

    setUrl(window.location.href);
  }, []);

  const handleTextChange = (value: string) => {
    setText(value);
    const newUrl = buildUrl(value, wpm);
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleWpmChange = (value: number) => {
    setWpm(value);
    const newUrl = buildUrl(text, value);
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleCopy = () => {
    copyToClipboard(url).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleReset = () => {
    setText("");
    setWpm(DEFAULT_WPM);
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — TEXT STATS`}</title>
        <meta name="description" content="Analyze text statistics: character count, word count, reading time, word frequency." />
        <meta property="og:title" content="Text Statistics & Character Counter" />
        <meta property="og:description" content="Analyze text statistics: character count, word count, reading time, word frequency." />
        <meta property="og:url" content="https://hypothesis.sh/text-stats" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Text Statistics & Character Counter" />
        <meta name="twitter:description" content="Analyze text statistics: character count, word count, reading time, word frequency." />
        <link rel="canonical" href="https://hypothesis.sh/text-stats" />
      </Head>
      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
          <Link href="/" target={isIframe ? "_blank" : undefined} rel={isIframe ? "noopener noreferrer" : undefined} className={styles.domainLink}>
            {branding.domain}
          </Link>
          {"·"}
          <Link
            href="/docs/text-stats"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Text Stats</h1>
        <p className={styles.tagline}>Analyze text statistics and word frequency</p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.content}>
        <div className={styles.leftPanel}>
          <div className={styles.textareaSection}>
            <div className={styles.textareaHeader}>
              <span className={styles.sectionLabel}>Text Input</span>
              <label className={styles.wpmLabel}>
                Reading Speed:
                <input
                  type="number"
                  className={styles.wpmInput}
                  value={wpm}
                  onChange={(e) => handleWpmChange(parseInt(e.target.value, 10) || DEFAULT_WPM)}
                  min="50"
                  max="1000"
                  step="10"
                />
                <span className={styles.wpmUnit}>WPM</span>
              </label>
            </div>
            <textarea
              className={styles.textarea}
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Type or paste your text here..."
              spellCheck={false}
            />
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.statsSection}>
            <h2 className={styles.sectionTitle}>Statistics</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.characters.total.toLocaleString()}</div>
                <div className={styles.statLabel}>Characters</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.characters.withoutSpaces.toLocaleString()}</div>
                <div className={styles.statLabel}>Without Spaces</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.words.toLocaleString()}</div>
                <div className={styles.statLabel}>Words</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.lines.toLocaleString()}</div>
                <div className={styles.statLabel}>Lines</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.sentences.toLocaleString()}</div>
                <div className={styles.statLabel}>Sentences</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.paragraphs.toLocaleString()}</div>
                <div className={styles.statLabel}>Paragraphs</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {stats.readingTime.minutes}:{stats.readingTime.seconds.toString().padStart(2, "0")}
                </div>
                <div className={styles.statLabel}>Reading Time</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {stats.speakingTime.minutes}:{stats.speakingTime.seconds.toString().padStart(2, "0")}
                </div>
                <div className={styles.statLabel}>Speaking Time</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.avgWordLength.toFixed(1)}</div>
                <div className={styles.statLabel}>Avg Word Length</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>{stats.longestWord || "—"}</div>
                <div className={styles.statLabel}>Longest Word</div>
              </div>
            </div>
          </div>

          {stats.wordFrequency.length > 0 && (
            <div className={styles.frequencySection}>
              <h2 className={styles.sectionTitle}>Word Frequency</h2>
              <div className={styles.frequencyList}>
                {stats.wordFrequency.map(({ word, count }) => (
                  <div key={word} className={styles.frequencyItem}>
                    <span className={styles.frequencyWord}>{word}</span>
                    <span className={styles.frequencyCount}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stats.charFrequency.length > 0 && (
            <div className={styles.frequencySection}>
              <h2 className={styles.sectionTitle}>Character Frequency</h2>
              <div className={styles.frequencyList}>
                {stats.charFrequency.map(({ char, count }) => (
                  <div key={char} className={styles.frequencyItem}>
                    <span className={styles.frequencyWord}>{char}</span>
                    <span className={styles.frequencyCount}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow} data-permalink-row>
        <span className={styles.fieldLabel}>Permalink</span>
        <span className={styles.permalinkUrl}>{url}</span>
        {!isIframe && (
          <button
            className={`${styles.copyBtn}${copied ? ` ${styles.copied}` : ""}`}
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
