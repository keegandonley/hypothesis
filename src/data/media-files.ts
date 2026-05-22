export interface MediaFile {
  filename: string;
  url: string;
  description: string;
}

export interface MediaFileGroup {
  id: string;
  label: string;
  color: string;
  subtle: string;
  border: string;
  files: MediaFile[];
}

export const MEDIA_FILE_GROUPS: MediaFileGroup[] = [
  {
    id: "standard",
    label: "Standard",
    color: "#60a5fa",
    subtle: "#60a5fa18",
    border: "#60a5fa33",
    files: [
      {
        filename: "bbb-short.mp4",
        url: "https://example.hypothesis.donley.xyz/bbb-short.mp4",
        description:
          "Short clip of the standard file. Useful for quick tests where the full-length file is too long.",
      },
      {
        filename: "bbb.mp4",
        url: "https://example.hypothesis.donley.xyz/bbb.mp4",
        description:
          "Standard H.264/AAC MP4 with the moov atom at the end of the file. The browser must download to the end before it can read metadata and begin playback.",
      },
    ],
  },
  {
    id: "fast-start",
    label: "Fast-Start",
    color: "#34d399",
    subtle: "#34d39918",
    border: "#34d39933",
    files: [
      {
        filename: "bbb-short-fast.mp4",
        url: "https://example.hypothesis.donley.xyz/bbb-short-fast.mp4",
        description:
          "Short clip with the moov atom at the front. Fast-start variant of the short file.",
      },
      {
        filename: "bbb-fast.mp4",
        url: "https://example.hypothesis.donley.xyz/bbb-fast.mp4",
        description:
          "Fast-start MP4 with the moov atom relocated to the front of the file. The browser can begin buffering and playing immediately without waiting for the full file to download.",
      },
    ],
  },
  {
    id: "ogg-vorbis",
    label: "Ogg Vorbis",
    color: "#c084fc",
    subtle: "#c084fc18",
    border: "#c084fc33",
    files: [
      {
        filename: "livery-stable-blues.ogg",
        url: "https://example.hypothesis.donley.xyz/livery-stable-blues.ogg",
        description:
          "Ogg Vorbis audio file. For testing HTML audio element behavior and streaming.",
      },
    ],
  },
  {
    id: "mp3",
    label: "MP3",
    color: "#fb923c",
    subtle: "#fb923c18",
    border: "#fb923c33",
    files: [
      {
        filename: "bull-frog-blues.mp3",
        url: "https://example.hypothesis.donley.xyz/bull-frog-blues.mp3",
        description:
          "MP3 audio file. For testing HTML audio element behavior with the MP3 format.",
      },
    ],
  },
  {
    id: "wav",
    label: "WAV",
    color: "#f472b6",
    subtle: "#f472b618",
    border: "#f472b633",
    files: [
      {
        filename: "bull-frog-blues.wav",
        url: "https://example.hypothesis.donley.xyz/bull-frog-blues.wav",
        description:
          "Uncompressed WAV audio file. Larger than compressed formats; useful for testing raw PCM playback and audio element behavior.",
      },
    ],
  },
];

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
  {
    filename: "bull-frog-blues.mp3",
    url: "https://example.hypothesis.donley.xyz/bull-frog-blues.mp3",
    type: "audio" as const,
    label: "mp3",
    short: false,
  },
  {
    filename: "bull-frog-blues.wav",
    url: "https://example.hypothesis.donley.xyz/bull-frog-blues.wav",
    type: "audio" as const,
    label: "wav",
    short: false,
  },
] as const;
