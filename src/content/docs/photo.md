# placeholder photos

Placeholder images at any size, addressed entirely by URL. Ask for dimensions in the path and you get a photo back — no account, no API key, no query-string ceremony.

```
https://hypothesis.sh/photo/600/400
https://hypothesis.sh/photo/seed/checkout-hero/1200/630
https://hypothesis.sh/photo/id/42/300
```

Add a seed and the same URL returns the same photo forever, which is what makes these safe to hardcode in fixtures and mockups.

The explorer at `/photo` builds a URL from width, height, seed, grayscale, blur, and format, then previews it live. The controls are stored in the page URL, so a permalink reproduces the exact settings.

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

Examples:

```
/photo/200
/photo/600/400
/photo/seed/keegan/200
/photo/seed/checkout-hero/1200/630
/photo/id/7/400
/photo/id/7/1200/630
```

`{n}` is a 0-based index into the image library; an index past the end of the library returns `404`.

Width and height must be between 1 and 1600. A random request responds with a `302` to the `/photo/id/{n}/…` URL of the photo it picked, so the final URL is stable and cacheable — follow the `Location` header to see which photo you got, or reuse it to pin that image.

### Scope

The service returns images and nothing else. There are no JSON endpoints — no per-image metadata, no catalog listing, no way to enumerate the library. Any path outside the table above is an error, not data. The one piece of metadata you can read is the `Photo-ID` response header on an image (see below).

## Format

The last numeric segment takes an optional extension. `.jpg` is the default and can be omitted; `.webp` returns WebP.

```
/photo/600/400          → JPEG
/photo/600/400.jpg      → JPEG
/photo/600/400.webp     → WebP
/photo/seed/dog/300.webp → WebP
```

## Query parameters

| Parameter   | Values          | Description                                    |
| ----------- | --------------- | ---------------------------------------------- |
| `grayscale` | flag (no value) | Desaturates the image                          |
| `blur`      | `1`–`10`        | Gaussian blur strength; bare `?blur` means `1` |

Both are combinable:

```
/photo/600/400?grayscale
/photo/600/400?blur=5
/photo/600/400?blur
/photo/seed/hero/1200/630?grayscale&blur=3
```

## Determinism

The same seed always resolves to the same source photo, at any size, in any format, with any filter. That makes seeded URLs safe in snapshot tests, design mockups, and fixtures — the layout will not shuffle under you between runs.

Requests without a seed pick a photo at random per request, so they are useful for demos and unsuitable for anything that compares pixels.

## Caching and embedding

Responses are served with long-lived CDN cache headers, and `Access-Control-Allow-Origin: *` — the images are fetchable from any origin, including `fetch()` and canvas usage that requires CORS. Each image response carries a `Photo-ID` header naming the photo it came from, exposed to cross-origin JavaScript via `Access-Control-Expose-Headers`.

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

## Image sources

Images come from an AI-generated photo library, so there are no model or property releases to worry about — but they are placeholders, not stock photography, and are not intended for production content.

The source photos are 512×512. Anything larger is upscaled from that, which is fine for placeholders — thumbnails, avatars, card art, layout stand-ins — but a 1600 px hero will look soft next to real photography. Requests are cropped and resized per size, so the aspect ratio you ask for is the aspect ratio you get; only the detail is limited. That is also why sizes stop at 1600 — past that there is no more detail to serve, just a bigger file.

## Page parameters

The explorer page itself stores its state in the query string.

| Parameter | Description                       |
| --------- | --------------------------------- |
| `w`       | Width in pixels                   |
| `h`       | Height in pixels                  |
| `seed`    | Seed string (omitted when random) |
| `fmt`     | `jpg` or `webp`                   |
| `gray`    | `1` when grayscale is on          |
| `blur`    | Blur strength, omitted when `0`   |
