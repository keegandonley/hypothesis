export interface OgData {
  title: string;
  description: string;
  image: string;
  url: string;
  siteName: string;
  type: string;
  twitterCard: string;
  twitterSite: string;
}

export const DEFAULT: OgData = {
  title: "",
  description: "",
  image: "",
  url: "",
  siteName: "",
  type: "website",
  twitterCard: "summary_large_image",
  twitterSite: "",
};

export const OG_TYPES = [
  "website",
  "article",
  "profile",
  "book",
  "music.song",
  "video.movie",
];

export const TWITTER_CARDS = ["summary", "summary_large_image", "app", "player"];

export function buildTags(d: OgData): string {
  const lines: string[] = [];
  const add = (prop: string, val: string, isName = false): void => {
    if (!val.trim()) return;
    const attr = isName ? "name" : "property";

    lines.push(
      `<meta ${attr}="${prop}" content="${val.replace(/"/g, "&quot;")}" />`,
    );
  };

  add("og:title", d.title);
  add("og:description", d.description);
  add("og:image", d.image);
  add("og:url", d.url);
  add("og:site_name", d.siteName);
  add("og:type", d.type);
  add("twitter:card", d.twitterCard, true);
  add("twitter:title", d.title, true);
  add("twitter:description", d.description, true);
  add("twitter:image", d.image, true);
  if (d.twitterSite) add("twitter:site", d.twitterSite, true);

  return lines.join("\n");
}
