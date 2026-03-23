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
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
