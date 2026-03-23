# Password Generator

Generate cryptographically secure random passwords in the browser.

## Options

- **Length** — slider from 4 to 128 characters
- **Charset** — any combination of uppercase A–Z, lowercase a–z, digits 0–9, and symbols `!@#$%^&*()-_=+[]{}|;:,.<>?`
- **Count** — generate 1 to 20 passwords at once

## How it works

Passwords are generated entirely in the browser using `crypto.getRandomValues`, the Web Crypto API's cryptographically secure random number generator. No data is sent to a server.

Each character is selected by drawing a random 32-bit integer and mapping it to a character in the charset via modulo. The modulo bias is negligible for charset sizes well below 2^32.

## Permalink

The URL encodes your current settings (length, charset options, count) so you can share or bookmark a configuration. Passwords themselves are never stored in the URL.
