import React from "react";
import { CopyButton } from "./CopyButton";
import { Button } from "./Button";
import styles from "./PermalinkRow.module.css";

interface PermalinkRowProps {
  url: string;
  onReset: () => void;
  muted?: boolean;
  /** The encoded state exceeds a shareable URL length — copy is disabled. */
  tooLong?: boolean;
}

export function PermalinkRow({
  url,
  onReset,
  muted = false,
  tooLong = false,
}: PermalinkRowProps): React.ReactNode {
  return (
    <div
      className={`${styles.row}${muted ? ` ${styles.muted}` : ""}`}
      data-permalink-row
    >
      <span className={styles.label}>Permalink</span>
      <span className={`${styles.url}${tooLong ? ` ${styles.urlTooLong}` : ""}`}>
        {tooLong ? "url too long to share" : url}
      </span>
      <CopyButton value={url} disabled={tooLong} />
      <Button variant="reset" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}
