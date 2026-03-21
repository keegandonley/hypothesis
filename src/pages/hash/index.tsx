import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/hash.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

const SHA_ALGOS = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;
const ALGOS = ["MD5", ...SHA_ALGOS] as const;

// Pure-JS MD5 (no dependencies). RFC 1321.
function md5(bytes: Uint8Array): string {
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const T = Array.from({ length: 64 }, (_, i) =>
    (Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0
  );

  const msgLen = bytes.length;
  const padLen = msgLen % 64 < 56 ? 56 - (msgLen % 64) : 120 - (msgLen % 64);
  const padded = new Uint8Array(msgLen + padLen + 8);
  padded.set(bytes);
  padded[msgLen] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(msgLen + padLen, (msgLen * 8) >>> 0, true);
  dv.setUint32(msgLen + padLen + 4, Math.floor(msgLen / 0x20000000), true);

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (let off = 0; off < padded.length; off += 64) {
    const M = Array.from({ length: 16 }, (_, i) => dv.getUint32(off + i * 4, true));
    let a = a0, b = b0, c = c0, d = d0;
    for (let i = 0; i < 64; i++) {
      let f: number, g: number;
      if (i < 16)      { f = (b & c) | (~b & d); g = i; }
      else if (i < 32) { f = (d & b) | (~d & c); g = (5 * i + 1) % 16; }
      else if (i < 48) { f = b ^ c ^ d;           g = (3 * i + 5) % 16; }
      else             { f = c ^ (b | ~d);         g = (7 * i) % 16; }
      f = (f + a + T[i] + M[g]) >>> 0;
      a = d; d = c; c = b;
      b = (b + ((f << S[i]) | (f >>> (32 - S[i])))) >>> 0;
    }
    a0 = (a0 + a) >>> 0; b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0; d0 = (d0 + d) >>> 0;
  }

  const out = new Uint8Array(16);
  const odv = new DataView(out.buffer);
  odv.setUint32(0, a0, true); odv.setUint32(4, b0, true);
  odv.setUint32(8, c0, true); odv.setUint32(12, d0, true);
  return Array.from(out).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hashText(text: string): Promise<Record<string, string>> {
  const encoded = new TextEncoder().encode(text);
  const results: Record<string, string> = {};
  results["MD5"] = md5(encoded);
  for (const algo of SHA_ALGOS) {
    const buf = await crypto.subtle.digest(algo, encoded);
    results[algo] = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return results;
}

export default function HashPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});
  const [copiedAlgo, setCopiedAlgo] = useState<string | null>(null);
  const [permalinkCopied, setPermalinkCopied] = useState(false);
  const [url, setUrl] = useState("");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const permalinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildUrl = (val: string) => {
    if (!val) return `${window.location.origin}${window.location.pathname}`;
    return `${window.location.origin}${window.location.pathname}?value=${encodeURIComponent(val)}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("value");
    if (v) {
      setInput(v);
      hashText(v).then(setHashes);
    }
    setUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!input) {
      setHashes({});
      return;
    }
    hashText(input).then(setHashes);
  }, [input]);

  const handleInputChange = (value: string) => {
    setInput(value);
    const newUrl = buildUrl(value);
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleReset = () => {
    setInput("");
    setHashes({});
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleCopyHash = (algo: string) => {
    const value = hashes[algo];
    if (!value) return;
    copyToClipboard(value).then(() => {
      setCopiedAlgo(algo);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedAlgo(null), 1500);
    });
  };

  const handleCopyPermalink = () => {
    copyToClipboard(url).then(() => {
      setPermalinkCopied(true);
      if (permalinkTimeoutRef.current) clearTimeout(permalinkTimeoutRef.current);
      permalinkTimeoutRef.current = setTimeout(() => setPermalinkCopied(false), 1500);
    });
  };

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — HASH GENERATOR`}</title>
        <meta name="description" content="Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from any text input, entirely in your browser." />
        <meta property="og:title" content="Hash Generator" />
        <meta property="og:description" content="Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from any text input, entirely in your browser." />
        <meta property="og:url" content="https://hypothesis.sh/hash" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Hash Generator" />
        <meta name="twitter:description" content="Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from any text input, entirely in your browser." />
        <link rel="canonical" href="https://hypothesis.sh/hash" />
      </Head>

      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <Link
            href="/"
            target={isIframe ? "_blank" : undefined}
            rel={isIframe ? "noopener noreferrer" : undefined}
            className={styles.domainLink}
          >
            {branding.domain}
          </Link>
          {"·"}
          <Link
            href="/docs/hash"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>Hash Generator</h1>
        <p className={styles.tagline}>
          Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from any text input
        </p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.inputPanel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelLabel}>Input</span>
        </div>
        <textarea
          className={styles.textarea}
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Enter text to hash..."
          spellCheck={false}
        />
      </div>

      <div className={styles.hashList}>
        {ALGOS.map((algo) => {
          const value = hashes[algo] ?? "";
          const isCopied = copiedAlgo === algo;
          return (
            <div key={algo} className={styles.hashRow}>
              <span className={styles.algoLabel}>{algo}</span>
              <span
                className={`${styles.hashValue}${!value ? ` ${styles.hashValueEmpty}` : ""}`}
              >
                {value || "—"}
              </span>
              <button
                className={`${styles.copyBtn}${isCopied ? ` ${styles.copied}` : ""}`}
                onClick={() => handleCopyHash(algo)}
                disabled={!value}
              >
                {isCopied ? "Copied!" : "Copy"}
              </button>
            </div>
          );
        })}
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow}>
        <span className={styles.fieldLabel}>Permalink</span>
        <span className={styles.permalinkUrl}>{url}</span>
        {!isIframe && (
          <button
            className={`${styles.copyBtn}${permalinkCopied ? ` ${styles.copied}` : ""}`}
            onClick={handleCopyPermalink}
          >
            {permalinkCopied ? "Copied!" : "Copy"}
          </button>
        )}
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
