import { useEffect, useRef, useState, useCallback } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "@/styles/lorem.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { useIsIframe } from "@/lib/useIsIframe";
import { Button, CopyButton, PermalinkRow, Panel, PanelHeader } from "@/components/ui";

const WORDS = [
  "lorem",
  "ipsum",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipiscing",
  "elit",
  "sed",
  "do",
  "eiusmod",
  "tempor",
  "incididunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magna",
  "aliqua",
  "enim",
  "ad",
  "minim",
  "veniam",
  "quis",
  "nostrud",
  "exercitation",
  "ullamco",
  "laboris",
  "nisi",
  "aliquip",
  "ex",
  "ea",
  "commodo",
  "consequat",
  "duis",
  "aute",
  "irure",
  "in",
  "reprehenderit",
  "voluptate",
  "velit",
  "esse",
  "cillum",
  "eu",
  "fugiat",
  "nulla",
  "pariatur",
  "excepteur",
  "sint",
  "occaecat",
  "cupidatat",
  "non",
  "proident",
  "sunt",
  "culpa",
  "qui",
  "officia",
  "deserunt",
  "mollit",
  "anim",
  "id",
  "est",
  "laborum",
  "perspiciatis",
  "unde",
  "omnis",
  "iste",
  "natus",
  "error",
  "voluptatem",
  "accusantium",
  "doloremque",
  "laudantium",
  "totam",
  "rem",
  "aperiam",
  "eaque",
  "ipsa",
  "quae",
  "ab",
  "inventore",
  "veritatis",
  "quasi",
  "architecto",
  "beatae",
  "vitae",
  "dicta",
  "explicabo",
  "nemo",
  "ipsam",
  "quia",
  "voluptas",
  "aspernatur",
  "aut",
  "odit",
  "fugit",
  "consequuntur",
  "magni",
  "dolores",
  "eos",
  "ratione",
  "sequi",
  "nesciunt",
  "neque",
  "porro",
  "quisquam",
  "dolorem",
  "adipisci",
  "numquam",
  "eius",
  "modi",
  "tempora",
  "incidunt",
  "labore",
  "magnam",
  "quaerat",
  "soluta",
  "nobis",
  "eligendi",
  "optio",
  "cumque",
  "impedit",
  "quo",
  "minus",
  "maxime",
  "placeat",
  "facere",
  "possimus",
  "assumenda",
  "repellendus",
];

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateWords(count: number): string {
  return Array.from({ length: count }, () => pick(WORDS)).join(" ");
}

function generateSentences(count: number): string {
  return Array.from({ length: count }, () => {
    const len = 8 + Math.floor(Math.random() * 8);
    const words = Array.from({ length: len }, () => pick(WORDS));

    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);

    return words.join(" ") + ".";
  }).join(" ");
}

function generateParagraphs(count: number): string {
  return Array.from({ length: count }, () => {
    const sentenceCount = 3 + Math.floor(Math.random() * 4);

    return generateSentences(sentenceCount);
  }).join("\n\n");
}

type UnitType = "words" | "sentences" | "paragraphs";

function generate(type: UnitType, count: number): string {
  switch (type) {
    case "words":
      return generateWords(count);
    case "sentences":
      return generateSentences(count);
    case "paragraphs":
      return generateParagraphs(count);
  }
}

export default function LoremPage(): React.ReactNode {
  const branding = useBranding();
  const isIframe = useIsIframe();
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
      <ToolHead
        title="Lorem Ipsum Generator"
        description="Generate lorem ipsum placeholder text by words, sentences, or paragraphs. Free online lorem ipsum generator — no installation required. No data sent to servers."
        path="/lorem"
        brandName={branding.name}
      />

      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
          <Link
            href="/"
            target={isIframe ? "_blank" : undefined}
            rel={isIframe ? "noopener noreferrer" : undefined}
            className={styles.domainLink}
          >
            {branding.domain}
          </Link>
          {"·"}
          <Link
            href="/docs/lorem"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Lorem Ipsum</h1>
        <p className={styles.tagline}>
          Generate placeholder text by words, sentences, or paragraphs
        </p>
      </div>

      <hr className={styles.divider} />

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
              size="sm"
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

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
    </div>
  );
}
