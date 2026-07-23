import { useEffect, useState } from "react";
import styles from "@/styles/keycode.module.css";
import { PageLayout, PermalinkRow } from "@/components/ui";
import { useUrlSync } from "@/lib/useUrlSync";

interface KeyInfo {
  key: string;
  code: string;
  keyCode: number;
  which: number;
  location: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

const LOCATION_NAMES: Record<number, string> = {
  0: "Standard",
  1: "Left",
  2: "Right",
  3: "Numpad",
};

export default function KeycodePage(): React.ReactNode {
  const { replaceUrlNow } = useUrlSync();
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href); // eslint-disable-line react-hooks/set-state-in-effect
    const handleKeyDown = (e: KeyboardEvent): void => {
      setKeyInfo({
        key: e.key,
        code: e.code,
        keyCode: e.keyCode, // eslint-disable-line @typescript-eslint/no-deprecated
        which: e.which, // eslint-disable-line @typescript-eslint/no-deprecated
        location: e.location,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        metaKey: e.metaKey,
      });
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const modifiers = keyInfo
    ? [
        keyInfo.ctrlKey && "Ctrl",
        keyInfo.shiftKey && "Shift",
        keyInfo.altKey && "Alt",
        keyInfo.metaKey && "Meta",
      ].filter(Boolean as unknown as <T>(x: T | false) => x is T)
    : [];

  const isSpecialKey = keyInfo && keyInfo.key.length > 1;
  const displayKey = keyInfo
    ? keyInfo.key === " "
      ? "Space"
      : keyInfo.key
    : null;

  const handleReset = (): void => {
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    replaceUrlNow(newUrl);
    setUrl(newUrl);
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Keycode Inspector"
        metaDescription="Inspect JavaScript keyboard event properties: keyCode, key, code, and modifiers for any key press. Free online keycode tool — no installation required."
        path="/keycode"
        h1="Keycode"
        tagline="Press any key to inspect its JavaScript event properties"
      >

      <div className={styles.body}>
        <div className={styles.keyDisplay}>
          {displayKey ? (
            <span
              className={`${styles.keyChar} ${isSpecialKey ? styles.keySpecial : ""}`}
            >
              {displayKey}
            </span>
          ) : (
            <span className={styles.keyPrompt}>press any key</span>
          )}
        </div>

        <div className={styles.table}>
          <div className={styles.row}>
            <span className={styles.label}>key</span>
            <span className={styles.value}>
              {keyInfo ? (keyInfo.key === " " ? '" "' : keyInfo.key) : "—"}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>code</span>
            <span className={styles.value}>{keyInfo?.code ?? "—"}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>keyCode</span>
            <span className={styles.value}>
              {keyInfo != null ? keyInfo.keyCode : "—"}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>which</span>
            <span className={styles.value}>
              {keyInfo != null ? keyInfo.which : "—"}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>location</span>
            <span className={styles.value}>
              {keyInfo != null
                ? `${LOCATION_NAMES[keyInfo.location] ?? keyInfo.location} (${keyInfo.location})`
                : "—"}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>modifiers</span>
            <span className={styles.value}>
              {keyInfo
                ? modifiers.length > 0
                  ? modifiers.join(" + ")
                  : "none"
                : "—"}
            </span>
          </div>
        </div>
      </div>

      </PageLayout>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
    </div>
  );
}
