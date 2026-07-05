import { useEffect, useRef, useState } from "react";
import styles from "@/styles/urlencode.module.css";
import { Badge, Button, PageLayout, Panel, PanelHeader, PanelBody, PermalinkRow } from "@/components/ui";
import { useUrlSync } from "@/lib/useUrlSync";

export default function UrlEncodePage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const [decoded, setDecoded] = useState("");
  const [encoded, setEncoded] = useState("");
  const [url, setUrl] = useState("");
  const [uriMode, setUriMode] = useState(false);

  const buildUrl = (dec: string, uri: boolean): string => {
    if (!dec) return `${window.location.origin}${window.location.pathname}`;
    const params = new URLSearchParams({ value: dec });

    if (uri) params.set("mode", "uri");

    return `${window.location.origin}${window.location.pathname}?${params}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("value");
    const uriParam = params.get("mode") === "uri";

    if (value) {
      setDecoded(value); // eslint-disable-line react-hooks/set-state-in-effect
      const enc = uriParam ? encodeURI(value) : encodeURIComponent(value);

      setEncoded(enc);
    }

    if (uriParam) setUriMode(true);
    setUrl(window.location.href);
  }, []);

  const handleDecodedChange = (value: string): void => {
    setDecoded(value);
    const enc = uriMode ? encodeURI(value) : encodeURIComponent(value);

    setEncoded(enc);
    const newUrl = buildUrl(value, uriMode);

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleEncodedChange = (value: string): void => {
    setEncoded(value);
    try {
      const dec = decodeURIComponent(value);

      setDecoded(dec);
    } catch {
      setDecoded("");
    }

    const newUrl = buildUrl(decoded, uriMode);

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleUriToggle = (): void => {
    const next = !uriMode;

    setUriMode(next);
    const enc = next ? encodeURI(decoded) : encodeURIComponent(decoded);

    setEncoded(enc);
    const newUrl = buildUrl(decoded, next);

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleReset = (): void => {
    setDecoded("");
    setEncoded("");
    setUriMode(false);
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    replaceUrlNow(newUrl);
    setUrl(newUrl);
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="URL Encoder / Decoder"
        metaDescription="Encode and decode URL components and query strings online. Free online URL encoder/decoder — no installation required. No data sent to servers."
        path="/urlencode"
        h1="URL Encode"
        tagline="Encode and decode URL strings"
        refs={[
          { name: "MIME Types", slug: "mime-types" },
          { name: "HTTP Headers", slug: "http-headers" },
        ]}
      >

      <div className={styles.panels}>
        <Panel>
          <PanelHeader label={uriMode ? "URI" : "Decoded"}>
            <Button variant="toggle" active={uriMode} onClick={handleUriToggle}>
              URI Mode {uriMode ? "ON" : "OFF"}
            </Button>
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
          <PanelHeader label="URL Encoded">
            <Badge>{encoded.length} chars</Badge>
          </PanelHeader>
          <PanelBody>
            <textarea
              className={styles.textarea}
              value={encoded}
              onChange={(e) => {
                handleEncodedChange(e.target.value);
              }}
              placeholder="Paste encoded string here..."
              spellCheck={false}
            />
          </PanelBody>
        </Panel>
      </div>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
      </PageLayout>
    </div>
  );
}
