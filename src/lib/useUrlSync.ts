import { useCallback, useEffect, useRef } from "react";

// Trailing debounce for history.replaceState. Safari throws a SecurityError
// past ~100 calls per 30 seconds, which ordinary typing speed exceeds when
// every keystroke rewrites the URL. Pages update their displayed permalink
// state immediately; only the address-bar write is deferred.
const REPLACE_STATE_DEBOUNCE_MS = 200;

interface UrlSync {
  /** Debounced write — use for keystroke/drag-driven URL updates. */
  replaceUrl: (newUrl: string) => void;
  /**
   * Immediate write, cancelling any pending debounced one — use for mount
   * restores, resets, and click-driven changes so a stale keystroke write
   * can't land 200ms after a reset.
   */
  replaceUrlNow: (newUrl: string) => void;
}

export function useUrlSync(): UrlSync {
  const timeoutRef = useRef<number | null>(null);

  const cancelPending = useCallback((): void => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cancel (never flush) on unmount: a late replaceState would clobber the
  // URL of whatever page the router has since navigated to.
  useEffect(() => cancelPending, [cancelPending]);

  const replaceUrl = useCallback(
    (newUrl: string): void => {
      cancelPending();
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        history.replaceState(null, "", newUrl);
      }, REPLACE_STATE_DEBOUNCE_MS);
    },
    [cancelPending],
  );

  const replaceUrlNow = useCallback(
    (newUrl: string): void => {
      cancelPending();
      history.replaceState(null, "", newUrl);
    },
    [cancelPending],
  );

  return { replaceUrl, replaceUrlNow };
}
