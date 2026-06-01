import { useEffect, useState } from "react";
import styles from "@/styles/uuid.module.css";
import { Badge, Button, CopyButton, PageLayout } from "@/components/ui";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/Panel";
import { generate } from "@/lib/uuid";

export default function UuidPage(): React.ReactNode {
  const [uuid, setUuid] = useState("");
  const [version, setVersion] = useState<1 | 4 | 7>(4);

  const buildUrl = (ver: number): string => {
    const params = new URLSearchParams({ version: String(ver) });

    return `${window.location.origin}${window.location.pathname}?${params}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verParam = params.get("version");
    const ver = (
      verParam === "1" || verParam === "7" ? Number(verParam) : 4
    ) as 1 | 4 | 7;

    setVersion(ver); // eslint-disable-line react-hooks/set-state-in-effect
    setUuid(generate(ver));
    history.replaceState(null, "", buildUrl(ver));
  }, []);

  const handleRegenerate = (): void => {
    setUuid(generate(version));
  };

  const handleVersionChange = (ver: 1 | 4 | 7): void => {
    setVersion(ver);
    setUuid(generate(ver));
    history.replaceState(null, "", buildUrl(ver));
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="UUID Generator"
        metaDescription="Generate cryptographically secure UUIDs (v1, v4, v7) and inspect existing ones. Free online UUID generator — no installation required. No data sent to servers."
        path="/uuid"
        h1="UUID"
        tagline="Generate UUIDs of any version with one click"
      >

      <div className={styles.panels}>
        <Panel>
          <PanelHeader label="Generated UUID">
            {([1, 4, 7] as const).map((ver) => (
              <Button
                key={ver}
                variant="toggle"
                active={version === ver}
                onClick={() => {
                  handleVersionChange(ver);
                }}
              >
                v{ver}
              </Button>
            ))}
            {version === 4 ? (
              <Badge color="blue">v{version}</Badge>
            ) : (
              <Badge color="error">v{version}</Badge>
            )}
          </PanelHeader>
          <PanelBody className={styles.uuidBody}>
            <textarea
              className={styles.uuidDisplay}
              value={uuid}
              readOnly
              spellCheck={false}
            />
            <CopyButton value={uuid} className={styles.copyOverlay} />
          </PanelBody>
        </Panel>
      </div>

      <hr className={styles.divider} />

      <div className={styles.bottomRow}>
        <Button variant="copy" onClick={handleRegenerate}>
          Regenerate
        </Button>
      </div>
      </PageLayout>
    </div>
  );
}
