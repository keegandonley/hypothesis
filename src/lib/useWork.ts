import { useEffect } from "react";

// The tabId /work issued to this embed, captured at mount. It doubles as an
// auth token for privileged messages (clipboard-write): /work only honors
// them when the sender proves it knows its own randomUUID tabId — a page
// merely relayed through iframe-proxy never sees it.
let workTabId = "";

export function getWorkTabId(): string {
  if (workTabId) return workTabId;

  // Lazy fallback for calls that land before _app's useWork effect has
  // cached the value (child effects fire before parent effects). After a
  // replaceState strips the param this returns "", so the cached value
  // above is the reliable source for the rest of the session.
  try {
    return new URLSearchParams(window.location.search).get("tabId") ?? "";
  } catch {
    return "";
  }
}

export function useWork(): void {
  useEffect(() => {
    if (window.name !== "work-embed") return;

    // Capture tabId from URL at mount time (before any replaceState strips it)
    const tabId =
      new URLSearchParams(window.location.search).get("tabId") ?? "";

    workTabId = tabId;

    function onKeyDown(e: KeyboardEvent): void {
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
        window.parent.postMessage(
          { type: "url-update", url: window.location.href, tabId },
          "*",
        );
      } catch {}
    };

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      history.replaceState = origReplaceState;
    };
  }, []);
}
