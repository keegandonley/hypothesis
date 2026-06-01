export interface JwtParts {
  header: Record<string, unknown> | null;
  payload: Record<string, unknown> | null;
  signature: string;
}

export type ExpiryStatus = "valid" | "expired" | "no-exp";

export function base64urlDecode(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  const padded = pad ? base64 + "=".repeat(4 - pad) : base64;

  return decodeURIComponent(
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    escape(atob(padded)),
  );
}

export function base64urlEncode(str: string): string {
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function decodeJwt(token: string): JwtParts | null {
  const parts = token.split(".");

  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(base64urlDecode(parts[0])) as Record<
      string,
      unknown
    >;
    const payload = JSON.parse(base64urlDecode(parts[1])) as Record<
      string,
      unknown
    >;

    return { header, payload, signature: parts[2] };
  } catch {
    return null;
  }
}

export function getExpiryStatus(
  payload: Record<string, unknown> | null,
): ExpiryStatus {
  if (!payload || !("exp" in payload)) return "no-exp";
  const exp = payload.exp as number;

  return exp < Date.now() / 1000 ? "expired" : "valid";
}

const SAMPLE_NAMES = ["alice", "bob", "carol", "dave", "eve", "frank"];
const SAMPLE_ROLES = ["admin", "user", "editor", "viewer", "moderator"];

export function generateJwt(): string {
  const now = Math.floor(Date.now() / 1000);
  const name = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
  const role = SAMPLE_ROLES[Math.floor(Math.random() * SAMPLE_ROLES.length)];
  const sub = crypto.randomUUID();

  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub,
    name,
    role,
    iat: now,
    exp: now + 3600,
  };

  const headerPart = base64urlEncode(JSON.stringify(header));
  const payloadPart = base64urlEncode(JSON.stringify(payload));

  const sigBytes = new Uint8Array(32);

  crypto.getRandomValues(sigBytes);
  const sigPart = btoa(
    Array.from(sigBytes, (b) => String.fromCharCode(b)).join(""),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return `${headerPart}.${payloadPart}.${sigPart}`;
}
