# placeholder photos

Placeholder images at any size, addressed entirely by URL. Ask for dimensions in the path and you get an image back — no account, no API key, no query-string ceremony.

```
https://hypothesis.sh/photo/600/400
https://hypothesis.sh/photo/seed/checkout-hero/1200/630
https://hypothesis.sh/photo/id/42/300
https://hypothesis.sh/photo/gen/checkout-hero/1200/630
```

There are two sources. The default is a photo library: real-looking imagery, cropped and resized per request. Under `/photo/gen/` is procedural mode, which draws an SVG from the seed instead of touching the library.

Add a seed and the same URL returns the same image forever, which is what makes these safe to hardcode in fixtures and mockups.

The explorer at `/photo` builds a URL from source, style, width, height, seed, grayscale, blur, and format, then previews it live. The controls are stored in the page URL, so a permalink reproduces the exact settings.

## URL forms

These are the forms the service serves — everything else 400s with a usage message.

| Form                                  | Result                                      |
| ------------------------------------- | ------------------------------------------- |
| `/photo/{size}`                       | Random square image, `size` × `size`        |
| `/photo/{width}/{height}`             | Random image at the given dimensions        |
| `/photo/seed/{seed}/{size}`           | Deterministic square image for `seed`       |
| `/photo/seed/{seed}/{width}/{height}` | Deterministic image at the given dimensions |
| `/photo/id/{n}/{size}`                | Square image at catalog index `n`           |
| `/photo/id/{n}/{width}/{height}`      | Catalog image `n` at the given dimensions   |
| `/photo/gen/{seed}/{size}`            | Generated square pattern for `seed`         |
| `/photo/gen/{seed}/{width}/{height}`  | Generated pattern at the given dimensions   |

Examples:

```
/photo/200
/photo/600/400
/photo/seed/keegan/200
/photo/seed/checkout-hero/1200/630
/photo/id/7/400
/photo/id/7/1200/630
/photo/gen/keegan/200
/photo/gen/checkout-hero/1200/630
```

`{n}` is a 0-based index into the image library; an index past the end of the library returns `404`.

Width and height must be between 1 and 1600. A random request responds with a `302` to the `/photo/id/{n}/…` URL of the photo it picked, so the final URL is stable and cacheable — follow the `Location` header to see which photo you got, or reuse it to pin that image.

### Scope

The service returns images and nothing else. There are no JSON endpoints — no per-image metadata, no catalog listing, no way to enumerate the library. Any path outside the table above is an error, not data. The one piece of metadata you can read is the `Photo-ID` response header on an image (see below).

## Procedural patterns

`/photo/gen/{seed}/…` skips the photo library and generates an SVG from the seed: colors, placement, and shapes are all derived from it. Nothing is decoded, cropped, or resized, so these responses are the cheapest thing here to serve and the fastest to arrive.

A seed is always required. Every string is a valid seed, so a shorter form would be ambiguous — `/photo/gen/600/400` could mean a random 600 × 400 pattern or seed `600` at 400 px. There is no random form; if you want an arbitrary pattern, make up a seed.

### Styles

Pick one with `?style=`. The default is `gradient`.

| Style      | Looks like                                                                                                   | Good for                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `gradient` | Soft two-tone gradient with a few blurred blobs                                                              | Hero and card art that needs color but no subject |
| `label`    | Drafting card: dimension lines, ruler ticks, registration marks, and the pixel size called out in the middle | Layout debugging — the image states its own size  |
| `bauhaus`  | Seeded circles, arcs, and bars on a flat ground                                                              | Avatars and tiles, where per-seed variety shows   |
| `noise`    | Seeded fractal-noise field                                                                                   | Textures and backgrounds that should read as busy |

```
/photo/gen/hero/1200/630
/photo/gen/hero/1200/630?style=bauhaus
/photo/gen/avatar-3/96?style=noise
/photo/gen/card/400/300?style=label
```

`style` is ignored outside procedural mode — the photo library has no patterns to choose between.

## Format

The last numeric segment takes an optional extension. Which extension is implied when you omit it depends on the source: the photo library defaults to `.jpg`, and procedural mode defaults to `.svg`.

| Extension       | Response           | Available in         |
| --------------- | ------------------ | -------------------- |
| _(omitted)_     | The source default | Both                 |
| `.jpg`, `.jpeg` | `image/jpeg`       | Both                 |
| `.webp`         | `image/webp`       | Both                 |
| `.svg`          | `image/svg+xml`    | Procedural mode only |

```
/photo/600/400            → JPEG
/photo/600/400.webp       → WebP
/photo/seed/dog/300.webp  → WebP
/photo/gen/dog/300        → SVG
/photo/gen/dog/300.svg    → SVG
/photo/gen/dog/300.jpg    → JPEG, rasterized from the same SVG
```

`.svg` on a photo-library URL is a `400`: those images are photos, and there is no vector form of them to hand back. Ask for `.jpg` or `.webp` instead.

