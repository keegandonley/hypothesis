# JSON ↔ YAML Converter

Convert between JSON and YAML formats with live bidirectional sync.

## How it works

Edit either panel and the other updates instantly:

- **JSON → YAML**: parsed with the built-in `JSON.parse`, serialized with `js-yaml`'s `dump`
- **YAML → JSON**: parsed with `js-yaml`'s `load`, serialized with `JSON.stringify` (2-space indent)

Invalid input is flagged inline — the other panel retains its last valid state.

## Supported YAML features

Conversion uses `js-yaml` in safe mode, which supports:

- Scalars: strings, numbers, booleans, nulls
- Sequences (arrays) and mappings (objects)
- Multi-line strings (literal `|` and folded `>` blocks)
- Comments are stripped on round-trip (JSON has no comment support)

## Notes

- YAML anchors and aliases are resolved on parse; they do not survive a round-trip
- Binary and timestamp YAML types map to strings in JSON

## Permalink

The current content is encoded in the URL for sharing. Large payloads may produce long URLs.
