import { useState, useEffect } from "react";
import styles from "@/styles/json-yaml.module.css";
import { Badge, Button, CopyButton, PageLayout, Panel, PanelHeader, PanelBody, PermalinkRow } from "@/components/ui";
import { dump, load } from "js-yaml";

export default function JsonYamlPage(): React.ReactNode {
  const [json, setJson] = useState("");
  const [yaml, setYaml] = useState("");
  const [jsonError, setJsonError] = useState(false);
  const [yamlError, setYamlError] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const j = params.get("json");
    const y = params.get("yaml");

    if (j) {
      const decoded = decodeURIComponent(j);

      setJson(decoded); // eslint-disable-line react-hooks/set-state-in-effect
      try {
        const parsed: unknown = JSON.parse(decoded);

        setYaml(dump(parsed, { indent: 2 }).trimEnd());
        setJsonError(false);
      } catch {
        setJsonError(true);
      }
    } else if (y) {
      const decoded = decodeURIComponent(y);

      setYaml(decoded);
      try {
        const parsed: unknown = load(decoded);

        setJson(JSON.stringify(parsed, null, 2));
        setYamlError(false);
      } catch {
        setYamlError(true);
      }
    }

    setUrl(window.location.href);
  }, []);

  function handleJsonChange(value: string): void {
    setJson(value);
    if (!value.trim()) {
      setYaml("");
      setJsonError(false);
      history.replaceState(null, "", window.location.pathname);
      setUrl(window.location.href);

      return;
    }

    try {
      const parsed: unknown = JSON.parse(value);
      const yamlOut = dump(parsed, { indent: 2 }).trimEnd();

      setYaml(yamlOut);
      setJsonError(false);
      const params = new URLSearchParams({ json: encodeURIComponent(value) });

      history.replaceState(null, "", `?${params}`);
      setUrl(window.location.href);
    } catch {
      setJsonError(true);
    }
  }

  function handleYamlChange(value: string): void {
    setYaml(value);
    if (!value.trim()) {
      setJson("");
      setYamlError(false);
      history.replaceState(null, "", window.location.pathname);
      setUrl(window.location.href);

      return;
    }

    try {
      const parsed: unknown = load(value);
      const jsonOut = JSON.stringify(parsed, null, 2);

      setJson(jsonOut);
      setYamlError(false);
      const params = new URLSearchParams({ yaml: encodeURIComponent(value) });

      history.replaceState(null, "", `?${params}`);
      setUrl(window.location.href);
    } catch {
      setYamlError(true);
    }
  }

  function handleReset(): void {
    setJson("");
    setYaml("");
    setJsonError(false);
    setYamlError(false);
    history.replaceState(null, "", window.location.pathname);
    setUrl(window.location.href);
  }

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="JSON ↔ YAML Converter"
        metaDescription="Convert between JSON and YAML with live bidirectional sync and shareable permalinks. Free online JSON to YAML converter — no installation required."
        path="/json-yaml"
        h1="JSON ↔ YAML"
        tagline="Convert between JSON and YAML with live bidirectional sync."
      >

      <div className={styles.panels}>
        <Panel>
          <PanelHeader label="JSON">
            {jsonError && (
              <Badge color="error">invalid json</Badge>
            )}
          </PanelHeader>
          <PanelBody>
            <textarea
              className={styles.textarea}
              value={json}
              onChange={(e) => {
                handleJsonChange(e.target.value);
              }}
              placeholder='{"key": "value"}'
              autoComplete="off"
              spellCheck={false}
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader label="YAML">
            {yamlError && (
              <Badge color="error">invalid yaml</Badge>
            )}
          </PanelHeader>
          <PanelBody>
            <textarea
              className={styles.textarea}
              value={yaml}
              onChange={(e) => {
                handleYamlChange(e.target.value);
              }}
              placeholder="key: value"
              autoComplete="off"
              spellCheck={false}
            />
          </PanelBody>
        </Panel>
      </div>

      </PageLayout>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
    </div>
  );
}
