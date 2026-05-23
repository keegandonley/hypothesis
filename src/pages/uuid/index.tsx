import { useEffect, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "@/styles/uuid.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { useIsIframe } from "@/lib/useIsIframe";
import { v1, v4, v7 } from "uuid";
import { Badge, Button, CopyButton } from "@/components/ui";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/Panel";

function generate(ver: 1 | 4 | 7): string {
  if (ver === 1) return v1();

  if (ver === 4) return v4();

  return v7();
}

export default function UuidPage(): React.ReactNode {
  const branding = useBranding();
  const isIframe = useIsIframe();
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
      <ToolHead
        title="UUID Generator"
        description="Generate cryptographically secure UUIDs (v1, v4, v7) and inspect existing ones. Free online UUID generator — no installation required. No data sent to servers."
        path="/uuid"
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
            href="/docs/uuid"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>UUID</h1>
        <p className={styles.tagline}>
          Generate UUIDs of any version with one click
        </p>
      </div>

      <hr className={styles.divider} />

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
    </div>
  );
}
