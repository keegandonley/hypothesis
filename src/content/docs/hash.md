# hash

Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 cryptographic hashes from any text or file — entirely in your browser with no server involved.

## Overview

This tool computes all five algorithm outputs simultaneously. SHA hashing uses the browser's built-in [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest) (`crypto.subtle.digest`). MD5 is implemented in pure JavaScript (Web Crypto does not support it). Your input never leaves your machine.

## Modes

**Text** — type or paste any string and all five hashes update live.

**File** — drop a file onto the drop zone (or click to browse) and the tool reads the raw bytes and hashes the full file contents. The filename and size are shown for confirmation. Any file type and size supported by the browser is accepted.

## Supported Algorithms

| Algorithm | Output length            | Common use                                 |
| --------- | ------------------------ | ------------------------------------------ |
| MD5       | 32 hex chars (128 bits)  | Legacy checksums, ETags, file verification |
| SHA-1     | 40 hex chars (160 bits)  | Legacy checksums, Git object IDs           |
| SHA-256   | 64 hex chars (256 bits)  | File integrity, API signatures, TLS        |
| SHA-384   | 96 hex chars (384 bits)  | TLS certificates, higher-security contexts |
| SHA-512   | 128 hex chars (512 bits) | Password hashing pipelines, HMAC           |

MD5 and SHA-1 are cryptographically broken and should not be used for security purposes (e.g. password storage or digital signatures). They remain useful for non-security checksums and legacy system compatibility.

## Use Cases

- **File verification** — confirm a downloaded file's SHA-256 matches the publisher's checksum
- **Checksums** — verify that a string or file matches an expected hash
- **API signatures** — quickly inspect what a signing payload hashes to
- **Security research** — test inputs against known hash values

## Copying

Each algorithm row has an individual **Copy** button that copies just that hash to your clipboard.

## Permalinks

In **Text** mode, the input is reflected into the URL as `?value=<encoded>` so you can share or bookmark it with the same text pre-filled.

- **Copy** — copies the current permalink to your clipboard
- **Reset** — clears the input and removes the URL parameter

File mode does not produce a permalink since a file cannot be encoded in a URL.
