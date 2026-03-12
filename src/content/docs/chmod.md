# chmod

Convert between numeric and symbolic Unix file permission modes with a visual breakdown table.

## Input

Enter a permission mode in either format:

| Format | Example | Description |
|--------|---------|-------------|
| Numeric (octal) | `755` | Three octal digits (0–7), one per entity |
| Symbolic | `rwxr-xr-x` | Nine characters: read/write/execute for owner, group, other |

The tool auto-detects which format you entered and converts to the other.

## Permission Breakdown

Each digit in the numeric format encodes three bits:

| Bit | Value | Permission |
|-----|-------|-----------|
| Read | 4 | File/directory can be read |
| Write | 2 | File/directory can be written |
| Execute | 1 | File can be run / directory can be entered |

The three digits represent **Owner**, **Group**, and **Other** (world) permissions respectively.

**Example: `755`**
- Owner: `7` = 4+2+1 = `rwx` (read, write, execute)
- Group: `5` = 4+0+1 = `r-x` (read, execute)
- Other: `5` = 4+0+1 = `r-x` (read, execute)

## Presets

Quick-access buttons for common permission modes:

| Mode | Symbolic | Typical use |
|------|----------|------------|
| `644` | `rw-r--r--` | Regular files (owner reads/writes, others read) |
| `664` | `rw-rw-r--` | Shared files (owner and group read/write) |
| `755` | `rwxr-xr-x` | Executables and directories |
| `700` | `rwx------` | Private files/directories (owner only) |
| `777` | `rwxrwxrwx` | Fully open (use with caution) |

## Permalink

The current mode is encoded in the URL as `?mode=<value>`. Copy the URL to share or bookmark a specific permission.

## Reset

Clears the input and removes the URL parameter.
