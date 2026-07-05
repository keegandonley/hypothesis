import React from "react";
import styles from "./Badge.module.css";

// "warn" is the amber problem/attention tone — distinct from the red
// --danger tokens used by destructive actions.
type BadgeColor = "accent" | "warn" | "blue" | "ready";

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({
  children,
  color = "accent",
  className = "",
  style,
}: BadgeProps): React.ReactNode {
  return (
    <span
      className={`${styles.badge} ${styles[color]}${className ? ` ${className}` : ""}`}
      style={style}
    >
      {children}
    </span>
  );
}
