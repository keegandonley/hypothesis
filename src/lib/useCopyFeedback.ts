import { useEffect, useRef, useState } from "react";
import { copyToClipboard } from "./copyToClipboard";

/**
 * Per-item copy with a timed "copied" indicator, for pages with many
 * click-to-copy targets (shades, characters, units...). `copiedKey` is the
 * key of the most recently copied item, or null once the indicator resets.
 * Clears its pending timeout on unmount.
 */
export function useCopyFeedback<K = string>(resetMs = 1500): {
  copiedKey: K | null;
  copy: (key: K, text: string) => void;
} {
  const [copiedKey, setCopiedKey] = useState<K | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  const copy = (key: K, text: string): void => {
    void copyToClipboard(text).then(() => {
      setCopiedKey(key);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setCopiedKey(null);
      }, resetMs);
    });
  };

  return { copiedKey, copy };
}
