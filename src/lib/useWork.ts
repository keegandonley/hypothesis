import { useEffect } from "react";

export function useWork(): void {
  useEffect(() => {
    if (window.name !== "work-embed") return;

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
        window.parent.postMessage({ type: "url-update", url: window.location.href }, "*");
      } catch {}
    };

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      history.replaceState = origReplaceState;
    };
  }, []);
}
