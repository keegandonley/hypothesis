import { describe, expect, it } from "vitest";
import { analyzeText, DEFAULT_WPM, SPEAKING_WPM } from "@/lib/text-stats";

describe("analyzeText", () => {
  it("returns zeroed stats for empty input", () => {
    const stats = analyzeText("", DEFAULT_WPM);

    expect(stats.characters.total).toBe(0);
    expect(stats.words).toBe(0);
    expect(stats.lines).toBe(0);
    expect(stats.sentences).toBe(0);
  });

  it("counts characters correctly", () => {
    const stats = analyzeText("hello world", DEFAULT_WPM);

    expect(stats.characters.total).toBe(11);
    expect(stats.characters.withoutSpaces).toBe(10);
  });

  it("counts words correctly", () => {
    const stats = analyzeText("the quick brown fox", DEFAULT_WPM);

    expect(stats.words).toBe(4);
  });

  it("counts lines correctly", () => {
    const stats = analyzeText("line1\nline2\nline3", DEFAULT_WPM);

    expect(stats.lines).toBe(3);
  });

  it("counts sentences correctly", () => {
    const stats = analyzeText("Hello. World! How are you?", DEFAULT_WPM);

    expect(stats.sentences).toBe(3);
  });

  it("counts paragraphs correctly", () => {
    const stats = analyzeText("Para 1.\n\nPara 2.\n\nPara 3.", DEFAULT_WPM);

    expect(stats.paragraphs).toBe(3);
  });

  it("computes reading time", () => {
    // 250 words at 250 WPM = 1 minute
    const words = Array.from({ length: 250 }, () => "word").join(" ");
    const stats = analyzeText(words, DEFAULT_WPM);

    expect(stats.readingTime.minutes).toBe(1);
  });

  it("computes average word length", () => {
    const stats = analyzeText("a bb ccc", DEFAULT_WPM);

    expect(stats.avgWordLength).toBeCloseTo(2, 0);
  });

  it("finds longest word", () => {
    const stats = analyzeText("a bb ccc dddd", DEFAULT_WPM);

    expect(stats.longestWord).toBe("dddd");
  });

  it("computes word frequency", () => {
    const stats = analyzeText("the the the and and or", DEFAULT_WPM);

    expect(stats.wordFrequency[0].word).toBe("the");
    expect(stats.wordFrequency[0].count).toBe(3);
  });

  it("computes character frequency", () => {
    const stats = analyzeText("aaabbc", DEFAULT_WPM);

    expect(stats.charFrequency[0].count).toBe(3);
  });
});
