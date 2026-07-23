import { getWorkTabId } from "@/lib/useWork";

export function copyToClipboard(text: string): Promise<void> {
  try {
    if (window.name === "work-embed" && window.self !== window.top) {
      // tabId proves this message comes from a real /work tab: /work rejects
      // clipboard-write without it, since iframe-proxy transparently relays
      // arbitrary third-party messages that must not reach the clipboard.
      window.parent.postMessage(
        { type: "clipboard-write", text, tabId: getWorkTabId() },
        "*",
      );

      return Promise.resolve();
    }
  } catch {
    // cross-origin check threw — not in work-embed
  }

  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }

  return new Promise((resolve) => {
    const el = document.createElement("textarea");

    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    /* eslint-disable-next-line @typescript-eslint/no-deprecated -- clipboard API fallback */
    document.execCommand("copy");
    document.body.removeChild(el);
    resolve();
  });
}
