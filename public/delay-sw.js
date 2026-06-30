// Service worker for the delay-loading experiment.
//
// It intercepts the hidden pixel request (`/api/delay?ms=<n>`) and resolves it
// late entirely in the browser, so the document's `load` event — and any
// embedding iframe's `onload` — is genuinely deferred WITHOUT holding a
// serverless function open. This replaces the server-side sleep in
// `/api/delay`, which billed provisioned memory for the full idle wait on every
// request. Every other request passes straight through untouched.

const MAX_DELAY_MS = 60000;

// 1×1 transparent GIF — identical bytes to the old server response.
const PIXEL_B64 = "R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

function decodePixel() {
  const binary = atob(PIXEL_B64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Decode once at startup rather than on every intercepted request.
const PIXEL_BYTES = decodePixel();

// Activate immediately and take control of open clients so the very next
// document load (after the one-time reload the page performs) is intercepted.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only the delay pixel is handled here; everything else is left alone.
  if (url.origin !== self.location.origin || url.pathname !== "/api/delay") {
    return;
  }

  const parsed = parseInt(url.searchParams.get("ms") || "0", 10);
  const delay = Number.isFinite(parsed)
    ? Math.min(Math.max(parsed, 0), MAX_DELAY_MS)
    : 0;

  event.respondWith(
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          new Response(PIXEL_BYTES, {
            headers: {
              "Content-Type": "image/gif",
              "Cache-Control": "no-store",
            },
          }),
        );
      }, delay);
    }),
  );
});
