import { useEffect, useState } from "react";
import styles from "@/styles/text-stats.module.css";
import { Button, CopyButton, PageLayout, PermalinkRow } from "@/components/ui";
import { DEFAULT_WPM, analyzeText } from "@/lib/text-stats";

export default function TextStatsPage(): React.ReactNode {
  const [text, setText] = useState("");
  const [wpm, setWpm] = useState(DEFAULT_WPM);
  const [url, setUrl] = useState("");

  const stats = analyzeText(text, wpm);

  const buildUrl = (txt: string, wordsPerMin: number): string => {
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

        setText(decoded); // eslint-disable-line react-hooks/set-state-in-effect
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

  const handleTextChange = (value: string): void => {
    setText(value);
    const newUrl = buildUrl(value, wpm);

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleWpmChange = (value: number): void => {
    setWpm(value);
    const newUrl = buildUrl(text, value);

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleReset = (): void => {
    setText("");
    setWpm(DEFAULT_WPM);
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Text Statistics"
        metaDescription="Analyze text for word count, character count, readability score, and more statistics. Free online text analysis tool — no installation required. No data sent to servers."
        path="/text-stats"
        h1="Text Stats"
        tagline="Analyze text statistics and word frequency"
      >

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
                  onChange={(e) => {
                    handleWpmChange(
                      parseInt(e.target.value, 10) || DEFAULT_WPM,
                    );
                  }}
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
              onChange={(e) => {
                handleTextChange(e.target.value);
              }}
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
                <div className={styles.statValue}>
                  {stats.characters.total.toLocaleString()}
                </div>
                <div className={styles.statLabel}>Characters</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {stats.characters.withoutSpaces.toLocaleString()}
                </div>
                <div className={styles.statLabel}>Without Spaces</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {stats.words.toLocaleString()}
                </div>
                <div className={styles.statLabel}>Words</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {stats.lines.toLocaleString()}
                </div>
                <div className={styles.statLabel}>Lines</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {stats.sentences.toLocaleString()}
                </div>
                <div className={styles.statLabel}>Sentences</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {stats.paragraphs.toLocaleString()}
                </div>
                <div className={styles.statLabel}>Paragraphs</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {stats.readingTime.minutes}:
                  {stats.readingTime.seconds.toString().padStart(2, "0")}
                </div>
                <div className={styles.statLabel}>Reading Time</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {stats.speakingTime.minutes}:
                  {stats.speakingTime.seconds.toString().padStart(2, "0")}
                </div>
                <div className={styles.statLabel}>Speaking Time</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {stats.avgWordLength.toFixed(1)}
                </div>
                <div className={styles.statLabel}>Avg Word Length</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statValue}>
                  {stats.longestWord || "—"}
                </div>
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

      </PageLayout>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
    </div>
  );
}
