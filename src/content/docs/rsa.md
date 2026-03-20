# RSA Encryption

Interactive RSA-OAEP public-key encryption experiment. Generate a 2048-bit key pair, encrypt a message with the public key, and decrypt it with the private key — entirely in-browser using the Web Crypto API. No data ever leaves your browser.

## How It Works

RSA (Rivest–Shamir–Adleman) is an asymmetric encryption algorithm. Asymmetric means there are two mathematically linked keys:

- **Public key** — share freely. Anyone can use it to encrypt a message.
- **Private key** — keep secret. Only the holder can decrypt messages encrypted with the corresponding public key.

This experiment uses **RSA-OAEP** (Optimal Asymmetric Encryption Padding) with a 2048-bit key and SHA-256 hashing — the modern standard for RSA encryption.

## Steps

### Step 1 — Generate Key Pair

Clicking **Generate RSA-OAEP Key Pair** calls `crypto.subtle.generateKey()` and produces:

- A **public key** exported in SPKI format, displayed as a PEM block (`BEGIN PUBLIC KEY`)
- A **private key** exported in PKCS#8 format, displayed as a PEM block (`BEGIN PRIVATE KEY`)

Key generation typically takes 100–500 ms depending on your device. The timing badge shows actual milliseconds.

### Step 2 — Encrypt

Enter plaintext (up to **190 UTF-8 bytes** — the RSA-OAEP/SHA-256 limit for 2048-bit keys) and click **Encrypt with Public Key**.

The output ciphertext is always **344 base64 characters** (256 raw bytes) regardless of input length. This is a property of RSA: the ciphertext is always the same size as the key modulus.

### Step 3 — Decrypt

The ciphertext textarea is pre-filled from Step 2. Click **Decrypt with Private Key** to recover the original plaintext.

You can also paste any externally generated RSA-OAEP ciphertext here — as long as you have the matching private key.

**Try with Wrong Key** generates a fresh ephemeral key pair and attempts decryption, which always fails. This demonstrates that without the correct private key, decryption is computationally infeasible — RSA security is based on the hardness of factoring large numbers.

## Permalink / URL Sync

The ciphertext (`?ct=...`) is synced to the URL for shareability. Keys and plaintext are never included in the URL — only ciphertext. When you open a shared URL, the ciphertext is pre-loaded into Step 3, but no keys are present (you need to generate a new key pair or already have the matching private key).

## Limitations

- **190-byte plaintext limit** — RSA-OAEP is not designed for bulk data. For larger payloads, use hybrid encryption (RSA to encrypt a symmetric key, AES for the data).
- **Keys are ephemeral** — they exist only in memory and are lost on page reload. This is intentional: the experiment demonstrates the algorithm, not key management.
- **Requires HTTPS or localhost** — the Web Crypto API (`crypto.subtle`) is only available in secure contexts.

## Web Crypto API Reference

```ts
// Generate key pair
crypto.subtle.generateKey(
  { name: "RSA-OAEP", modulusLength: 2048,
    publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
    hash: "SHA-256" },
  true, ["encrypt", "decrypt"]
)

// Encrypt
crypto.subtle.encrypt({ name: "RSA-OAEP" }, publicKey, plainBytes)

// Decrypt
crypto.subtle.decrypt({ name: "RSA-OAEP" }, privateKey, cipherBytes)
```
