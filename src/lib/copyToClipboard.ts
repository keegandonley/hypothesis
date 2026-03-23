export function copyToClipboard(text: string): Promise<void> {
  try {
    if (window.name === "work-embed" && window.self !== window.top) {
      window.parent.postMessage({ type: "clipboard-write", text }, "*");
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
    document.execCommand("copy");
    document.body.removeChild(el);
    resolve();
  });
}
