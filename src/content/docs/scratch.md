# Scratch

A minimal scratchpad. Type anything — the text is encoded into the URL so you can bookmark or share it as a permalink.

## Usage

1. Type or paste text into the textarea
2. The URL updates automatically with your text encoded as a query parameter
3. Click **Copy** to copy the permalink to your clipboard
4. Bookmark or share the URL — opening it will restore your text exactly

## Notes

- All processing happens client-side; nothing is sent to a server
- The `?text=` parameter is compressed with [lz-string](https://github.com/pieroxy/lz-string) (`compressToEncodedURIComponent`) — significantly shorter than percent-encoding for code, JSON, and repetitive text
- Click **Reset** to clear the text and return to a blank scratchpad
