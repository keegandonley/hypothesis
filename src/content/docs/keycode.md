# Keycode Inspector

Press any key to see its JavaScript keyboard event properties in real time.

## Properties

| Property | Description |
|----------|-------------|
| `key` | The key value string (e.g. `"a"`, `"Enter"`, `"ArrowLeft"`) |
| `code` | The physical key identifier, layout-independent (e.g. `"KeyA"`, `"Enter"`) |
| `keyCode` | Legacy numeric code for the key (deprecated but still widely used) |
| `which` | Alias for `keyCode` — included for completeness |
| `location` | Whether the key is Standard (0), Left (1), Right (2), or Numpad (3) |
| `modifiers` | Active modifier keys at the time of the event |

## key vs code

`key` reflects the **logical value** of the key — it changes based on keyboard layout and modifier state. Pressing `a` with Shift held gives `"A"`.

`code` reflects the **physical position** of the key — it stays the same regardless of layout or modifiers. Pressing the `a` key always gives `"KeyA"` even on an AZERTY keyboard.

Use `code` for game controls and keyboard shortcuts where physical position matters. Use `key` for text input and when the character value matters.

## keyCode deprecation

`keyCode` and `which` are deprecated in the Web standard. Prefer `key` and `code` in new code. They remain here because a large amount of existing code uses them.

## Modifier keys

The modifiers row shows which of `Ctrl`, `Shift`, `Alt`, and `Meta` (Cmd on Mac, Win on Windows) are held at the time of the keydown event.
