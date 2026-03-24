import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import styles from "@/styles/reference.module.css";
import { useBranding } from "@/lib/branding";
import { MIME_CATEGORIES } from "@/data/mime-types";

export default function MimeTypesPage() {
  const branding = useBranding();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const cat = params.get("cat");
    if (q) setSearch(q);
    if (cat) setActiveCategory(cat);
  }, []);

  function updateUrl(q: string, cat: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cat !== "all") params.set("cat", cat);
    const qs = params.toString();
    history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }

  function handleSearch(value: string) {
    setSearch(value);
    updateUrl(value, activeCategory);
  }

  function handleCategoryToggle(cat: string) {
    const next = activeCategory === cat ? "all" : cat;
    setActiveCategory(next);
    updateUrl(search, next);
  }

  const filteredSections = useMemo(() => {
    const q = search.toLowerCase().trim();
    return MIME_CATEGORIES.map((cat) => {
      const types = cat.types.filter((t) => {
        if (activeCategory !== "all" && activeCategory !== cat.category)
          return false;
        if (!q) return true;
        return (
          t.type.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.extensions.some((e) => e.toLowerCase().includes(q))
        );
      });
      return { ...cat, types };
    }).filter((s) => s.types.length > 0);
  }, [search, activeCategory]);

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — MIME TYPES`}</title>
        <meta
          name="description"
          content="Complete reference for MIME content types with extensions and descriptions."
        />
        <meta property="og:title" content="MIME Types" />
        <meta
          property="og:description"
          content="Complete reference for MIME content types: text, application, image, audio, video, font."
        />
        <meta
          property="og:url"
          content="https://hypothesis.sh/references/mime-types"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="MIME Types" />
        <link
          rel="canonical"
          href="https://hypothesis.sh/references/mime-types"
        />
      </Head>

      <div className={styles.inner}>
        <nav className={styles.nav} data-eyebrow>
          <Link href="/" className={styles.backLink}>
            <span>←</span> {branding.name}
          </Link>
          <span className={styles.refBadge}>reference</span>
        </nav>

        <hr className={styles.divider} />

        <div className={styles.header}>
          <h1 className={styles.title}>MIME Types</h1>
          <p className={styles.tagline}>
            Content-Type values for text, images, audio, video, fonts, and
            more.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by type, extension, or description..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            {search && (
              <button
                className={styles.clearBtn}
                onClick={() => handleSearch("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className={styles.classFilters}>
            <button
              className={`${styles.classBtn} ${activeCategory === "all" ? styles.classBtnActive : ""}`}
              onClick={() => handleCategoryToggle("all")}
            >
              All
            </button>
            {MIME_CATEGORIES.map((cat) => (
              <button
                key={cat.category}
                className={`${styles.classBtn} ${activeCategory === cat.category ? styles.classBtnActive : ""}`}
                style={
                  {
                    "--cls-color": cat.color,
                    "--cls-subtle": cat.subtle,
                  } as React.CSSProperties
                }
                onClick={() => handleCategoryToggle(cat.category)}
              >
                {cat.badge}
                <span className={styles.classBtnLabel}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.content}>
          {filteredSections.length === 0 ? (
            <div className={styles.empty}>
              No types match &ldquo;{search}&rdquo;
            </div>
          ) : (
            filteredSections.map((section) => (
              <div key={section.category} className={styles.section}>
                <div
                  className={styles.sectionHeader}
                  style={
                    {
                      "--cls-color": section.color,
                      "--cls-subtle": section.subtle,
                      "--cls-border": section.border,
                    } as React.CSSProperties
                  }
                >
                  <span className={styles.sectionClass}>{section.badge}</span>
                  <span className={styles.sectionLabel}>{section.label}</span>
                  <span className={styles.sectionCount}>
                    {section.types.length}{" "}
                    {section.types.length === 1 ? "type" : "types"}
                  </span>
                </div>

                <div className={styles.codeList}>
                  {section.types.map((t) => (
                    <div
                      key={t.type}
                      className={styles.codeRowFull}
                      style={
                        {
                          "--cls-color": section.color,
                          "--cls-subtle": section.subtle,
                          "--cls-border": section.border,
                        } as React.CSSProperties
                      }
                    >
                      <div className={styles.codeInfo}>
                        <span className={styles.codeNameMono}>{t.type}</span>
                        <span className={styles.codeDesc}>
                          {t.description}
                        </span>
                        {t.extensions.length > 0 && (
                          <div className={styles.extList}>
                            {t.extensions.map((ext) => (
                              <span key={ext} className={styles.ext}>
                                {ext}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
