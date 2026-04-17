# JSON Diff

Compare two JSON structures and see exactly what changed — added keys, removed keys, and changed values — with a recursive structural diff.

## How it works

Paste JSON A on the left and JSON B on the right. The diff panel below shows all differences:

| Symbol | Meaning |
|--------|---------|
| `+ added` | Key or element exists in B but not in A |
| `- removed` | Key or element exists in A but not in B |
| `~ changed` | Same key, different primitive value |
| `! type` | Same key, different value type |

## Path notation

Nested paths use dot notation for objects and bracket notation for arrays:

```
user.address.city        → object key path
items[0].name            → array index + key path
```

## Differs from text diff

This is a **structural** diff, not a text diff. It understands JSON structure:

- Reordering object keys doesn't appear as a change (objects are unordered)
- Array order matters — `[1,2]` vs `[2,1]` shows two changes

## Permalinks

Both JSON inputs are encoded into the URL for sharing.
