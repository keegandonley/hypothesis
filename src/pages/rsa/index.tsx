import { useEffect, useRef, useState } from "react";
import styles from "@/styles/rsa.module.css";
import { CopyButton, PageLayout, PermalinkRow } from "@/components/ui";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/Panel";
import { arrayBufferToBase64, base64ToArrayBuffer, wrapPem, parsePemBody } from "@/lib/rsa";

// ── Page ───────────────────────────────────────────────────────────────────────

export default function RsaPage(): React.ReactNode {


  // Key pair
  const [encryptKey, setEncryptKey] = useState<CryptoKey | null>(null);
  const [decryptKey, setDecryptKey] = useState<CryptoKey | null>(null);
  const [publicKeyPem, setPublicKeyPem] = useState("");
  const [privateKeyPem, setPrivateKeyPem] = useState("");
  const [pubKeyImportError, setPubKeyImportError] = useState<string | null>(
    null,
  );
  const [privKeyImportError, setPrivKeyImportError] = useState<string | null>(
    null,
  );

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

  const [url, setUrl] = useState("");

  // Ciphertext textarea value (for step 3)
  const [ctInput, setCtInput] = useState("");

  const plaintextBytes = new TextEncoder().encode(plaintext).length;

  // Restore from URL and localStorage on mount
  useEffect(() => {
    if (!window.crypto?.subtle) setCryptoAvailable(false); // eslint-disable-line react-hooks/set-state-in-effect
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
      setEncryptKey(null); // eslint-disable-line react-hooks/set-state-in-effect
      setPubKeyImportError(null);

      return;
    }

    const buf = parsePemBody(publicKeyPem);

    if (!buf) {
      setPubKeyImportError("Could not parse PEM");

      return;
    }

    window.crypto.subtle
      .importKey("spki", buf, { name: "RSA-OAEP", hash: "SHA-256" }, true, [
        "encrypt",
      ])
      .then((key: CryptoKey) => {
        setEncryptKey(key);
        setPubKeyImportError(null);
      })
      .catch((e: unknown) => {
        setEncryptKey(null);
        setPubKeyImportError(e instanceof Error ? e.message : String(e));
      });
  }, [publicKeyPem]);

  // Import private key whenever PEM changes
  useEffect(() => {
    if (!privateKeyPem.includes("-----END PRIVATE KEY-----")) {
      setDecryptKey(null); // eslint-disable-line react-hooks/set-state-in-effect
      setPrivKeyImportError(null);

      return;
    }

    const buf = parsePemBody(privateKeyPem);

    if (!buf) {
      setPrivKeyImportError("Could not parse PEM");

      return;
    }

    window.crypto.subtle
      .importKey("pkcs8", buf, { name: "RSA-OAEP", hash: "SHA-256" }, true, [
        "decrypt",
      ])
      .then((key: CryptoKey) => {
        setDecryptKey(key);
        setPrivKeyImportError(null);
      })
      .catch((e: unknown) => {
        setDecryptKey(null);
        setPrivKeyImportError(e instanceof Error ? e.message : String(e));
      });
  }, [privateKeyPem]);

  const buildUrl = (ct: string): string => {
    const base = `${window.location.origin}${window.location.pathname}`;

    if (!ct) return base;

    return `${base}?ct=${encodeURIComponent(ct)}`;
  };

  // ── Step 1: Generate key pair ──────────────────────────────────────────────

  async function handleGenerate(): Promise<void> {
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

      const pubSpki = await window.crypto.subtle.exportKey(
        "spki",
        kp.publicKey,
      );
      const privPkcs8 = await window.crypto.subtle.exportKey(
        "pkcs8",
        kp.privateKey,
      );

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

  async function handleEncrypt(): Promise<void> {
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

  async function handleDecrypt(): Promise<void> {
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

  async function handleTryWrongKey(): Promise<void> {
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
      const wrongPrivPkcs8 = await window.crypto.subtle.exportKey(
        "pkcs8",
        wrongKp.privateKey,
      );

      setWrongPrivKeyPem(
        wrapPem(arrayBufferToBase64(wrongPrivPkcs8), "PRIVATE KEY"),
      );
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

  function handleReset(): void {
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
      <PageLayout
        metaTitle="RSA Encryption"
        metaDescription="Generate RSA key pairs, encrypt, and decrypt messages online. Free online RSA encryption tool — no installation required. No data sent to servers."
        path="/rsa"
        h1="RSA Encryption"
        tagline="EXP-005 · Interactive RSA-OAEP public-key encryption using the Web Crypto API"
      >

      {!cryptoAvailable && (
        <div className={styles.errorPanel} style={{ marginBottom: "1.5rem" }}>
          <div className={styles.errorTitle}>Web Crypto API unavailable</div>
          <div className={styles.errorMsg}>
            This experiment requires a secure context (HTTPS or localhost). The
            Web Crypto API is not available on plain HTTP origins.
          </div>
        </div>
      )}

      {/* ── Step 1 ── */}
      <div className={styles.step}>
        <div className={styles.stepHeader}>
          <span className={styles.stepBadge}>Step 1</span>
          <span className={styles.stepTitle}>Generate Key Pair</span>
          {keyGenMs !== null && (
            <span className={styles.timingBadge}>
              generated in {keyGenMs}ms
            </span>
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
          <Panel>
            <PanelHeader label="Public Key">
              {publicKeyPem && (
                <CopyButton variant="copy" size="sm" value={publicKeyPem} />
              )}
            </PanelHeader>
            <textarea
              className={styles.keyTextarea}
              value={publicKeyPem}
              onChange={(e) => {
                setPublicKeyPem(e.target.value);
              }}
              placeholder="Paste a PEM public key, or generate one above…"
              spellCheck={false}
            />
            {pubKeyImportError && publicKeyPem && (
              <div className={styles.errorMsg}>{pubKeyImportError}</div>
            )}
            <div className={styles.annotation}>
              Share freely — only encrypts, never decrypts.
            </div>
          </Panel>

          {/* Private key */}
          <Panel>
            <PanelHeader label="Private Key">
              {privateKeyPem && (
                <CopyButton variant="copy" size="sm" value={privateKeyPem} />
              )}
            </PanelHeader>
            <textarea
              className={`${styles.keyTextarea} ${styles.privateKeyTextarea}`}
              value={privateKeyPem}
              onChange={(e) => {
                setPrivateKeyPem(e.target.value);
              }}
              placeholder="Paste a PEM private key, or generate one above…"
              spellCheck={false}
            />
            {privKeyImportError && privateKeyPem && (
              <div className={styles.errorMsg}>{privKeyImportError}</div>
            )}
            <div className={styles.annotation}>
              Keep secret — this is the only key that can decrypt.
            </div>
          </Panel>
        </div>

        {(encryptKey || decryptKey) && (
          <div className={styles.infoBox}>
            Algorithm: RSA-OAEP · Hash: SHA-256 · Key size: 2048 bits · Public
            exponent: 65537
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
            <span className={styles.timingBadge}>
              encrypted in {encryptMs}ms
            </span>
          )}
        </div>

        <Panel>
          <PanelHeader label="Plaintext">
            <span
              className={`${styles.byteCounter}${plaintextBytes > 190 ? ` ${styles.byteCounterOver}` : ""}`}
            >
              {plaintextBytes} / 190 bytes
              {plaintextBytes > 190 && " — too long"}
            </span>
          </PanelHeader>
          <div className={styles.byteBar}>
            <div
              className={`${styles.byteBarFill}${byteRatio > 1 ? ` ${styles.byteBarOver}` : ""}`}
              style={{ width: `${Math.min(byteRatio * 100, 100)}%` }}
            />
          </div>
          <textarea
            className={styles.textarea}
            value={plaintext}
            onChange={(e) => {
              setPlaintext(e.target.value);
            }}
            placeholder="Enter plaintext to encrypt…"
            spellCheck={false}
          />
        </Panel>

        <button
          className={styles.primaryBtn}
          onClick={handleEncrypt}
          disabled={
            !cryptoAvailable ||
            !encryptKey ||
            plaintextBytes > 190 ||
            encrypting
          }
        >
          {encrypting ? "Encrypting…" : "Encrypt with Public Key"}
        </button>

        {!encryptKey && (
          <div className={styles.annotation}>
            Add a public key in Step 1 first.
          </div>
        )}

        {ciphertext && (
          <Panel>
            <PanelHeader label="Ciphertext (base64)">
              <CopyButton variant="copy" size="sm" value={ciphertext} />
            </PanelHeader>
            <div className={styles.ciphertextOutput}>{ciphertext}</div>
            <div className={styles.annotation}>
              Always 344 base64 chars (256 bytes) regardless of input length —
              RSA-OAEP 2048 produces a fixed-size block.
            </div>
          </Panel>
        )}
      </div>

      <hr className={styles.divider} />

      {/* ── Step 3 ── */}
      <div className={styles.step}>
        <div className={styles.stepHeader}>
          <span className={styles.stepBadge}>Step 3</span>
          <span className={styles.stepTitle}>Decrypt</span>
          {decryptMs !== null && (
            <span className={styles.timingBadge}>
              decrypted in {decryptMs}ms
            </span>
          )}
        </div>

        {ciphertextFromUrl && (
          <div className={styles.urlNote}>
            Ciphertext loaded from URL. Generate a key pair to decrypt, or paste
            your own ciphertext.
          </div>
        )}

        <Panel>
          <PanelHeader label="Ciphertext (base64)" />
          <textarea
            className={styles.textarea}
            value={ctInput}
            onChange={(e) => {
              setCtInput(e.target.value);
            }}
            placeholder="Paste base64 ciphertext here, or encrypt something in Step 2…"
            spellCheck={false}
          />
        </Panel>

        <div className={styles.decryptBtns}>
          <button
            className={styles.primaryBtn}
            onClick={handleDecrypt}
            disabled={
              !cryptoAvailable || !decryptKey || !ctInput.trim() || decrypting
            }
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
          <Panel>
            <PanelHeader label="Decrypted" />
            <div className={styles.decryptedOutput}>{decrypted}</div>
          </Panel>
        )}

        {decryptError !== null && (
          <div className={styles.errorPanel}>
            <div className={styles.errorTitle}>Decryption failed</div>
            <div className={styles.errorMsg}>{decryptError}</div>
            <div className={styles.annotation}>
              The ciphertext may have been tampered with, or the wrong key was
              used.
            </div>
          </div>
        )}

        {wrongKeyError !== null && (
          <div className={styles.errorPanel}>
            <div className={styles.errorTitle}>
              Wrong key — decryption failed (expected)
            </div>
            <div className={styles.errorMsg}>{wrongKeyError}</div>
            <div className={styles.annotation}>
              This is the expected result. Without the matching private key,
              decryption is computationally infeasible — RSA security relies on
              the hardness of factoring large primes.
            </div>
            {wrongPrivKeyPem && (
              <>
                <div className={styles.annotation} style={{ marginTop: "6px" }}>
                  Wrong private key used (freshly generated, unrelated to the
                  encrypting key pair):
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

      <PermalinkRow url={url} onReset={handleReset} />
      </PageLayout>
    </div>
  );
}
