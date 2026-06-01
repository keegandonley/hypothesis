import { describe, expect, it } from "vitest";
import {
  buildTags, DEFAULT, OG_TYPES, TWITTER_CARDS, type OgData,
} from "@/lib/og";

describe("buildTags", () => {
  it("returns only type and twitterCard for DEFAULT data", () => {
    const result = buildTags(DEFAULT);
    expect(result).toContain("og:type");
    expect(result).toContain("twitter:card");
    expect(result).not.toContain("og:title");
  });

  it("generates og:title meta tag", () => {
    const data: OgData = { ...DEFAULT, title: "My Page" };
    const result = buildTags(data);
    expect(result).toContain('property="og:title"');
    expect(result).toContain('content="My Page"');
  });

  it("generates og:description meta tag", () => {
    const data: OgData = { ...DEFAULT, description: "A description" };
    const result = buildTags(data);
    expect(result).toContain('property="og:description"');
    expect(result).toContain('content="A description"');
  });

  it("generates og:image meta tag", () => {
    const data: OgData = { ...DEFAULT, image: "https://example.com/img.png" };
    const result = buildTags(data);
    expect(result).toContain('property="og:image"');
  });

  it("generates og:url meta tag", () => {
    const data: OgData = { ...DEFAULT, url: "https://example.com" };
    const result = buildTags(data);
    expect(result).toContain('property="og:url"');
  });

  it("generates og:site_name meta tag", () => {
    const data: OgData = { ...DEFAULT, siteName: "My Site" };
    const result = buildTags(data);
    expect(result).toContain('property="og:site_name"');
  });

  it("generates og:type meta tag", () => {
    const data: OgData = { ...DEFAULT, type: "article" };
    const result = buildTags(data);
    expect(result).toContain('property="og:type"');
    expect(result).toContain('content="article"');
  });

  it("generates twitter:card with name attribute", () => {
    const data: OgData = { ...DEFAULT, twitterCard: "summary" };
    const result = buildTags(data);
    expect(result).toContain('name="twitter:card"');
    expect(result).toContain('content="summary"');
  });

  it("generates twitter:title with name attribute", () => {
    const data: OgData = { ...DEFAULT, title: "My Page" };
    const result = buildTags(data);
    expect(result).toContain('name="twitter:title"');
  });

  it("generates twitter:site when provided", () => {
    const data: OgData = { ...DEFAULT, twitterSite: "@handle" };
    const result = buildTags(data);
    expect(result).toContain('name="twitter:site"');
    expect(result).toContain('content="@handle"');
  });

  it("escapes quotes in content values", () => {
    const data: OgData = { ...DEFAULT, title: 'Title with "quotes"' };
    const result = buildTags(data);
    expect(result).toContain("&quot;");
  });

  it("generates all tags for fully populated data", () => {
    const data: OgData = {
      title: "Test",
      description: "Desc",
      image: "https://example.com/img.png",
      url: "https://example.com",
      siteName: "Example",
      type: "website",
      twitterCard: "summary_large_image",
      twitterSite: "@example",
    };
    const result = buildTags(data);
    expect(result.split("\n")).toHaveLength(11);
    expect(result).toContain("og:title");
    expect(result).toContain("og:description");
    expect(result).toContain("og:image");
    expect(result).toContain("og:url");
    expect(result).toContain("og:site_name");
    expect(result).toContain("og:type");
    expect(result).toContain("twitter:card");
    expect(result).toContain("twitter:title");
    expect(result).toContain("twitter:description");
    expect(result).toContain("twitter:image");
    expect(result).toContain("twitter:site");
  });
});

describe("OG_TYPES", () => {
  it("has 6 types", () => {
    expect(OG_TYPES).toHaveLength(6);
    expect(OG_TYPES).toContain("website");
    expect(OG_TYPES).toContain("article");
  });
});

describe("TWITTER_CARDS", () => {
  it("has 4 card types", () => {
    expect(TWITTER_CARDS).toHaveLength(4);
    expect(TWITTER_CARDS).toContain("summary_large_image");
  });
});
