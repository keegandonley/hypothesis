import { useEffect, useRef, useState, useCallback } from "react";
import styles from "@/styles/lorem.module.css";
import { Button, CopyButton, PageLayout, PermalinkRow, Panel, PanelHeader } from "@/components/ui";
import { generate } from "@/lib/lorem";
import type { UnitType } from "@/lib/lorem";

export default function LoremPage(): React.ReactNode {
  const [type, setType] = useState<UnitType>("paragraphs");
  const [count, setCount] = useState(3);
  const [output, setOutput] = useState("");
  const [url, setUrl] = useState("");

  const regenerate = useCallback((t: UnitType, c: number) => {
    setOutput(generate(t, c));
  }, []);

  const buildUrl = (t: UnitType, c: number): string => {
    const params = new URLSearchParams({ type: t, count: String(c) });

    return `${window.location.origin}${window.location.pathname}?${params}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get("type") as UnitType | null;
    const countParam = params.get("count");
    const t: UnitType =
      typeParam && ["words", "sentences", "paragraphs"].includes(typeParam)
        ? typeParam
        : "paragraphs";
    const c = countParam
      ? Math.max(1, Math.min(100, parseInt(countParam, 10) || 3))
      : 3;

    setType(t); // eslint-disable-line react-hooks/set-state-in-effect
    setCount(c);
    setOutput(generate(t, c));
    const initialUrl = buildUrl(t, c);

    history.replaceState(null, "", initialUrl);
    setUrl(initialUrl);
  }, []);

  const handleTypeChange = (t: UnitType): void => {
    setType(t);
    setOutput(generate(t, count));
    const newUrl = buildUrl(t, count);

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleCountChange = (c: number): void => {
    const clamped = Math.max(1, Math.min(100, c));

    setCount(clamped);
    setOutput(generate(type, clamped));
    const newUrl = buildUrl(type, clamped);

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleReset = (): void => {
    const t: UnitType = "paragraphs";
    const c = 3;

    setType(t);
    setCount(c);
    setOutput(generate(t, c));
    const newUrl = buildUrl(t, c);

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleRegenerate = (): void => {
    regenerate(type, count);
  };

  const UNIT_TYPES: UnitType[] = ["words", "sentences", "paragraphs"];

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Lorem Ipsum Generator"
        metaDescription="Generate lorem ipsum placeholder text by words, sentences, or paragraphs. Free online lorem ipsum generator — no installation required. No data sent to servers."
        path="/lorem"
        h1="Lorem Ipsum"
        tagline="Generate placeholder text by words, sentences, or paragraphs"
      >

      <div className={styles.controls}>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Unit</span>
          <div className={styles.toggleGroup}>
            {UNIT_TYPES.map((t) => (
              <Button
                key={t}
                variant="toggle"
                active={type === t}
                onClick={() => {
                  handleTypeChange(t);
                }}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>
        <div className={styles.controlRow}>
          <span className={styles.controlLabel}>Count</span>
          <input
            className={styles.countInput}
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);

              if (!isNaN(v)) handleCountChange(v);
            }}
          />
          <input
            className={styles.slider}
            type="range"
            min={1}
            max={100}
            value={count}
            onChange={(e) => {
              handleCountChange(parseInt(e.target.value, 10));
            }}
          />
        </div>
      </div>

      <div className={styles.outputPanel}>
        <PanelHeader label="Output">
          <div className={styles.panelActions}>
            <Button variant="copy" onClick={handleRegenerate}>
              Regenerate
            </Button>
            <CopyButton
              value={output}
              variant="ghost"
              className={styles.copyOverlay}
              disabled={!output}
            />
          </div>
        </PanelHeader>
        <textarea
          className={styles.outputTextarea}
          value={output}
          readOnly
          spellCheck={false}
        />
      </div>

      </PageLayout>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
    </div>
  );
}
