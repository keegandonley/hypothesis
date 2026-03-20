import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/rsa.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

// ── Helpers ────────────────────────────────────────────────────────────────────

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function wrapPem(b64: string, label: string): string {
  const lines: string[] = [];
  for (let i = 0; i < b64.length; i += 64) lines.push(b64.slice(i, i + 64));
  return `-----BEGIN ${label}-----\n${lines.join("\n")}\n-----END ${label}-----`;
}

function parsePemBody(pem: string): ArrayBuffer | null {
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

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RsaPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();

  // Key pair
  const [encryptKey, setEncryptKey] = useState<CryptoKey | null>(null);
  const [decryptKey, setDecryptKey] = useState<CryptoKey | null>(null);
  const [publicKeyPem, setPublicKeyPem] = useState("");
  const [privateKeyPem, setPrivateKeyPem] = useState("");
  const [pubKeyImportError, setPubKeyImportError] = useState<string | null>(null);
  const [privKeyImportError, setPrivKeyImportError] = useState<string | null>(null);

  // Step 2
  const [plaintext, setPlaintext] = useState("Hello, RSA!");
  const [ciphertext, setCiphertext] = useState("");
  const [ciphertextFromUrl, setCiphertextFromUrl] = useState(false);

  // Step 3
  const [decrypted, setDecrypted] = useState("");
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [wrongKeyError, setWrongKeyError] = useState<string | null>(null);
  const [wrongPrivKeyPem, setWrongPrivKeyPem] = useState("");

  // Timing
  const [keyGenMs, setKeyGenMs] = useState<number | null>(null);
  const [encryptMs, setEncryptMs] = useState<number | null>(null);
  const [decryptMs, setDecryptMs] = useState<number | null>(null);

  // Loading flags
  const [generatingKey, setGeneratingKey] = useState(false);
  const [encrypting, setEncrypting] = useState(false);
  const [decrypting, setDecrypting] = useState(false);
  const [tryingWrongKey, setTryingWrongKey] = useState(false);

  const [cryptoAvailable, setCryptoAvailable] = useState(true);

  // Copy state
  const [copiedPub, setCopiedPub] = useState(false);
  const [copiedPriv, setCopiedPriv] = useState(false);
  const [copiedCt, setCopiedCt] = useState(false);
  const [permalinkCopied, setPermalinkCopied] = useState(false);
  const [url, setUrl] = useState("");

  // Ciphertext textarea value (for step 3)
  const [ctInput, setCtInput] = useState("");

  const pubTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const privTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ctTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const permalinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const plaintextBytes = new TextEncoder().encode(plaintext).length;

  // Restore from URL and localStorage on mount
  useEffect(() => {
    if (!window.crypto?.subtle) setCryptoAvailable(false);
    const params = new URLSearchParams(window.location.search);
    const ct = params.get("ct");
    if (ct) {
      setCiphertext(ct);
      setCtInput(ct);
      setCiphertextFromUrl(true);
    }
    setUrl(window.location.href);

    const savedPub = localStorage.getItem("rsa_public_key");
    const savedPriv = localStorage.getItem("rsa_private_key");
    if (savedPub) setPublicKeyPem(savedPub);
    if (savedPriv) setPrivateKeyPem(savedPriv);
  }, []);

  // Import public key whenever PEM changes
  useEffect(() => {
    if (!publicKeyPem.includes("-----END PUBLIC KEY-----")) {
      setEncryptKey(null);
      setPubKeyImportError(null);
      return;
    }
    const buf = parsePemBody(publicKeyPem);
    if (!buf) { setPubKeyImportError("Could not parse PEM"); return; }
    window.crypto.subtle
      .importKey("spki", buf, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"])
      .then((key) => { setEncryptKey(key); setPubKeyImportError(null); })
      .catch((e) => { setEncryptKey(null); setPubKeyImportError(e instanceof Error ? e.message : String(e)); });
  }, [publicKeyPem]);

  // Import private key whenever PEM changes
  useEffect(() => {
    if (!privateKeyPem.includes("-----END PRIVATE KEY-----")) {
      setDecryptKey(null);
      setPrivKeyImportError(null);
      return;
    }
    const buf = parsePemBody(privateKeyPem);
    if (!buf) { setPrivKeyImportError("Could not parse PEM"); return; }
    window.crypto.subtle
      .importKey("pkcs8", buf, { name: "RSA-OAEP", hash: "SHA-256" }, true, ["decrypt"])
      .then((key) => { setDecryptKey(key); setPrivKeyImportError(null); })
      .catch((e) => { setDecryptKey(null); setPrivKeyImportError(e instanceof Error ? e.message : String(e)); });
  }, [privateKeyPem]);

  const buildUrl = (ct: string) => {
    const base = `${window.location.origin}${window.location.pathname}`;
    if (!ct) return base;
    return `${base}?ct=${encodeURIComponent(ct)}`;
  };

  // ── Step 1: Generate key pair ──────────────────────────────────────────────

  async function handleGenerate() {
    setGeneratingKey(true);
    setPublicKeyPem("");
    setPrivateKeyPem("");
    setCiphertext("");
    setCtInput("");
    setDecrypted("");
    setDecryptError(null);
    setWrongKeyError(null);
    setWrongPrivKeyPem("");
    setKeyGenMs(null);
    setEncryptMs(null);
    setDecryptMs(null);
    try {
      const t0 = performance.now();
      const kp = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"],
      );
      const t1 = performance.now();
      setKeyGenMs(Math.round(t1 - t0));

      const pubSpki = await window.crypto.subtle.exportKey("spki", kp.publicKey);
      const privPkcs8 = await window.crypto.subtle.exportKey("pkcs8", kp.privateKey);

      const pubPem = wrapPem(arrayBufferToBase64(pubSpki), "PUBLIC KEY");
      const privPem = wrapPem(arrayBufferToBase64(privPkcs8), "PRIVATE KEY");
      setPublicKeyPem(pubPem);
      setPrivateKeyPem(privPem);
      localStorage.setItem("rsa_public_key", pubPem);
      localStorage.setItem("rsa_private_key", privPem);
    } finally {
      setGeneratingKey(false);
    }
  }

  // ── Step 2: Encrypt ────────────────────────────────────────────────────────

  async function handleEncrypt() {
    if (!encryptKey || plaintextBytes > 190) return;
    setEncrypting(true);
    setDecrypted("");
    setDecryptError(null);
    setWrongKeyError(null);
    try {
      const t0 = performance.now();
      const enc = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        encryptKey,
        new TextEncoder().encode(plaintext),
      );
      const t1 = performance.now();
      setEncryptMs(Math.round(t1 - t0));

      const b64 = arrayBufferToBase64(enc);
      setCiphertext(b64);
      setCtInput(b64);
      setCiphertextFromUrl(false);
      const newUrl = buildUrl(b64);
      history.replaceState(null, "", newUrl);
      setUrl(newUrl);
    } finally {
      setEncrypting(false);
    }
  }

  // ── Step 3: Decrypt ────────────────────────────────────────────────────────

  async function handleDecrypt() {
    if (!decryptKey || !ctInput.trim()) return;
    setDecrypting(true);
    setDecrypted("");
    setDecryptError(null);
    setWrongKeyError(null);
    setWrongPrivKeyPem("");
    try {
      const t0 = performance.now();
      const dec = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        decryptKey,
        base64ToArrayBuffer(ctInput.trim()),
      );
      const t1 = performance.now();
      setDecryptMs(Math.round(t1 - t0));
      setDecrypted(new TextDecoder().decode(dec));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setDecryptError(msg || "Decryption failed (no message)");
    } finally {
      setDecrypting(false);
    }
  }

  async function handleTryWrongKey() {
    if (!ctInput.trim()) return;
    setTryingWrongKey(true);
    setDecrypted("");
    setDecryptError(null);
    setWrongKeyError(null);
    setWrongPrivKeyPem("");
    try {
      const wrongKp = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"],
      );
      const wrongPrivPkcs8 = await window.crypto.subtle.exportKey("pkcs8", wrongKp.privateKey);
      setWrongPrivKeyPem(wrapPem(arrayBufferToBase64(wrongPrivPkcs8), "PRIVATE KEY"));
      await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        wrongKp.privateKey,
        base64ToArrayBuffer(ctInput.trim()),
      );
      // If it somehow succeeded (shouldn't happen)
      setWrongKeyError("Unexpected: decryption succeeded with wrong key.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setWrongKeyError(msg || "Decryption failed (no message)");
    } finally {
      setTryingWrongKey(false);
    }
  }

  // ── Copy helpers ───────────────────────────────────────────────────────────

  function copyWithTimeout(
    text: string,
    setter: (v: boolean) => void,
    ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  ) {
    copyToClipboard(text).then(() => {
      setter(true);
      if (ref.current) clearTimeout(ref.current);
      ref.current = setTimeout(() => setter(false), 1500);
    });
  }

  function handleReset() {
    setCiphertext("");
    setCtInput("");
    setDecrypted("");
    setDecryptError(null);
    setWrongKeyError(null);
    setWrongPrivKeyPem("");
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  }

  const byteRatio = plaintextBytes / 190;

  return (
    <div className={styles.page}>
      <Head>
        <title>{branding.name.toUpperCase()} — RSA ENCRYPTION</title>
        <meta
          name="description"
          content="Interactive RSA-OAEP encryption experiment. Generate a key pair, encrypt a message, and decrypt it — all in-browser using the Web Crypto API."
        />
        <meta property="og:title" content="RSA Encryption" />
        <meta
          property="og:description"
          content="Interactive RSA-OAEP encryption experiment using the Web Crypto API."
        />
        <meta property="og:url" content="https://hypothesis.sh/rsa" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="RSA Encryption" />
        <link rel="canonical" href="https://hypothesis.sh/rsa" />
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
            href="/docs/rsa"
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>RSA Encryption</h1>
        <p className={styles.tagline}>
          EXP-005 · Interactive RSA-OAEP public-key encryption using the Web Crypto API
        </p>
      </div>

      <hr className={styles.divider} />

      {!cryptoAvailable && (
        <div className={styles.errorPanel} style={{ marginBottom: "1.5rem" }}>
          <div className={styles.errorTitle}>Web Crypto API unavailable</div>
          <div className={styles.errorMsg}>
            This experiment requires a secure context (HTTPS or localhost). The Web Crypto API is not available on plain HTTP origins.
          </div>
        </div>
      )}

      {/* ── Step 1 ── */}
      <div className={styles.step}>
        <div className={styles.stepHeader}>
          <span className={styles.stepBadge}>Step 1</span>
          <span className={styles.stepTitle}>Generate Key Pair</span>
          {keyGenMs !== null && (
            <span className={styles.timingBadge}>generated in {keyGenMs}ms</span>
          )}
        </div>

        <button
          className={styles.primaryBtn}
          onClick={handleGenerate}
          disabled={generatingKey || !cryptoAvailable}
        >
          {generatingKey ? "Generating…" : "Generate RSA-OAEP Key Pair"}
        </button>

        <div className={styles.keyPanels}>
          {/* Public key */}
          <div className={styles.keyPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>Public Key</span>
              {!isIframe && publicKeyPem && (
                <button
                  className={`${styles.copyBtn}${copiedPub ? ` ${styles.copied}` : ""}`}
                  onClick={() =>
                    copyWithTimeout(publicKeyPem, setCopiedPub, pubTimeoutRef)
                  }
                >
                  {copiedPub ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <textarea
              className={styles.keyTextarea}
              value={publicKeyPem}
              onChange={(e) => setPublicKeyPem(e.target.value)}
              placeholder="Paste a PEM public key, or generate one above…"
              spellCheck={false}
            />
            {pubKeyImportError && publicKeyPem && (
              <div className={styles.errorMsg}>{pubKeyImportError}</div>
            )}
            <div className={styles.annotation}>
              Share freely — only encrypts, never decrypts.
            </div>
          </div>

          {/* Private key */}
          <div className={styles.keyPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>Private Key</span>
              {!isIframe && privateKeyPem && (
                <button
                  className={`${styles.copyBtn}${copiedPriv ? ` ${styles.copied}` : ""}`}
                  onClick={() =>
                    copyWithTimeout(privateKeyPem, setCopiedPriv, privTimeoutRef)
                  }
                >
                  {copiedPriv ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <textarea
              className={`${styles.keyTextarea} ${styles.privateKeyTextarea}`}
              value={privateKeyPem}
              onChange={(e) => setPrivateKeyPem(e.target.value)}
              placeholder="Paste a PEM private key, or generate one above…"
              spellCheck={false}
            />
            {privKeyImportError && privateKeyPem && (
              <div className={styles.errorMsg}>{privKeyImportError}</div>
            )}
            <div className={styles.annotation}>
              Keep secret — this is the only key that can decrypt.
            </div>
          </div>
        </div>

        {(encryptKey || decryptKey) && (
          <div className={styles.infoBox}>
            Algorithm: RSA-OAEP · Hash: SHA-256 · Key size: 2048 bits · Public exponent: 65537
          </div>
        )}
      </div>

      <hr className={styles.divider} />

      {/* ── Step 2 ── */}
      <div className={styles.step}>
        <div className={styles.stepHeader}>
          <span className={styles.stepBadge}>Step 2</span>
          <span className={styles.stepTitle}>Encrypt</span>
          {encryptMs !== null && (
            <span className={styles.timingBadge}>encrypted in {encryptMs}ms</span>
          )}
        </div>

        <div className={styles.inputPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Plaintext</span>
            <span
              className={`${styles.byteCounter}${plaintextBytes > 190 ? ` ${styles.byteCounterOver}` : ""}`}
            >
              {plaintextBytes} / 190 bytes
              {plaintextBytes > 190 && " — too long"}
            </span>
          </div>
          <div className={styles.byteBar}>
            <div
              className={`${styles.byteBarFill}${byteRatio > 1 ? ` ${styles.byteBarOver}` : ""}`}
              style={{ width: `${Math.min(byteRatio * 100, 100)}%` }}
            />
          </div>
          <textarea
            className={styles.textarea}
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
            placeholder="Enter plaintext to encrypt…"
            spellCheck={false}
          />
        </div>

        <button
          className={styles.primaryBtn}
          onClick={handleEncrypt}
          disabled={!cryptoAvailable || !encryptKey || plaintextBytes > 190 || encrypting}
        >
          {encrypting ? "Encrypting…" : "Encrypt with Public Key"}
        </button>

        {!encryptKey && (
          <div className={styles.annotation}>Add a public key in Step 1 first.</div>
        )}

        {ciphertext && (
          <div className={styles.outputPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>Ciphertext (base64)</span>
              {!isIframe && (
                <button
                  className={`${styles.copyBtn}${copiedCt ? ` ${styles.copied}` : ""}`}
                  onClick={() =>
                    copyWithTimeout(ciphertext, setCopiedCt, ctTimeoutRef)
                  }
                >
                  {copiedCt ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <div className={styles.ciphertextOutput}>{ciphertext}</div>
            <div className={styles.annotation}>
              Always 344 base64 chars (256 bytes) regardless of input length — RSA-OAEP 2048 produces a fixed-size block.
            </div>
          </div>
        )}
      </div>

      <hr className={styles.divider} />

      {/* ── Step 3 ── */}
      <div className={styles.step}>
        <div className={styles.stepHeader}>
          <span className={styles.stepBadge}>Step 3</span>
          <span className={styles.stepTitle}>Decrypt</span>
          {decryptMs !== null && (
            <span className={styles.timingBadge}>decrypted in {decryptMs}ms</span>
          )}
        </div>

        {ciphertextFromUrl && (
          <div className={styles.urlNote}>
            Ciphertext loaded from URL. Generate a key pair to decrypt, or paste your own ciphertext.
          </div>
        )}

        <div className={styles.inputPanel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Ciphertext (base64)</span>
          </div>
          <textarea
            className={styles.textarea}
            value={ctInput}
            onChange={(e) => setCtInput(e.target.value)}
            placeholder="Paste base64 ciphertext here, or encrypt something in Step 2…"
            spellCheck={false}
          />
        </div>

        <div className={styles.decryptBtns}>
          <button
            className={styles.primaryBtn}
            onClick={handleDecrypt}
            disabled={!cryptoAvailable || !decryptKey || !ctInput.trim() || decrypting}
          >
            {decrypting ? "Decrypting…" : "Decrypt with Private Key"}
          </button>
          <button
            className={styles.dangerBtn}
            onClick={handleTryWrongKey}
            disabled={!cryptoAvailable || !ctInput.trim() || tryingWrongKey}
          >
            {tryingWrongKey ? "Generating wrong key…" : "Try with Wrong Key"}
          </button>
        </div>

        {!decryptKey && (
          <div className={styles.annotation}>
            Add a private key in Step 1 to enable decryption.
          </div>
        )}

        {decrypted && (
          <div className={styles.outputPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>Decrypted</span>
            </div>
            <div className={styles.decryptedOutput}>{decrypted}</div>
          </div>
        )}

        {decryptError !== null && (
          <div className={styles.errorPanel}>
            <div className={styles.errorTitle}>Decryption failed</div>
            <div className={styles.errorMsg}>{decryptError}</div>
            <div className={styles.annotation}>
              The ciphertext may have been tampered with, or the wrong key was used.
            </div>
          </div>
        )}

        {wrongKeyError !== null && (
          <div className={styles.errorPanel}>
            <div className={styles.errorTitle}>Wrong key — decryption failed (expected)</div>
            <div className={styles.errorMsg}>{wrongKeyError}</div>
            <div className={styles.annotation}>
              This is the expected result. Without the matching private key, decryption is computationally infeasible — RSA security relies on the hardness of factoring large primes.
            </div>
            {wrongPrivKeyPem && (
              <>
                <div className={styles.annotation} style={{ marginTop: "6px" }}>
                  Wrong private key used (freshly generated, unrelated to the encrypting key pair):
                </div>
                <textarea
                  className={`${styles.keyTextarea} ${styles.privateKeyTextarea}`}
                  value={wrongPrivKeyPem}
                  readOnly
                  spellCheck={false}
                />
              </>
            )}
          </div>
        )}
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow}>
        <span className={styles.fieldLabel}>Permalink</span>
        <span className={styles.permalinkUrl}>{url}</span>
        {!isIframe && (
          <button
            className={`${styles.copyBtn}${permalinkCopied ? ` ${styles.copied}` : ""}`}
            onClick={() =>
              copyWithTimeout(url, setPermalinkCopied, permalinkTimeoutRef)
            }
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
