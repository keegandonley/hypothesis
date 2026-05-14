export interface MimeType {
  type: string;
  extensions: string[];
  description: string;
  supersededBy?: string;
}

export interface MimeCategory {
  id: string;
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
    id: "text",
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
    id: "application",
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
    id: "image",
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
        type: "image/vnd.microsoft.icon",
        extensions: [".ico"],
        description: "Windows ICO format. The IANA-registered MIME type for browser favicons.",
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
    id: "audio",
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
    id: "video",
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
    id: "font",
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
    id: "multipart",
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
  {
    id: "deprecated",
    category: "deprecated",
    label: "Deprecated",
    badge: "depr",
    color: "#f87171",
    subtle: "#f8717118",
    border: "#f8717133",
    types: [
      {
        type: "application/javascript",
        extensions: [".js"],
        description: "JavaScript. Obsoleted by RFC 9239 (2022) which standardized text/javascript as the sole registered type.",
        supersededBy: "text/javascript",
      },
      {
        type: "application/x-javascript",
        extensions: [".js"],
        description: "x- variant of the JavaScript MIME type that predates IANA registration.",
        supersededBy: "text/javascript",
      },
      {
        type: "text/x-javascript",
        extensions: [".js"],
        description: "Early x- variant used before text/javascript was formally registered.",
        supersededBy: "text/javascript",
      },
      {
        type: "application/ecmascript",
        extensions: [".es", ".ecma"],
        description: "ECMAScript MIME type registered alongside application/javascript. Both obsoleted by RFC 9239.",
        supersededBy: "text/javascript",
      },
      {
        type: "text/ecmascript",
        extensions: [".es", ".ecma"],
        description: "Text-tree ECMAScript variant. Registered by RFC 4329, then obsoleted by RFC 9239.",
        supersededBy: "text/javascript",
      },
      {
        type: "application/x-gzip",
        extensions: [".gz", ".gzip"],
        description: "x- form of gzip that predates the IANA registration of application/gzip (RFC 6713).",
        supersededBy: "application/gzip",
      },
      {
        type: "application/x-zip-compressed",
        extensions: [".zip"],
        description: "Legacy ZIP type common in older browsers and servers. IANA registration uses application/zip.",
        supersededBy: "application/zip",
      },
      {
        type: "audio/x-wav",
        extensions: [".wav"],
        description: "x- prefix form of WAV audio used before audio/wav and audio/vnd.wav were registered.",
        supersededBy: "audio/wav",
      },
      {
        type: "audio/x-aiff",
        extensions: [".aif", ".aiff", ".aifc"],
        description: "x- variant for AIFF audio that predates the registered audio/aiff type.",
        supersededBy: "audio/aiff",
      },
      {
        type: "audio/x-mpeg",
        extensions: [".mp3"],
        description: "x- form for MPEG audio that predates the registration of audio/mpeg.",
        supersededBy: "audio/mpeg",
      },
      {
        type: "audio/m4a",
        extensions: [".m4a"],
        description: "Deprecated MIME type for MPEG-4 audio files. Superseded by the IANA-registered audio/mp4.",
        supersededBy: "audio/mp4",
      },
      {
        type: "audio/x-m4a",
        extensions: [".m4a"],
        description: "Deprecated x- variant for MPEG-4 audio. Both audio/m4a and audio/x-m4a should be replaced with audio/mp4.",
        supersededBy: "audio/mp4",
      },
      {
        type: "audio/x-ms-wma",
        extensions: [".wma"],
        description: "Windows Media Audio. Microsoft proprietary format; largely supplanted by open codecs.",
      },
      {
        type: "audio/x-pn-realaudio",
        extensions: [".ra", ".ram"],
        description: "RealAudio streaming format from RealNetworks. Practically obsolete since the early 2000s.",
      },
      {
        type: "image/x-icon",
        extensions: [".ico"],
        description: "Legacy ICO MIME type. The IANA-registered form is image/vnd.microsoft.icon, though x-icon remains widely used.",
        supersededBy: "image/vnd.microsoft.icon",
      },
      {
        type: "image/pjpeg",
        extensions: [".jpg", ".jpeg"],
        description: "Progressive JPEG variant reported by older Internet Explorer versions. Standard clients use image/jpeg.",
        supersededBy: "image/jpeg",
      },
      {
        type: "video/x-msvideo",
        extensions: [".avi"],
        description: "AVI video container with x- prefix. No formal IANA standard exists; video/avi is sometimes used instead.",
        supersededBy: "video/avi",
      },
      {
        type: "video/x-flv",
        extensions: [".flv"],
        description: "Adobe Flash Video. Obsolete since Adobe ended Flash support on December 31, 2020.",
      },
      {
        type: "application/x-shockwave-flash",
        extensions: [".swf"],
        description: "Adobe Flash (SWF). Completely obsolete; all major browsers removed Flash support in 2020–2021.",
      },
      {
        type: "text/x-vcard",
        extensions: [".vcf", ".vcard"],
        description: "Early vCard contact format that predates the IANA registration of text/vcard (RFC 6350).",
        supersededBy: "text/vcard",
      },
      {
        type: "text/x-vcalendar",
        extensions: [".vcs"],
        description: "Legacy vCalendar type superseded when iCalendar (RFC 5545) standardized text/calendar.",
        supersededBy: "text/calendar",
      },
      {
        type: "application/x-font-ttf",
        extensions: [".ttf"],
        description: "x- form of TrueType fonts used before the font/* top-level type was registered.",
        supersededBy: "font/ttf",
      },
      {
        type: "application/x-font-otf",
        extensions: [".otf"],
        description: "x- form of OpenType fonts that predates the font/* top-level type.",
        supersededBy: "font/otf",
      },
      {
        type: "application/x-font-woff",
        extensions: [".woff"],
        description: "x- form of WOFF used before font/woff was registered in RFC 8081.",
        supersededBy: "font/woff",
      },
    ],
  },
];
