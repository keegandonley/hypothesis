import React from "react";
import styles from "./Panel.module.css";

interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

export function Panel({
  children,
  className = "",
}: PanelProps): React.ReactNode {
  return (
    <div className={`${styles.panel}${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}

interface PanelHeaderProps {
  label: string;
  children?: React.ReactNode;
  className?: string;
}

export function PanelHeader({
  label,
  children,
  className = "",
}: PanelHeaderProps): React.ReactNode {
  return (
    <div className={`${styles.header}${className ? ` ${className}` : ""}`}>
      <span className={styles.label}>{label}</span>
      {children && (
        <div className={styles.headerRight}>{children}</div>
      )}
    </div>
  );
}

interface PanelLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function PanelLabel({
  children,
  className = "",
}: PanelLabelProps): React.ReactNode {
  return (
    <span className={`${styles.label}${className ? ` ${className}` : ""}`}>
      {children}
    </span>
  );
}

interface PanelBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function PanelBody({
  children,
  className = "",
}: PanelBodyProps): React.ReactNode {
  return (
    <div className={`${styles.body}${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
