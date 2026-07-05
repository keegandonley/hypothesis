import { useEffect, useState } from "react";
import LZString from "lz-string";
import styles from "@/styles/scratch.module.css";
import { Button, CopyButton, PageLayout, PermalinkRow } from "@/components/ui";
import { useUrlSync } from "@/lib/useUrlSync";

export default function ScratchPage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("text");

    if (value) setText(LZString.decompressFromEncodedURIComponent(value) ?? ""); // eslint-disable-line react-hooks/set-state-in-effect
    setUrl(window.location.href);
  }, []);

  const handleChange = (value: string): void => {
    setText(value);
    const newUrl = value
      ? `${window.location.origin}${window.location.pathname}?text=${LZString.compressToEncodedURIComponent(value)}`
      : `${window.location.origin}${window.location.pathname}`;

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleReset = (): void => {
    setText("");
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    replaceUrlNow(newUrl);
    setUrl(newUrl);
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Scratch Pad"
        metaDescription="A lightweight online scratchpad — type notes and save them instantly via shareable permalink. Free, no installation required. No data sent to servers."
        path="/scratch"
        h1="Scratch"
        tagline="Type anything — copy the permalink to bookmark it"
      >

      <div className={styles.textareaWrapper}>
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(e) => {
            handleChange(e.target.value);
          }}
          placeholder="Start typing..."
          spellCheck={false}
          autoFocus
        />
      </div>

      </PageLayout>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
    </div>
  );
}
