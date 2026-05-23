import React from "react";
import styles from "./Button.module.css";

type Variant = "copy" | "reset" | "tab" | "toggle" | "ghost";

type Size = "xs" | "sm" | "md";

type Status = "idle" | "pending" | "success" | "error";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  active?: boolean;
  copied?: boolean;
  status?: Status;
}

export function Button({
  variant = "copy",
  size = "md",
  active = false,
  copied = false,
  status = "idle",
  className = "",
  children,
  ...props
}: ButtonProps): React.ReactNode {
  const effectiveStatus = copied ? "success" : status;
  const hasOverlay = effectiveStatus !== "idle";

  return (
    <button
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        active ? styles.active : "",
        effectiveStatus === "success" ? styles.copied : "",
        effectiveStatus === "error" ? styles.error : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <span className={hasOverlay ? styles.contentHidden : styles.content}>
        {children}
      </span>
      {hasOverlay && (
        <span className={styles.overlay}>
          {effectiveStatus === "pending" && (
            <span className={styles.spinner} />
          )}
          {effectiveStatus === "success" && (
            <span className={styles.successIcon}>&#10003;</span>
          )}
          {effectiveStatus === "error" && (
            <span className={styles.errorIcon}>&#10005;</span>
          )}
        </span>
      )}
    </button>
  );
}
