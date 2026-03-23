# Image Compressor

Compress PNG, JPEG, and WebP images with server-side processing using [sharp](https://sharp.pixelplumbing.com). Supports batch uploads and conversion to WebP or AVIF for maximum file size reduction.

## Usage

1. Drag image files onto the drop zone, or click to browse
2. Select an output format (PNG, WebP, or AVIF)
3. Files are uploaded to temporary storage and compressed automatically
4. Download each compressed file — the original is deleted from storage after compression

## Output Formats

| Format | Best for |
|--------|----------|
| **PNG** | Lossless compression, transparency, screenshots |
| **WebP** | Lossy compression, ~80% quality — great balance for web images |
| **AVIF** | Maximum compression, ~50% quality — smallest file sizes |

## Notes

- Accepts PNG, JPEG, WebP, GIF up to **50 MB** per file
- Files are temporarily stored in Vercel Blob and deleted immediately after compression
- Processing is done entirely server-side with no third-party image services

## Rate Limits

To prevent abuse, uploads are rate-limited per IP address:

- **10 uploads per hour**
- **25 uploads per day**

## See also

- [MIME Types](/references/mime-types) — Content-Type values for image formats including PNG, JPEG, WebP, and AVIF
