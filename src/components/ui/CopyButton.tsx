import React, { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useCanCopy } from "@/lib/useCanCopy";

type ButtonVariant = "copy" | "reset" | "tab" | "toggle" | "ghost";

interface CopyButtonProps {
  value: string;
  variant?: ButtonVariant;
  size?: "xs" | "sm" | "md";
  className?: string;
  disabled?: boolean;
}

export function CopyButton({
  value,
  variant = "copy",
  size = "md",
  className = "",
  disabled = false,
}: CopyButtonProps): React.ReactNode {
  const canCopy = useCanCopy();
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  // Hidden when the embedding host doesn't (provably) allow clipboard
  // writes — a visible-but-failing Copy button is worse than none.
  if (!canCopy) return null;

  const handleClick = (): void => {
    void copyToClipboard(value).then(() => {
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 1500);
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      copied={copied}
      className={className}
      onClick={handleClick}
      disabled={disabled}
    >
      Copy
    </Button>
  );
}
