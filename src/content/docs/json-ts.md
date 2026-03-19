# JSON → TypeScript

Convert a JSON sample into TypeScript interface definitions instantly, entirely in your browser.

## Usage

Paste any valid JSON into the left panel. TypeScript interfaces are generated immediately in the right panel.

## Options

- **Root name** — sets the name of the top-level interface (default: `Root`).
- **Optional fields** — when enabled, all fields get a `?` modifier (e.g. `name?: string`).

## How it works

- Nested objects each become their own named `interface`, named after the parent key in PascalCase.
- Arrays of objects derive their element interface name by dropping a trailing `s` from the key.
- Mixed-type arrays produce a union type, e.g. `(string | number)[]`.
- Empty arrays produce `unknown[]`.
- Keys containing special characters are automatically quoted.
- When the root value is a primitive or array (not an object), a `type` alias is emitted instead.
- Duplicate interface names get a numeric suffix (`Root2`, `Root3`, …).

## Permalink

Every change is written to the URL as a `?v=` parameter. Share or bookmark the URL to restore the full state.
