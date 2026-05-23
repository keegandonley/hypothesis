import React from "react";
import { CopyButton } from "./CopyButton";
import { Button } from "./Button";
import styles from "./PermalinkRow.module.css";

interface PermalinkRowProps {
  url: string;
  onReset: () => void;
  muted?: boolean;
}

export function PermalinkRow({
  url,
  onReset,
  muted = false,
}: PermalinkRowProps): React.ReactNode {
  return (
    <div
      className={`${styles.row}${muted ? ` ${styles.muted}` : ""}`}
      data-permalink-row
    >
      <span className={styles.label}>Permalink</span>
      <span className={styles.url}>{url}</span>
      <CopyButton value={url} />
      <Button variant="reset" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}
