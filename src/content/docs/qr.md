# qr code

Generate QR codes from any text or URL. Download as SVG or PNG, or copy the SVG markup directly.

## Overview

Enter any text or URL in the input field and a QR code is generated in real time as an inline SVG. The SVG uses the tool's color scheme by default. PNG downloads render on a standard white background for maximum scanner compatibility.

## Error correction levels

| Level | Recovery capacity | Use when |
|-------|------------------|----------|
| L | ~7% | Clean environments, smallest code |
| M | ~15% | General use (default) |
| Q | ~25% | Industrial or printed applications |
| H | ~30% | Maximum resilience, logo overlays |

Higher error correction increases QR code density (more modules, larger image).

## Export options

- **Download SVG** — vector file, scales to any size without quality loss
- **Download PNG** — 512×512 raster image on white background, ideal for sharing
- **Copy SVG** — copies the raw SVG markup to your clipboard for embedding in HTML or documents

## URL parameters

`?value=<encoded-text>&ecl=<L|M|Q|H>` — pre-fills the input and error correction level. Useful for sharing or bookmarking specific QR codes.
