import type { NextApiRequest, NextApiResponse } from "next";
import dns from "node:dns/promises";
import net from "node:net";

// Fetches a remote URL's response headers and returns only the
// CSP-relevant ones. This is the single server hop the CSP analyzer needs:
// browsers cannot read cross-origin response headers (CORS), so the retrieval
// must happen here. The analysis itself still runs client-side.
//
// Because this endpoint fetches user-supplied URLs, it is a classic SSRF
// vector. It is locked down to http/https, blocks private/loopback/link-local
// destinations (including after DNS resolution and on every redirect hop), caps
// redirects, times out quickly, and never reads or returns the response body.

const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 6000;

export interface CspFetchResult {
  requestedUrl: string;
  finalUrl: string;
  status: number;
  csp: string | null;
  cspReportOnly: string | null;
  related: Record<string, string>;
}

interface ErrorResult {
  error: string;
}

/** True for IPs that must never be reachable through this proxy. */
function isBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);

    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // private
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64/10
    if (a === 192 && b === 0) return true; // 192.0.0/24 special-use
    if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
    if (a >= 224) return true; // multicast / reserved

    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();

    if (lower === "::1" || lower === "::") return true; // loopback / unspecified
    if (lower.startsWith("fe8") || lower.startsWith("fe9")) return true; // link-local
    if (lower.startsWith("fea") || lower.startsWith("feb")) return true; // link-local
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA fc00::/7

    // IPv4-mapped (::ffff:a.b.c.d) — re-check the embedded v4 address.
    const mapped = /::ffff:(\d+\.\d+\.\d+\.\d+)/.exec(lower);

    if (mapped) return isBlockedIp(mapped[1]);

    return false;
  }

  return true; // not a recognisable IP — refuse
}

/** Validate scheme + host, then resolve DNS and ensure no address is blocked. */
async function assertSafeUrl(raw: string): Promise<URL> {
  let parsed: URL;

  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported");
  }

  const host = parsed.hostname.toLowerCase();

  if (host === "localhost" || host.endsWith(".localhost")) {
    throw new Error("Refusing to fetch a localhost address");
  }

  // If the host is a literal IP, check it directly.
  if (net.isIP(host) && isBlockedIp(host)) {
    throw new Error("Refusing to fetch a private or reserved address");
  }

  // Otherwise resolve and check every returned address.
  if (!net.isIP(host)) {
    let records: { address: string }[];

    try {
      records = await dns.lookup(host, { all: true });
    } catch {
      throw new Error("Could not resolve host");
    }

    if (records.some((r) => isBlockedIp(r.address))) {
      throw new Error("Host resolves to a private or reserved address");
    }
  }

  return parsed;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CspFetchResult | ErrorResult>,
): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });

    return;
  }

  const { url } = req.query;

  if (typeof url !== "string" || !url) {
    res.status(400).json({ error: "Missing required query param: url" });

    return;
  }

  let current = url;
  let response: Response | null = null;

  try {
    // Follow redirects manually so each hop is re-validated against the
    // blocklist (guards against redirect-based SSRF and DNS rebinding).
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const safe = await assertSafeUrl(current);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      try {
        response = await fetch(safe.toString(), {
          method: "GET",
          redirect: "manual",
          signal: controller.signal,
          headers: { "User-Agent": "hypothesis.sh CSP analyzer" },
        });
      } finally {
        clearTimeout(timer);
      }

      if (response.status >= 300 && response.status < 400) {
        await response.body?.cancel();
        const location = response.headers.get("location");

        if (!location) break;
        if (hop === MAX_REDIRECTS) {
          res.status(502).json({ error: "Too many redirects" });

          return;
        }

        current = new URL(location, safe).toString();

        continue;
      }

      break;
    }
  } catch (err) {
    res
      .status(400)
      .json({ error: err instanceof Error ? err.message : "Fetch failed" });

    return;
  }

  if (!response) {
    res.status(502).json({ error: "No response from target" });

    return;
  }

  const related: Record<string, string> = {};

  for (const name of [
    "x-frame-options",
    "strict-transport-security",
    "x-content-type-options",
    "referrer-policy",
    "reporting-endpoints",
    "report-to",
  ]) {
    const value = response.headers.get(name);

    if (value) related[name] = value;
  }

  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    requestedUrl: url,
    finalUrl: current,
    status: response.status,
    csp: response.headers.get("content-security-policy"),
    cspReportOnly: response.headers.get(
      "content-security-policy-report-only",
    ),
    related,
  });
}
