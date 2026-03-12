# hash

Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 cryptographic hashes from any text input — entirely in your browser with no server involved.

## Overview

This tool computes all five algorithm outputs simultaneously as you type. SHA hashing uses the browser's built-in [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest) (`crypto.subtle.digest`). MD5 is implemented in pure JavaScript (Web Crypto does not support it). Your input never leaves your machine.

## Supported Algorithms

| Algorithm | Output length | Common use |
|-----------|--------------|------------|
| MD5 | 32 hex chars (128 bits) | Legacy checksums, ETags, file verification |
| SHA-1 | 40 hex chars (160 bits) | Legacy checksums, Git object IDs |
| SHA-256 | 64 hex chars (256 bits) | File integrity, API signatures, TLS |
| SHA-384 | 96 hex chars (384 bits) | TLS certificates, higher-security contexts |
| SHA-512 | 128 hex chars (512 bits) | Password hashing pipelines, HMAC |

MD5 and SHA-1 are cryptographically broken and should not be used for security purposes (e.g. password storage or digital signatures). They remain useful for non-security checksums and legacy system compatibility.

## Use Cases

- **Checksums** — verify that a downloaded file or string matches an expected hash
- **File integrity** — compare SHA-256 digests before and after transfer
- **API signatures** — quickly inspect what a signing payload hashes to
- **Security research** — test inputs against known hash values

## Copying

Each algorithm row has an individual **Copy** button that copies just that hash to your clipboard.

## Permalinks

Every input you type is reflected into the URL as `?value=<encoded>`. You can share or bookmark these URLs to reopen the tool with the same text pre-filled and all hashes instantly computed.

- **Copy** — copies the current permalink to your clipboard
- **Reset** — clears the input and removes the URL parameter
