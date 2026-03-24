import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import styles from "@/styles/reference.module.css";
import { useBranding } from "@/lib/branding";
import { CSS_SELECTOR_GROUPS } from "@/data/css-selectors";

export default function CssSelectorsPage() {
  const branding = useBranding();
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const grp = params.get("grp");
    if (q) setSearch(q);
    if (grp) setActiveGroup(grp);
  }, []);

  function updateUrl(q: string, grp: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (grp !== "all") params.set("grp", grp);
    const qs = params.toString();
    history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }

  function handleSearch(value: string) {
    setSearch(value);
    updateUrl(value, activeGroup);
  }

  function handleGroupToggle(grp: string) {
    const next = activeGroup === grp ? "all" : grp;
    setActiveGroup(next);
    updateUrl(search, next);
  }

  const filteredSections = useMemo(() => {
    const q = search.toLowerCase().trim();
    return CSS_SELECTOR_GROUPS.map((group) => {
      const selectors = group.selectors.filter((s) => {
        if (activeGroup !== "all" && activeGroup !== group.id) return false;
        if (!q) return true;
        return (
          s.selector.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.example.toLowerCase().includes(q) ||
          s.specificity.toLowerCase().includes(q)
        );
      });
      return { ...group, selectors };
    }).filter((g) => g.selectors.length > 0);
  }, [search, activeGroup]);

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — CSS SELECTORS`}</title>
        <meta
          name="description"
          content="CSS selector reference: type, class, ID, attribute, pseudo-class, pseudo-element, and combinator selectors with specificity."
        />
        <meta property="og:title" content="CSS Selectors" />
        <meta
          property="og:description"
          content="CSS selectors quick reference — basic, attribute, pseudo-class, pseudo-element, and combinator selectors with specificity values."
        />
        <meta
          property="og:url"
          content="https://hypothesis.sh/references/css-selectors"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="CSS Selectors" />
        <link
          rel="canonical"
          href="https://hypothesis.sh/references/css-selectors"
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
          <h1 className={styles.title}>CSS Selectors</h1>
          <p className={styles.tagline}>
            All selector types with descriptions, examples, and specificity values.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by selector, description, or example..."
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
              className={`${styles.classBtn} ${activeGroup === "all" ? styles.classBtnActive : ""}`}
              onClick={() => handleGroupToggle("all")}
            >
              All
            </button>
            {CSS_SELECTOR_GROUPS.map((group) => (
              <button
                key={group.id}
                className={`${styles.classBtn} ${activeGroup === group.id ? styles.classBtnActive : ""}`}
                style={
                  {
                    "--cls-color": group.color,
                    "--cls-subtle": group.subtle,
                  } as React.CSSProperties
                }
                onClick={() => handleGroupToggle(group.id)}
              >
                {group.id}
                <span className={styles.classBtnLabel}>{group.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.content}>
          {filteredSections.length === 0 ? (
            <div className={styles.empty}>
              No selectors match &ldquo;{search}&rdquo;
            </div>
          ) : (
            filteredSections.map((group) => (
              <div key={group.id} className={styles.section}>
                <div
                  className={styles.sectionHeader}
                  style={
                    {
                      "--cls-color": group.color,
                      "--cls-subtle": group.subtle,
                      "--cls-border": group.border,
                    } as React.CSSProperties
                  }
                >
                  <span className={styles.sectionClass}>{group.id}</span>
                  <span className={styles.sectionLabel}>{group.label}</span>
                  <span className={styles.sectionCount}>
                    {group.selectors.length}{" "}
                    {group.selectors.length === 1 ? "selector" : "selectors"}
                  </span>
                </div>

                <div className={styles.codeList}>
                  {group.selectors.map((sel) => (
                    <div
                      key={sel.selector}
                      className={styles.codeRow}
                      style={
                        {
                          "--cls-color": group.color,
                          "--cls-subtle": group.subtle,
                          "--cls-border": group.border,
                          gridTemplateColumns: "80px 1fr",
                        } as React.CSSProperties
                      }
                    >
                      <span className={styles.codeBadge} style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>
                        {sel.selector}
                      </span>
                      <div className={styles.codeInfo}>
                        <div className={styles.flagRow}>
                          <span className={styles.codeDesc}>
                            {sel.description}
                          </span>
                        </div>
                        <div className={styles.flagRow}>
                          <code className={styles.codeDesc} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", opacity: 0.7 }}>
                            {sel.example}
                          </code>
                        </div>
                        <div className={styles.flagRow}>
                          <span className={styles.flagBadge} style={{ color: group.color, backgroundColor: group.subtle, borderColor: group.border }}>
                            specificity: {sel.specificity}
                          </span>
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
