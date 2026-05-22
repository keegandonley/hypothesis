# qr code

Generate QR codes from text, URLs, WiFi credentials, or contact cards. Download as SVG or PNG, or copy the SVG markup directly.

## Overview

Select an input mode, fill in the fields, and a QR code is generated in real time as an inline SVG. The SVG uses the tool's color scheme by default. PNG downloads render on a standard white background for maximum scanner compatibility.

## Input modes

**Text** — free-form text or URL. Any string is accepted. Existing permalinks using `?value=` continue to work.

**WiFi** — generates a WiFi QR code that phones can scan to join a network automatically. Fields:

- **SSID** — the network name (required)
- **Password** — network password (disabled when security is None)
- **Security** — WPA/WPA2, WEP, or None (open network)
- **Hidden** — whether the network is hidden (not broadcast)

Produces a string like `WIFI:T:WPA;S:MyNetwork;P:secret;H:false;;`.

**vCard** — generates a contact card QR code. Phones scan it to offer adding the contact. Fields: first name, last name, phone, email, organization, URL. All fields are optional; the QR code is generated as soon as any field is filled. Produces a vCard 3.0 payload.

## Error correction levels

| Level | Recovery capacity | Use when                           |
| ----- | ----------------- | ---------------------------------- |
| L     | ~7%               | Clean environments, smallest code  |
| M     | ~15%              | General use (default)              |
| Q     | ~25%              | Industrial or printed applications |
| H     | ~30%              | Maximum resilience, logo overlays  |

Higher error correction increases QR code density (more modules, larger image).

## Export options

- **Download SVG** — vector file, scales to any size without quality loss
- **Download PNG** — 512×512 raster image on white background, ideal for sharing
- **Copy SVG** — copies the raw SVG markup to your clipboard for embedding in HTML or documents

## URL parameters

All modes support permalinks. The `ecl` parameter is shared across modes.

| Mode  | Parameters                                                                             |
| ----- | -------------------------------------------------------------------------------------- |
| Text  | `?value=<text>&ecl=M`                                                                  |
| WiFi  | `?mode=wifi&ssid=<name>&wpass=<pw>&sec=<WPA\|WEP\|nopass>&hidden=1&ecl=M`              |
| vCard | `?mode=vcard&fn=<first>&ln=<last>&tel=<phone>&email=<email>&org=<org>&url=<url>&ecl=M` |

## API

`GET /api/qr` returns the QR code as an `image/svg+xml` response — suitable for use in `<img>` tags or anywhere an image URL is accepted.

| Parameter | Required | Default   | Description                                   |
| --------- | -------- | --------- | --------------------------------------------- |
| `value`   | yes      | —         | Text or URL to encode                         |
| `ecl`     | no       | `M`       | Error correction level: `L`, `M`, `Q`, or `H` |
| `dark`    | no       | `#000000` | Hex color for dark modules (include `#`)      |
| `light`   | no       | `#ffffff` | Hex color for light modules (include `#`)     |

**Examples:**

```
/api/qr?value=https%3A%2F%2Fhypothesis.sh
/api/qr?value=https%3A%2F%2Fhypothesis.sh%2Fqr&ecl=H
/api/qr?value=https%3A%2F%2Fhypothesis.sh&dark=%23ff0000&light=%23f5f5f5
```

```html
<img
  src="https://hypothesis.sh/api/qr?value=https%3A%2F%2Fhypothesis.sh"
  alt="QR code"
/>
```

Responses are cached for 24 hours (`Cache-Control: public, s-maxage=86400`). Color values must be 6-digit hex codes — shorthand (`#fff`) is not accepted.
