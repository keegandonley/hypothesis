import { useState, useEffect } from "react";

export function useIsIframe(): boolean {
  const [isIframe, setIsIframe] = useState(false);
  useEffect(() => {
    try {
      // When embedded in the work page, behave as if not in an iframe
      // so copy buttons remain visible (clipboard is handled via postMessage)
      if (window.name === "work-embed") {
        setIsIframe(false);
        return;
      }
      setIsIframe(window.self !== window.top);
    } catch {
      // Cross-origin parent — accessing window.top threw, so we're inside an iframe
      setIsIframe(true);
    }
  }, []);
  return isIframe;
}
