import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import styles from "@/styles/reference.module.css";
import { useBranding } from "@/lib/branding";
import { HEADER_CATEGORIES, HeaderDirection } from "@/data/http-headers";

const DIR_LABEL: Record<HeaderDirection, string> = {
  request: "req",
  response: "res",
  both: "both",
};

const DIR_COLOR: Record<HeaderDirection, string> = {
  request: "#60a5fa",
  response: "#34d399",
  both: "#a1a1aa",
};

const DIR_SUBTLE: Record<HeaderDirection, string> = {
  request: "#60a5fa18",
  response: "#34d39918",
  both: "#a1a1aa18",
};

const DIR_BORDER: Record<HeaderDirection, string> = {
  request: "#60a5fa33",
  response: "#34d39933",
  both: "#a1a1aa33",
};

export default function HttpHeadersPage() {
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
    return HEADER_CATEGORIES.map((cat) => {
      const headers = cat.headers.filter((h) => {
        if (activeCategory !== "all" && activeCategory !== cat.id) return false;
        if (!q) return true;
        return (
          h.name.toLowerCase().includes(q) ||
          h.description.toLowerCase().includes(q) ||
          h.direction.includes(q)
        );
      });
      return { ...cat, headers };
    }).filter((s) => s.headers.length > 0);
  }, [search, activeCategory]);

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — HTTP HEADERS`}</title>
        <meta
          name="description"
          content="Complete reference for HTTP request and response headers with descriptions and direction indicators."
        />
        <meta property="og:title" content="HTTP Headers" />
        <meta
          property="og:description"
          content="Request and response header fields: caching, auth, CORS, security, content negotiation, and more."
        />
        <meta
          property="og:url"
          content="https://hypothesis.sh/references/http-headers"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="HTTP Headers" />
        <link
          rel="canonical"
          href="https://hypothesis.sh/references/http-headers"
        />
      </Head>

      <div className={styles.inner}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.backLink}>
            <span>←</span> {branding.name}
          </Link>
          <span className={styles.refBadge}>reference</span>
        </nav>

        <hr className={styles.divider} />

        <div className={styles.header}>
          <h1 className={styles.title}>HTTP Headers</h1>
          <p className={styles.tagline}>
            Request and response header fields: caching, authentication, CORS,
            security, and content negotiation.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by name or description..."
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
            {HEADER_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`${styles.classBtn} ${activeCategory === cat.id ? styles.classBtnActive : ""}`}
                style={
                  {
                    "--cls-color": cat.color,
                    "--cls-subtle": cat.subtle,
                  } as React.CSSProperties
                }
                onClick={() => handleCategoryToggle(cat.id)}
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
              No headers match &ldquo;{search}&rdquo;
            </div>
          ) : (
            filteredSections.map((section) => (
              <div key={section.id} className={styles.section}>
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
                    {section.headers.length}{" "}
                    {section.headers.length === 1 ? "header" : "headers"}
                  </span>
                </div>

                <div className={styles.codeList}>
                  {section.headers.map((h) => (
                    <div
                      key={h.name}
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
                        <span className={styles.codeNameMono}>{h.name}</span>
                        <span className={styles.codeDesc}>{h.description}</span>
                        <div className={styles.flagRow}>
                          <span
                            className={styles.flagBadge}
                            style={
                              {
                                color: DIR_COLOR[h.direction],
                                backgroundColor: DIR_SUBTLE[h.direction],
                                borderColor: DIR_BORDER[h.direction],
                              } as React.CSSProperties
                            }
                          >
                            {DIR_LABEL[h.direction]}
                          </span>
                          {h.deprecated && (
                            <span className={styles.flagBadge}>deprecated</span>
                          )}
                          {h.experimental && (
                            <span
                              className={styles.flagBadge}
                              style={
                                {
                                  color: "#fbbf24",
                                  backgroundColor: "#fbbf2418",
                                  borderColor: "#fbbf2433",
                                } as React.CSSProperties
                              }
                            >
                              experimental
                            </span>
                          )}
                        </div>
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
