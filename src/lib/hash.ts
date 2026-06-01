export const SHA_ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
export const ALGOS = ["MD5", ...SHA_ALGOS] as const;

export function md5(bytes: Uint8Array): string {
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5,
    9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11,
    16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10,
    15, 21,
  ];
  const T = Array.from(
    { length: 64 },
    (_, i) => (Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0,
  );

  const msgLen = bytes.length;
  const padLen = msgLen % 64 < 56 ? 56 - (msgLen % 64) : 120 - (msgLen % 64);
  const padded = new Uint8Array(msgLen + padLen + 8);

  padded.set(bytes);
  padded[msgLen] = 0x80;
  const dv = new DataView(padded.buffer);

  dv.setUint32(msgLen + padLen, (msgLen * 8) >>> 0, true);
  dv.setUint32(msgLen + padLen + 4, Math.floor(msgLen / 0x20000000), true);

  let a0 = 0x67452301,
    b0 = 0xefcdab89,
    c0 = 0x98badcfe,
    d0 = 0x10325476;

  for (let off = 0; off < padded.length; off += 64) {
    const M = Array.from({ length: 16 }, (_, i) =>
      dv.getUint32(off + i * 4, true),
    );
    let a = a0,
      b = b0,
      c = c0,
      d = d0;

    for (let i = 0; i < 64; i++) {
      let f: number, g: number;

      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      f = (f + a + T[i] + M[g]) >>> 0;
      a = d;
      d = c;
      c = b;
      b = (b + ((f << S[i]) | (f >>> (32 - S[i])))) >>> 0;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const out = new Uint8Array(16);
  const odv = new DataView(out.buffer);

  odv.setUint32(0, a0, true);
  odv.setUint32(4, b0, true);
  odv.setUint32(8, c0, true);
  odv.setUint32(12, d0, true);

  return Array.from(out)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashBytes(buffer: ArrayBuffer): Promise<Record<string, string>> {
  const bytes = new Uint8Array(buffer);
  const results: Record<string, string> = {};

  results.MD5 = md5(bytes);
  for (const algo of SHA_ALGOS) {
    const buf = await crypto.subtle.digest(algo, buffer);

    results[algo] = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  return results;
}

export async function hashText(text: string): Promise<Record<string, string>> {
  const encoded = new TextEncoder().encode(text);

  return hashBytes(encoded.buffer);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1073741824) return `${(n / 1048576).toFixed(1)} MB`;

  return `${(n / 1073741824).toFixed(1)} GB`;
}
