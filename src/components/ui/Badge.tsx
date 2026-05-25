import React from "react";
import styles from "./Badge.module.css";

type BadgeColor = "accent" | "error" | "blue" | "ready";

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
