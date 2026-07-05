import { useEffect, useRef, useState } from "react";
import styles from "@/styles/json-ts.module.css";
import { Badge, Button, CopyButton, PageLayout, Panel, PanelHeader, PanelBody, PermalinkRow } from "@/components/ui";
import { jsonToTs } from "@/lib/json-ts";
import { useUrlSync } from "@/lib/useUrlSync";

export default function JsonTsPage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const [jsonInput, setJsonInput] = useState("");
  const [tsOutput, setTsOutput] = useState("");
  const [rootName, setRootName] = useState("Root");
  const [optional, setOptional] = useState(false);
  const [jsonValid, setJsonValid] = useState<boolean | null>(null);
  const [url, setUrl] = useState("");

  const buildUrl = (j: string, n: string, o: boolean): string => {
    if (!j) return `${window.location.origin}${window.location.pathname}`;
    const payload = btoa(
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      unescape(encodeURIComponent(JSON.stringify({ j, n, o }))),
    );

    return `${window.location.origin}${window.location.pathname}?v=${payload}`;
  };

  const compute = (j: string, n: string, o: boolean): void => {
    if (!j.trim()) {
      setTsOutput("");
      setJsonValid(null);

      return;
    }

    try {
      const result = jsonToTs(j, n || "Root", o);

      setTsOutput(result);
      setJsonValid(true);
    } catch {
      setTsOutput("");
      setJsonValid(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");

    if (v) {
      try {
        const decoded = JSON.parse(
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          decodeURIComponent(escape(atob(v))),
        ) as Record<string, unknown>;
        const j = typeof decoded.j === "string" ? decoded.j : "";
        const n = typeof decoded.n === "string" ? decoded.n : "Root";
        const o = typeof decoded.o === "boolean" ? decoded.o : false;

        setJsonInput(j); // eslint-disable-line react-hooks/set-state-in-effect
        setRootName(n);
        setOptional(o);
        compute(j, n, o);
      } catch {
        /* no-op */
      }
    }

    setUrl(window.location.href);
  }, []);

  const handleJsonChange = (value: string): void => {
    setJsonInput(value);
    compute(value, rootName, optional);
    const newUrl = buildUrl(value, rootName, optional);

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleRootNameChange = (value: string): void => {
    setRootName(value);
    compute(jsonInput, value, optional);
    const newUrl = buildUrl(jsonInput, value, optional);

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleOptionalToggle = (): void => {
    const next = !optional;

    setOptional(next);
    compute(jsonInput, rootName, next);
    const newUrl = buildUrl(jsonInput, rootName, next);

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleReset = (): void => {
    setJsonInput("");
    setTsOutput("");
    setRootName("Root");
    setOptional(false);
    setJsonValid(null);
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    replaceUrlNow(newUrl);
    setUrl(newUrl);
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="JSON to TypeScript"
        metaDescription="Convert JSON objects to TypeScript interfaces and types instantly. Free online JSON to TypeScript converter — no installation required. No data sent to servers."
        path="/json-ts"
        h1="JSON → TypeScript"
        tagline="Convert a JSON sample into TypeScript interface definitions"
      >

      <div className={styles.panels}>
        <Panel>
          <PanelHeader label="JSON Input">
            {jsonInput.length === 0 ? (
              <Badge color="ready">ready</Badge>
            ) : jsonValid ? (
              <Badge>valid</Badge>
            ) : (
              <Badge color="warn">invalid</Badge>
            )}
          </PanelHeader>
          <PanelBody>
            <textarea
              className={styles.textarea}
              value={jsonInput}
              onChange={(e) => {
                handleJsonChange(e.target.value);
              }}
              placeholder="Paste JSON here..."
              spellCheck={false}
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader label="TypeScript Output">
            {tsOutput && <CopyButton value={tsOutput} variant="ghost" size="sm" />}
          </PanelHeader>
          <PanelBody>
            <textarea
              className={styles.textarea}
              value={tsOutput}
              readOnly
              placeholder="TypeScript interfaces will appear here..."
              spellCheck={false}
            />
          </PanelBody>
        </Panel>
      </div>

      <div className={styles.optionsRow}>
        <label className={styles.optionLabel}>
          <span className={styles.fieldLabel}>Root name</span>
          <input
            className={styles.nameInput}
            type="text"
            value={rootName}
            onChange={(e) => {
              handleRootNameChange(e.target.value);
            }}
            placeholder="Root"
            spellCheck={false}
          />
        </label>
        <Button
          variant="toggle"
          active={optional}
          onClick={handleOptionalToggle}
        >
          Optional fields {optional ? "ON" : "OFF"}
        </Button>
      </div>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
      </PageLayout>
    </div>
  );
}
