export const MEDIA_FILES = [
  {
    filename: "bbb-short.mp4",
    url: "https://example.hypothesis.donley.xyz/bbb-short.mp4",
    type: "video" as const,
    label: "standard",
    short: true,
  },
  {
    filename: "bbb-short-fast.mp4",
    url: "https://example.hypothesis.donley.xyz/bbb-short-fast.mp4",
    type: "video" as const,
    label: "fast-start",
    short: true,
  },
  {
    filename: "bbb.mp4",
    url: "https://example.hypothesis.donley.xyz/bbb.mp4",
    type: "video" as const,
    label: "standard",
    short: false,
  },
  {
    filename: "bbb-fast.mp4",
    url: "https://example.hypothesis.donley.xyz/bbb-fast.mp4",
    type: "video" as const,
    label: "fast-start",
    short: false,
  },
  {
    filename: "livery-stable-blues.ogg",
    url: "https://example.hypothesis.donley.xyz/livery-stable-blues.ogg",
    type: "audio" as const,
    label: "ogg vorbis",
    short: false,
  },
] as const;
