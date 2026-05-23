import React, { useRef, useState } from "react";
import { Button } from "./Button";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

interface CopyButtonProps {
  value: string;
  size?: "xs" | "sm" | "md";
  className?: string;
  disabled?: boolean;
}

export function CopyButton({
  value,
  size = "md",
  className = "",
  disabled = false,
}: CopyButtonProps): React.ReactNode {
  const isIframe = useIsIframe();
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (isIframe) return null;

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
      variant="copy"
      size={size}
      copied={copied}
      className={className}
      onClick={handleClick}
      disabled={disabled}
    >
      {copied ? "Copied!" : "Copy"}
    </Button>
  );
}
