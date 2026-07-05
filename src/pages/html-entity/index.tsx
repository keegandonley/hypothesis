import React, { useEffect, useState } from "react";
import styles from "@/styles/html-entity.module.css";
import { Badge, Button, CopyButton, PageLayout, Panel, PanelHeader, PanelBody, PermalinkRow } from "@/components/ui";
import { encodeHtmlEntities, decodeHtmlEntities, type EncodeMode } from "@/lib/html-entity";
import { useUrlSync } from "@/lib/useUrlSync";

export default function HtmlEntityPage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const [decoded, setDecoded] = useState("");
  const [encoded, setEncoded] = useState("");
  const [url, setUrl] = useState("");
  const [encodeMode, setEncodeMode] = useState<EncodeMode>("special");

  const buildUrl = (dec: string, mode: EncodeMode): string => {
    if (!dec) return `${window.location.origin}${window.location.pathname}`;
    const params = new URLSearchParams({ value: dec });

    if (mode !== "special") params.set("mode", mode);

    return `${window.location.origin}${window.location.pathname}?${params}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("value");
    const modeParam = params.get("mode") as EncodeMode;

    if (value) {
      setDecoded(value); // eslint-disable-line react-hooks/set-state-in-effect
      const mode =
        modeParam && ["all", "special", "non-ascii"].includes(modeParam)
          ? modeParam
          : "special";

      setEncodeMode(mode);
      const enc = encodeHtmlEntities(value, mode);

      setEncoded(enc);
    }

    setUrl(window.location.href);
  }, []);

  const handleDecodedChange = (value: string): void => {
    setDecoded(value);
    const enc = encodeHtmlEntities(value, encodeMode);

    setEncoded(enc);
    const newUrl = buildUrl(value, encodeMode);

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleEncodedChange = (value: string): void => {
    setEncoded(value);
    const dec = decodeHtmlEntities(value);

    setDecoded(dec);
    const newUrl = buildUrl(dec, encodeMode);

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleModeChange = (mode: EncodeMode): void => {
    setEncodeMode(mode);
    const enc = encodeHtmlEntities(decoded, mode);

    setEncoded(enc);
    const newUrl = buildUrl(decoded, mode);

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleReset = (): void => {
    setDecoded("");
    setEncoded("");
    setEncodeMode("special");
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    replaceUrlNow(newUrl);
    setUrl(newUrl);
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="HTML Entity Encoder / Decoder"
        metaDescription="Encode and decode HTML entities like &amp;, &lt;, &gt;, and named or numeric references. Free online HTML entity tool — no installation required."
        path="/html-entity"
        h1="HTML Entity"
        tagline="Encode and decode HTML entities"
        refs={[{ name: "ASCII Table", slug: "ascii" }]}
      >

      <div className={styles.panels}>
        <Panel>
          <PanelHeader label="Decoded Text">
            <Badge>{decoded.length} chars</Badge>
          </PanelHeader>
          <PanelBody>
            <textarea
              className={styles.textarea}
              value={decoded}
              onChange={(e) => {
                handleDecodedChange(e.target.value);
              }}
              placeholder="Type or paste text here..."
              spellCheck={false}
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader label="HTML Entities">
            <Badge>{encoded.length} chars</Badge>
          </PanelHeader>
          <PanelBody>
            <textarea
              className={styles.textarea}
              value={encoded}
              onChange={(e) => {
                handleEncodedChange(e.target.value);
              }}
              placeholder="Paste encoded entities here..."
              spellCheck={false}
            />
          </PanelBody>
        </Panel>
      </div>

      <div className={styles.modeSelector}>
        <span className={styles.fieldLabel}>Encode Mode</span>
        <div className={styles.modeButtons}>
          <Button variant="tab" active={encodeMode === "special"} onClick={() => { handleModeChange("special"); }}>
            Special (&lt; &gt; &amp; &quot; &apos;)
          </Button>
          <Button variant="tab" active={encodeMode === "non-ascii"} onClick={() => { handleModeChange("non-ascii"); }}>
            Non-ASCII Only (excludes special chars)
          </Button>
          <Button variant="tab" active={encodeMode === "all"} onClick={() => { handleModeChange("all"); }}>
            Special + Non-ASCII
          </Button>
        </div>
      </div>

      </PageLayout>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
    </div>
  );
}
