import { useEffect, useState } from "react";

interface PermissionsPolicyLike {
  allowsFeature(feature: string): boolean;
}

/**
 * Whether copy-to-clipboard UI should be shown.
 *
 * Top-level pages and work-mode embeds (which relay through /work) can
 * always copy. In any other iframe, clipboard access depends on the host
 * granting `clipboard-write` via Permissions-Policy — so copy UI is shown
 * only when that grant can be proven. When no detection API exists the
 * button stays hidden: a visibly failing Copy button is worse than none.
 */
export function useCanCopy(): boolean {
  const [canCopy, setCanCopy] = useState<boolean>(() => {
    // SSR matches the top-level default (mirrors useIsIframe's shape).
    if (typeof window === "undefined") return true;
    if (window.name === "work-embed") return true;

    try {
      if (window.self === window.top) return true;
    } catch {
      // cross-origin access threw — definitely embedded
    }

    // Chromium exposes the host's delegation synchronously.
    const permissionsPolicy = (
      document as Document & { permissionsPolicy?: PermissionsPolicyLike }
    ).permissionsPolicy;

    if (permissionsPolicy) {
      return permissionsPolicy.allowsFeature("clipboard-write");
    }

    return false;
  });

  // Async fallback probe for engines with a Permissions API but no
  // document.permissionsPolicy. Browsers that reject the name (Safari,
  // Firefox) land in catch and the button simply stays hidden.
  useEffect(() => {
    if (canCopy) return;

    let cancelled = false;

    navigator.permissions
      // "clipboard-write" is a real Chromium permission name missing from
      // TS's PermissionName union.
      ?.query({ name: "clipboard-write" as PermissionName })
      .then((status) => {
        if (!cancelled && status.state !== "denied") setCanCopy(true);
      })
      .catch(() => {
        // cannot determine — leave hidden
      });

    return () => {
      cancelled = true;
    };
  }, [canCopy]);

  return canCopy;
}