Procedural mode rasterizes on request when you ask for `.jpg` or `.webp`, so the vector default is the cheap path. Take it unless something downstream cannot render SVG.

### How rasterizing stays cheap

Every style is available as `.jpg` or `.webp` at any size up to 1600, but they do not all cost the same to produce. `noise` is the expensive one: its fractal field is evaluated per output pixel by the renderer, so a full-resolution 1600x1600 render costs roughly twenty times what any other style costs at the same size.

So the noise styles render at a reduced resolution and the resulting bitmap is scaled up to the size you asked for. The output is exactly the dimensions requested and is visually near-identical — a noise field has no fine detail to lose — while costing about a quarter of the full-resolution render.

The SVG form never does any of this. It is emitted as text and scales in the client, which is why it stays the cheapest thing this service can hand you at any size.

## Query parameters

| Parameter   | Values                                  | Description                                    |
| ----------- | --------------------------------------- | ---------------------------------------------- |
| `style`     | `gradient`, `label`, `bauhaus`, `noise` | Pattern style; procedural mode only            |
| `grayscale` | flag (no value)                         | Desaturates the image                          |
| `blur`      | `1`–`10`                                | Gaussian blur strength; bare `?blur` means `1` |

All are combinable:

```
/photo/600/400?grayscale
/photo/600/400?blur=5
/photo/600/400?blur
/photo/seed/hero/1200/630?grayscale&blur=3
/photo/gen/hero/1200/630?style=bauhaus&grayscale&blur=2
```

### Where the filters run

In photo mode `grayscale` and `blur` are applied server-side by sharp, so every client receives identical bytes.

In procedural mode they are SVG filter primitives written into the document, which means whatever renders the SVG applies them — the browser for an `.svg` response, the server for a `.jpg` or `.webp` one. The result is the same picture, but not necessarily the same pixels: rendering engines differ, so a filtered `.svg` in Chrome, the same URL in Safari, and its rasterized `.jpg` can disagree at the sub-pixel level. If you are diffing pixels across browsers, either request `.jpg` (one renderer, one result) or leave the filters off.

## Determinism

The same seed always resolves to the same image, at any size, in any format, with any filter. That makes seeded URLs safe in snapshot tests, design mockups, and fixtures — the layout will not shuffle under you between runs.

Procedural URLs are deterministic by construction: a pattern is a pure function of its seed, with nothing looked up at all. `/photo/gen/checkout-hero/1200/630` renders the same image today, after the next deploy, and after every deploy after that.

Requests without a seed pick a photo at random per request, so they are useful for demos and unsuitable for anything that compares pixels. Procedural mode has no such form — its seed is required.

## Caching and embedding

Responses are served with long-lived CDN cache headers, and `Access-Control-Allow-Origin: *` — the images are fetchable from any origin, including `fetch()` and canvas usage that requires CORS. Each image response carries a `Photo-ID` header, exposed to cross-origin JavaScript via `Access-Control-Expose-Headers`. In photo mode it names the library image the response came from, so it round-trips into a `/photo/id/{n}/…` URL. In procedural mode there is no library image to name, so it reports the style and a hash of the seed instead — `gen-bauhaus-7k0f2x`. The seed itself never appears in a response header.

```html
<img
  src="https://hypothesis.sh/photo/seed/avatar/96"
  alt=""
  width="96"
  height="96"
/>
```

```css
.hero {
  background-image: url("https://hypothesis.sh/photo/seed/hero/1600/600?grayscale");
}
```

```html
<img
  src="https://hypothesis.sh/photo/gen/avatar/96"
  alt=""
  width="96"
  height="96"
/>
```

## Image sources

Photos come from an AI-generated photo library, so there are no model or property releases to worry about — but they are placeholders, not stock photography, and are not intended for production content.

The source photos are 512×512. Anything larger is upscaled from that, which is fine for placeholders — thumbnails, avatars, card art, layout stand-ins — but a 1600 px hero will look soft next to real photography. Requests are cropped and resized per size, so the aspect ratio you ask for is the aspect ratio you get; only the detail is limited. That is also why sizes stop at 1600 — past that there is no more detail to serve, just a bigger file.

Procedural patterns have no source image at all. They are drawn to the requested box, so they are sharp at every size, and the 1..1600 bound applies to them for consistency rather than for detail.

## Page parameters

The explorer page itself stores its state in the query string.

| Parameter | Description                                         |
| --------- | --------------------------------------------------- |
| `w`       | Width in pixels                                     |
| `h`       | Height in pixels                                    |
| `mode`    | `gen` for procedural, omitted for the photo library |
| `seed`    | Seed string (omitted when random)                   |
| `style`   | Pattern style, omitted when `gradient`              |
| `fmt`     | `jpg`, `webp`, or `svg`                             |
| `gray`    | `1` when grayscale is on                            |
| `blur`    | Blur strength, omitted when `0`                     |
