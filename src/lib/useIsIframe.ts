import { useState } from "react";

export function useIsIframe(): boolean {
  const [isIframe] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      if (window.name === "work-embed") return false;

      return window.self !== window.top;
    } catch {
      return true;
    }
  });

  return isIframe;
}
