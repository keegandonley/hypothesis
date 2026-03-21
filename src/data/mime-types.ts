export interface MimeType {
  type: string;
  extensions: string[];
  description: string;
}

export interface MimeCategory {
  category: string;
  label: string;
  badge: string;
  color: string;
  subtle: string;
  border: string;
  types: MimeType[];
}

export const MIME_CATEGORIES: MimeCategory[] = [
  {
    category: "text",
    label: "Text",
    badge: "text",
    color: "#60a5fa",
    subtle: "#60a5fa18",
    border: "#60a5fa33",
    types: [
      {
        type: "text/plain",
        extensions: [".txt", ".text"],
        description: "Plain text with no formatting. Default for unknown text files.",
      },
      {
        type: "text/html",
        extensions: [".html", ".htm"],
        description: "HTML documents rendered by browsers.",
      },
      {
        type: "text/css",
        extensions: [".css"],
        description: "Cascading Style Sheets for styling HTML documents.",
      },
      {
        type: "text/javascript",
        extensions: [".js", ".mjs"],
        description:
          "JavaScript source code. The current standard MIME type for JS; application/javascript is deprecated.",
      },
      {
        type: "text/csv",
        extensions: [".csv"],
        description: "Comma-separated values. Common for spreadsheet and tabular data exchange.",
      },
      {
        type: "text/xml",
        extensions: [".xml"],
        description:
          "XML documents where the encoding is human-readable text. Use application/xml for non-text XML.",
      },
      {
        type: "text/markdown",
        extensions: [".md", ".markdown"],
        description: "Markdown-formatted text. Not universally supported; check Accept headers.",
      },
      {
        type: "text/calendar",
        extensions: [".ics", ".ifb"],
        description: "iCalendar data for calendar events and scheduling.",
      },
      {
        type: "text/event-stream",
        extensions: [],
        description:
          "Server-Sent Events (SSE) stream. Used for real-time server-to-client push over HTTP.",
      },
    ],
  },
  {
    category: "application",
    label: "Application",
    badge: "app",
    color: "#a78bfa",
    subtle: "#a78bfa18",
    border: "#a78bfa33",
    types: [
      {
        type: "application/json",
        extensions: [".json"],
        description: "JSON-encoded data. Default Content-Type for REST APIs.",
      },
      {
        type: "application/ld+json",
        extensions: [".jsonld"],
        description: "JSON-LD linked data for structured semantic data and schema.org markup.",
      },
      {
        type: "application/xml",
        extensions: [".xml"],
        description: "XML data not intended to be read directly by humans.",
      },
      {
        type: "application/x-www-form-urlencoded",
        extensions: [],
        description:
          "HTML form submission data encoded as key=value pairs. Default encoding for <form> without multipart.",
      },
      {
        type: "application/octet-stream",
        extensions: [],
        description:
          "Arbitrary binary data with unknown or unspecified type. Browsers trigger a file download.",
      },
      {
        type: "application/pdf",
        extensions: [".pdf"],
        description: "Portable Document Format. Browsers typically render inline or prompt download.",
      },
      {
        type: "application/zip",
        extensions: [".zip"],
        description: "ZIP compressed archive.",
      },
      {
        type: "application/gzip",
        extensions: [".gz", ".gzip"],
        description: "Gzip compressed data. Also used as Content-Encoding for compressed HTTP responses.",
      },
      {
        type: "application/x-tar",
        extensions: [".tar"],
        description: "Tape archive (tarball) without compression. Usually paired with gzip as .tar.gz.",
      },
      {
        type: "application/wasm",
        extensions: [".wasm"],
        description:
          "WebAssembly binary. Must be served with this MIME type for browsers to execute it directly.",
      },
      {
        type: "application/graphql",
        extensions: [".graphql", ".gql"],
        description: "GraphQL query or mutation. Used as Content-Type for GraphQL HTTP requests.",
      },
      {
        type: "application/x-ndjson",
        extensions: [".ndjson"],
        description:
          "Newline-delimited JSON — one JSON object per line. Common for streaming APIs and log formats.",
      },
      {
        type: "application/cbor",
        extensions: [".cbor"],
        description:
          "Concise Binary Object Representation. Compact binary alternative to JSON.",
      },
      {
        type: "application/msgpack",
        extensions: [".msgpack"],
        description: "MessagePack binary serialization. Efficient alternative to JSON for APIs.",
      },
      {
        type: "application/sql",
        extensions: [".sql"],
        description: "SQL database dump or script file.",
      },
    ],
  },
  {
    category: "image",
    label: "Image",
    badge: "img",
    color: "#f472b6",
    subtle: "#f472b618",
    border: "#f472b633",
    types: [
      {
        type: "image/jpeg",
        extensions: [".jpg", ".jpeg"],
        description: "JPEG compressed image. Best for photographs; lossy compression.",
      },
      {
        type: "image/png",
        extensions: [".png"],
        description: "PNG lossless image. Supports transparency; best for graphics and screenshots.",
      },
      {
        type: "image/gif",
        extensions: [".gif"],
        description: "GIF image. Supports animation and transparency with a limited 256-color palette.",
      },
      {
        type: "image/webp",
        extensions: [".webp"],
        description:
          "WebP image from Google. Superior compression to JPEG/PNG; supports both lossy and lossless.",
      },
      {
        type: "image/avif",
        extensions: [".avif"],
        description:
          "AVIF image based on AV1. Excellent compression and quality; growing browser support.",
      },
      {
        type: "image/svg+xml",
        extensions: [".svg"],
        description:
          "Scalable Vector Graphics. XML-based; resolution-independent. Can be embedded inline in HTML.",
      },
      {
        type: "image/x-icon",
        extensions: [".ico"],
        description: "Windows ICO format. Used for browser favicons.",
      },
      {
        type: "image/tiff",
        extensions: [".tif", ".tiff"],
        description: "TIFF image. High-quality lossless format common in print and photography.",
      },
      {
        type: "image/bmp",
        extensions: [".bmp"],
        description: "Bitmap image. Uncompressed; large file sizes. Legacy Windows format.",
      },
    ],
  },
  {
    category: "audio",
    label: "Audio",
    badge: "audio",
    color: "#fbbf24",
    subtle: "#fbbf2418",
    border: "#fbbf2433",
    types: [
      {
        type: "audio/mpeg",
        extensions: [".mp3"],
        description: "MP3 compressed audio. Universally supported lossy format.",
      },
      {
        type: "audio/ogg",
        extensions: [".ogg", ".oga"],
        description: "Ogg container with Vorbis audio. Open format with good compression.",
      },
      {
        type: "audio/wav",
        extensions: [".wav"],
        description: "Waveform audio. Uncompressed PCM; large files but no quality loss.",
      },
      {
        type: "audio/webm",
        extensions: [".weba"],
        description: "WebM container with Opus or Vorbis audio. Common for web streaming.",
      },
      {
        type: "audio/aac",
        extensions: [".aac"],
        description: "Advanced Audio Coding. Lossy compression; better quality than MP3 at the same bitrate.",
      },
      {
        type: "audio/flac",
        extensions: [".flac"],
        description: "Free Lossless Audio Codec. Lossless compression; smaller than WAV.",
      },
      {
        type: "audio/opus",
        extensions: [".opus"],
        description:
          "Opus audio codec. Excellent for low-latency streaming and VoIP; outperforms MP3 and AAC.",
      },
    ],
  },
  {
    category: "video",
    label: "Video",
    badge: "video",
    color: "#fb923c",
    subtle: "#fb923c18",
    border: "#fb923c33",
    types: [
      {
        type: "video/mp4",
        extensions: [".mp4", ".m4v"],
        description: "MPEG-4 video. Most widely supported format for web and mobile.",
      },
      {
        type: "video/webm",
        extensions: [".webm"],
        description: "WebM video container with VP8/VP9/AV1. Open format optimized for the web.",
      },
      {
        type: "video/ogg",
        extensions: [".ogv"],
        description: "Ogg container with Theora video. Open format; limited browser support.",
      },
      {
        type: "video/mpeg",
        extensions: [".mpeg", ".mpg"],
        description: "MPEG-1 or MPEG-2 video. Legacy format; limited browser support.",
      },
      {
        type: "video/quicktime",
        extensions: [".mov"],
        description: "QuickTime video container from Apple. Common for high-quality exports.",
      },
    ],
  },
  {
    category: "font",
    label: "Font",
    badge: "font",
    color: "#2dd4bf",
    subtle: "#2dd4bf18",
    border: "#2dd4bf33",
    types: [
      {
        type: "font/ttf",
        extensions: [".ttf"],
        description: "TrueType font. Widely supported; uncompressed.",
      },
      {
        type: "font/otf",
        extensions: [".otf"],
        description: "OpenType font. Superset of TrueType with advanced typographic features.",
      },
      {
        type: "font/woff",
        extensions: [".woff"],
        description: "Web Open Font Format. Compressed TrueType/OpenType for web delivery.",
      },
      {
        type: "font/woff2",
        extensions: [".woff2"],
        description:
          "Web Open Font Format 2. Better compression than WOFF; preferred format for web fonts.",
      },
    ],
  },
  {
    category: "multipart",
    label: "Multipart",
    badge: "multi",
    color: "#34d399",
    subtle: "#34d39918",
    border: "#34d39933",
    types: [
      {
        type: "multipart/form-data",
        extensions: [],
        description:
          "HTML form submission with file uploads. Each field is a separate MIME part with its own headers.",
      },
      {
        type: "multipart/byteranges",
        extensions: [],
        description:
          "Response to a multi-range HTTP request (206). Each byte range is a separate part.",
      },
      {
        type: "multipart/mixed",
        extensions: [],
        description: "Multiple independent body parts of different types. Common in email (MIME).",
      },
    ],
  },
];
