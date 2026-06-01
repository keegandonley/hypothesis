export function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";

  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary);
}

export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return bytes.buffer;
}

export function wrapPem(b64: string, label: string): string {
  const lines: string[] = [];

  for (let i = 0; i < b64.length; i += 64) lines.push(b64.slice(i, i + 64));

  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}

export function parsePemBody(pem: string): ArrayBuffer | null {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s/g, "");

  if (!b64) return null;
  try {
    return base64ToArrayBuffer(b64);
  } catch {
    return null;
  }
}
