import React from "react";
import styles from "./Button.module.css";

type Variant = "copy" | "reset" | "tab" | "toggle" | "ghost";

type Size = "xs" | "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  active?: boolean;
  copied?: boolean;
}

export function Button({
  variant = "copy",
  size = "md",
  active = false,
  copied = false,
  className = "",
  children,
  ...props
}: ButtonProps): React.ReactNode {
  return (
    <button
      className={[
        styles.btn,
        styles[variant],
        styles[size],
        active ? styles.active : "",
        copied ? styles.copied : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
