import { useEffect, useRef, useState } from "react";
import styles from "@/styles/og.module.css";
import { Button, CopyButton, PageLayout, PermalinkRow } from "@/components/ui";
import { type OgData, DEFAULT, OG_TYPES, TWITTER_CARDS, buildTags } from "@/lib/og";
import { useUrlSync } from "@/lib/useUrlSync";

export default function OgPage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const [data, setData] = useState<OgData>(DEFAULT);
  const [pageUrl, setPageUrl] = useState("");


  const tags = buildTags(data);
  const hasImage = data.image.trim().length > 0;

  const buildUrl = (d: OgData): string => {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(d))));

    return `${window.location.origin}${window.location.pathname}?v=${encodeURIComponent(encoded)}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v");

    if (v) {
      try {
        const parsed = JSON.parse(
          // eslint-disable-next-line @typescript-eslint/no-deprecated
          decodeURIComponent(escape(atob(v))),
        ) as Record<string, unknown>;

        setData((prev) => ({ ...prev, ...parsed })); // eslint-disable-line react-hooks/set-state-in-effect
      } catch {
        /* ignore */
      }
    }

    setPageUrl(window.location.href);
  }, []);

  const update = (field: keyof OgData, value: string): void => {
    const next = { ...data, [field]: value };

    setData(next);
    const newUrl = buildUrl(next);

    replaceUrl(newUrl);
    setPageUrl(newUrl);
  };



  const handleReset = (): void => {
    setData(DEFAULT);
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    replaceUrlNow(newUrl);
    setPageUrl(newUrl);
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="OG Tag Generator"
        metaDescription="Generate Open Graph and Twitter Card meta tags for your web pages. Free online OG tag generator — no installation required. No data sent to servers."
        path="/og"
        h1="OG Tags"
        tagline="Generate Open Graph and Twitter Card meta tags for any page"
      >

      <div className={styles.body}>
        <div className={styles.formCol}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Title</label>
            <input
              className={styles.input}
              value={data.title}
              onChange={(e) => {
                update("title", e.target.value);
              }}
              placeholder="My Page Title"
              autoComplete="off"
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Description</label>
            <textarea
              className={styles.inputArea}
              value={data.description}
              onChange={(e) => {
                update("description", e.target.value);
              }}
              placeholder="A brief description of this page."
              rows={2}
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Image URL</label>
            <input
              className={styles.input}
              value={data.image}
              onChange={(e) => {
                update("image", e.target.value);
              }}
              placeholder="https://example.com/og-image.png"
              autoComplete="off"
            />
          </div>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Page URL</label>
            <input
              className={styles.input}
              value={data.url}
              onChange={(e) => {
                update("url", e.target.value);
              }}
              placeholder="https://example.com/page"
              autoComplete="off"
            />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Site Name</label>
              <input
                className={styles.input}
                value={data.siteName}
                onChange={(e) => {
                  update("siteName", e.target.value);
                }}
                placeholder="My Site"
                autoComplete="off"
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Twitter @handle</label>
              <input
                className={styles.input}
                value={data.twitterSite}
                onChange={(e) => {
                  update("twitterSite", e.target.value);
                }}
                placeholder="@myhandle"
                autoComplete="off"
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>OG Type</label>
              <select
                className={styles.select}
                value={data.type}
                onChange={(e) => {
                  update("type", e.target.value);
                }}
              >
                {OG_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Twitter Card</label>
              <select
                className={styles.select}
                value={data.twitterCard}
                onChange={(e) => {
                  update("twitterCard", e.target.value);
                }}
              >
                {TWITTER_CARDS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className={styles.outputCol}>
          <div className={styles.preview}>
            <div className={styles.previewCard}>
              {hasImage && (
                <div
                  className={styles.previewImage}
                  style={{ backgroundImage: `url(${data.image})` }}
                />
              )}
              <div className={styles.previewBody}>
                {data.siteName && (
                  <span className={styles.previewSite}>{data.siteName}</span>
                )}
                <div className={styles.previewTitle}>
                  {data.title || "Page Title"}
                </div>
                <div className={styles.previewDesc}>
                  {data.description || "Page description will appear here."}
                </div>
                {data.url && (
                  <span className={styles.previewUrl}>{data.url}</span>
                )}
              </div>
            </div>
            <span className={styles.previewLabel}>
              Social preview (approximate)
            </span>
          </div>

          <div className={styles.outputBlock}>
            <div className={styles.outputHeader}>
              <span className={styles.outputLabel}>Meta Tags</span>
              <CopyButton value={tags} variant="ghost" size="xs" disabled={!tags} />
            </div>
            <pre className={styles.code}>
              {tags || "Fill in fields above to generate tags"}
            </pre>
          </div>
        </div>
      </div>

      <hr className={styles.divider} />

      <PermalinkRow url={pageUrl} onReset={handleReset} />
      </PageLayout>
    </div>
  );
}
