# Password Generator

Generate cryptographically secure random passwords, or analyze the strength of an existing one — entirely in the browser.

## Generate mode

- **Length** — slider from 4 to 128 characters
- **Charset** — any combination of uppercase A–Z, lowercase a–z, digits 0–9, and symbols `!@#$%^&*()-_=+[]{}|;:,.<>?`
- **Count** — generate 1 to 20 passwords at once

Passwords are generated using `crypto.getRandomValues`, the Web Crypto API's cryptographically secure random number generator. No data is sent to a server.

## Check mode

Paste or type any password to get an instant strength analysis:

- **Strength meter** — five-segment bar from Very Weak (red) to Very Strong (green)
- **Entropy** — bits of entropy based on the observed character classes and length
- **Charset** — which character classes are present (A-Z, a-z, 0-9, symbols)
- **Estimated crack time** — how long a brute-force attack would take at 10 billion guesses/second (offline fast-hash scenario), reported as an average-case estimate

The checked password is intentionally never written to the URL or sent anywhere.

### Entropy model

Entropy = `length × log₂(charsetSize)`, where charsetSize is the sum of each present character class: 26 (uppercase) + 26 (lowercase) + 10 (digits) + 32 (symbols). This is a lower-bound estimate — it assumes a random draw from the observed classes and does not account for dictionary words, patterns, or repeated characters.

| Strength    | Entropy range |
| ----------- | ------------- |
| Very Weak   | < 28 bits     |
| Weak        | 28–35 bits    |
| Fair        | 36–59 bits    |
| Strong      | 60–127 bits   |
| Very Strong | ≥ 128 bits    |

## Permalink

In Generate mode, the URL encodes your current settings (length, charset options, count) so you can share or bookmark a configuration. Passwords themselves are never stored in the URL.

In Check mode, the URL records `?mode=check` so the page reloads into check mode, but the input is always empty.
