import { useEffect, useRef, useState } from "react";
import { ToolHead } from "@/components/ToolHead";
import styles from "../../styles/og.module.css";
import { DocIcon } from "@/components/icons/doc";
import Link from "next/link";
import { useBranding } from "@/lib/branding";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

interface OgData {
  title: string;
  description: string;
  image: string;
  url: string;
  siteName: string;
  type: string;
  twitterCard: string;
  twitterSite: string;
}

const DEFAULT: OgData = {
  title: "",
  description: "",
  image: "",
  url: "",
  siteName: "",
  type: "website",
  twitterCard: "summary_large_image",
  twitterSite: "",
};

const OG_TYPES = ["website", "article", "profile", "book", "music.song", "video.movie"];
const TWITTER_CARDS = ["summary", "summary_large_image", "app", "player"];

function buildTags(d: OgData): string {
  const lines: string[] = [];
  const add = (prop: string, val: string, isName = false) => {
    if (!val.trim()) return;
    const attr = isName ? `name` : `property`;
    lines.push(`<meta ${attr}="${prop}" content="${val.replace(/"/g, "&quot;")}" />`);
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

export default function OgPage() {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const [data, setData] = useState<OgData>(DEFAULT);
  const [pageUrl, setPageUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tagsCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tags = buildTags(data);
  const hasImage = data.image.trim().length > 0;

  const buildUrl = (d: OgData) => {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(d))));
    return `${window.location.origin}${window.location.pathname}?v=${encodeURIComponent(encoded)}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");
    if (v) {
      try {
        const parsed = JSON.parse(decodeURIComponent(escape(atob(v))));
        setData((prev) => ({ ...prev, ...parsed }));
      } catch { /* ignore */ }
    }
    setPageUrl(window.location.href);
  }, []);

  const update = (field: keyof OgData, value: string) => {
    const next = { ...data, [field]: value };
    setData(next);
    const newUrl = buildUrl(next);
    history.replaceState(null, "", newUrl);
    setPageUrl(newUrl);
  };

  const handleCopy = () => {
    copyToClipboard(pageUrl).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleReset = () => {
    setData(DEFAULT);
    const newUrl = `${window.location.origin}${window.location.pathname}`;
    history.replaceState(null, "", newUrl);
    setPageUrl(newUrl);
  };

  const handleCopyTags = () => {
    copyToClipboard(tags).then(() => {
      setCopiedTags(true);
      if (tagsCopyTimeoutRef.current) clearTimeout(tagsCopyTimeoutRef.current);
      tagsCopyTimeoutRef.current = setTimeout(() => setCopiedTags(false), 1500);
    });
  };

  return (
    <div className={styles.page}>
      <ToolHead
        title="OG Tag Generator"
        description="Generate Open Graph and Twitter Card meta tags for your web pages. Free online OG tag generator — no installation required. No data sent to servers."
        path="/og"
        brandName={branding.name}
      />

      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
          <Link href="/" target={isIframe ? "_blank" : undefined} rel={isIframe ? "noopener noreferrer" : undefined} className={styles.domainLink}>
            {branding.domain}
          </Link>
          {"·"}
          <Link href="/docs/og" className={styles.docsLink} target="_blank" rel="noopener noreferrer">
            <DocIcon className={styles.icon} /> docs
          </Link>
        </div>
        <h1 className={styles.title}>OG Tags</h1>
        <p className={styles.tagline}>Generate Open Graph and Twitter Card meta tags for any page</p>
      </div>

      <hr className={styles.divider} />

      <div className={styles.body}>
        <div className={styles.formCol}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Title</label>
            <input className={styles.input} value={data.title} onChange={(e) => update("title", e.target.value)} placeholder="My Page Title" autoComplete="off" />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Description</label>
            <textarea className={styles.inputArea} value={data.description} onChange={(e) => update("description", e.target.value)} placeholder="A brief description of this page." rows={2} />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Image URL</label>
            <input className={styles.input} value={data.image} onChange={(e) => update("image", e.target.value)} placeholder="https://example.com/og-image.png" autoComplete="off" />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Page URL</label>
            <input className={styles.input} value={data.url} onChange={(e) => update("url", e.target.value)} placeholder="https://example.com/page" autoComplete="off" />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Site Name</label>
              <input className={styles.input} value={data.siteName} onChange={(e) => update("siteName", e.target.value)} placeholder="My Site" autoComplete="off" />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Twitter @handle</label>
              <input className={styles.input} value={data.twitterSite} onChange={(e) => update("twitterSite", e.target.value)} placeholder="@myhandle" autoComplete="off" />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>OG Type</label>
              <select className={styles.select} value={data.type} onChange={(e) => update("type", e.target.value)}>
                {OG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Twitter Card</label>
              <select className={styles.select} value={data.twitterCard} onChange={(e) => update("twitterCard", e.target.value)}>
                {TWITTER_CARDS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.outputCol}>
          <div className={styles.preview}>
            <div className={styles.previewCard}>
              {hasImage && (
                <div className={styles.previewImage} style={{ backgroundImage: `url(${data.image})` }} />
              )}
              <div className={styles.previewBody}>
                {data.siteName && <span className={styles.previewSite}>{data.siteName}</span>}
                <div className={styles.previewTitle}>{data.title || "Page Title"}</div>
                <div className={styles.previewDesc}>{data.description || "Page description will appear here."}</div>
                {data.url && <span className={styles.previewUrl}>{data.url}</span>}
              </div>
            </div>
            <span className={styles.previewLabel}>Social preview (approximate)</span>
          </div>

          <div className={styles.outputBlock}>
            <div className={styles.outputHeader}>
              <span className={styles.outputLabel}>Meta Tags</span>
              {!isIframe && (
                <button className={`${styles.panelCopyBtn}${copiedTags ? ` ${styles.panelCopied}` : ""}`} onClick={handleCopyTags} disabled={!tags}>
                  {copiedTags ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <pre className={styles.code}>{tags || "Fill in fields above to generate tags"}</pre>
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      <div className={styles.permalinkRow} data-permalink-row>
        <span className={styles.fieldLabel}>Permalink</span>
        <span className={styles.permalinkUrl}>{pageUrl}</span>
        {!isIframe && (
          <button
            className={`${styles.copyBtn}${copied ? ` ${styles.copied}` : ""}`}
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
        <button className={styles.resetBtn} onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
