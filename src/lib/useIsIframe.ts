import { useState, useEffect } from "react";

export function useIsIframe(): boolean {
  const [isIframe, setIsIframe] = useState(false);
  useEffect(() => {
    try {
      setIsIframe(window.self !== window.top);
    } catch {
      // Cross-origin parent — accessing window.top threw, so we're inside an iframe
      setIsIframe(true);
    }
  }, []);
  return isIframe;
}
