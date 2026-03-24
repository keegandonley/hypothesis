import { useEffect } from "react";

export function useWork(): void {
  useEffect(() => {
    if (window.name !== "work-embed") return;

    // Capture tabId from URL at mount time (before any replaceState strips it)
    const tabId = new URLSearchParams(window.location.search).get("tabId") ?? "";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        window.parent.postMessage({ type: "focus-search" }, "*");
      }
    }

    window.addEventListener("keydown", onKeyDown);

    const origReplaceState = history.replaceState.bind(history);
    history.replaceState = function (state, title, url) {
      origReplaceState(state, title, url);
      try {
        window.parent.postMessage({ type: "url-update", url: window.location.href, tabId }, "*");
      } catch {}
    };

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      history.replaceState = origReplaceState;
    };
  }, []);
}
