export interface TextStats {
  characters: { total: number; withoutSpaces: number };
  words: number;
  lines: number;
  sentences: number;
  paragraphs: number;
  readingTime: { minutes: number; seconds: number };
  speakingTime: { minutes: number; seconds: number };
  avgWordLength: number;
  longestWord: string;
  wordFrequency: { word: string; count: number }[];
  charFrequency: { char: string; count: number }[];
}

export const DEFAULT_WPM = 250;
export const SPEAKING_WPM = 150;

export function analyzeText(text: string, wpm: number): TextStats {
  if (!text) {
    return {
      characters: { total: 0, withoutSpaces: 0 },
      words: 0,
      lines: 0,
      sentences: 0,
      paragraphs: 0,
      readingTime: { minutes: 0, seconds: 0 },
      speakingTime: { minutes: 0, seconds: 0 },
      avgWordLength: 0,
      longestWord: "",
      wordFrequency: [],
      charFrequency: [],
    };
  }

  const total = text.length;
  const withoutSpaces = text.replace(/\s/g, "").length;

  const wordsArray = text.split(/\s+/).filter((w) => w.length > 0);
  const words = wordsArray.length;

  const lines = text.split("\n").length;

  const sentences = text
    .split(/[.!?]+/)
    .filter((s) => s.trim().length > 0).length;

  const paragraphs = text
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0).length;

  const readingMinutes = words / wpm;
  const readingMins = Math.floor(readingMinutes);
  const readingSecs = Math.round((readingMinutes - readingMins) * 60);

  const speakingMinutes = words / SPEAKING_WPM;
  const speakingMins = Math.floor(speakingMinutes);
  const speakingSecs = Math.round((speakingMinutes - speakingMins) * 60);

  const totalWordLength = wordsArray.reduce(
    (sum, word) => sum + word.length,
    0,
  );
  const avgWordLength = words > 0 ? totalWordLength / words : 0;

  const longestWord = wordsArray
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter((w) => w.length > 0)
    .reduce(
      (longest, word) => (word.length > longest.length ? word : longest),
      "",
    );

  const wordMap = new Map<string, number>();

  wordsArray.forEach((word) => {
    const clean = word.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (clean.length > 0) {
      wordMap.set(clean, (wordMap.get(clean) || 0) + 1);
    }
  });
  const wordFrequency = Array.from(wordMap.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const charMap = new Map<string, number>();

  for (const char of text) {
    if (char !== " " && char !== "\n" && char !== "\t") {
      charMap.set(char, (charMap.get(char) || 0) + 1);
    }
  }

  const charFrequency = Array.from(charMap.entries())
    .map(([char, count]) => ({ char, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  return {
    characters: { total, withoutSpaces },
    words,
    lines,
    sentences,
    paragraphs,
    readingTime: { minutes: readingMins, seconds: readingSecs },
    speakingTime: { minutes: speakingMins, seconds: speakingSecs },
    avgWordLength,
    longestWord,
    wordFrequency,
    charFrequency,
  };
}
