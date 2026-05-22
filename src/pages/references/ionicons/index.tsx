import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import styles from "@/styles/reference.module.css";
import iStyles from "@/styles/ionicons.module.css";
import { useBranding } from "@/lib/branding";
import { IONICON_CATEGORIES } from "@/data/ionicons";

const VARIANT_LABELS = [
  { suffix: "", label: "filled" },
  { suffix: "-outline", label: "outline" },
  { suffix: "-sharp", label: "sharp" },
] as const;

export default function IoniconsPage() {
  const branding = useBranding();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [copiedName, setCopiedName] = useState<string | null>(null);

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

  async function handleCopy(name: string) {
    try {
      await navigator.clipboard.writeText(name);
    } catch {
      const el = document.createElement("textarea");
      el.value = name;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedName(name);
    setTimeout(
      () => setCopiedName((prev) => (prev === name ? null : prev)),
      1500,
    );
  }

  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim();
    return IONICON_CATEGORIES.map((cat) => {
      const icons = cat.icons.filter((name) => {
        if (activeCategory !== "all" && activeCategory !== cat.label)
          return false;
        if (!q) return true;
        return name.toLowerCase().includes(q);
      });
      return { ...cat, icons };
    }).filter((c) => c.icons.length > 0);
  }, [search, activeCategory]);

  const totalVisible = filteredCategories.reduce(
    (n, c) => n + c.icons.length,
    0,
  );
  const totalAll = IONICON_CATEGORIES.reduce((n, c) => n + c.icons.length, 0);

  const isLogoCategory = (label: string) => label === "Logos & Brands";

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — IONICONS`}</title>
        <meta
          name="description"
          content="Complete reference for all Ionicons available in @expo/vector-icons — searchable by name, filterable by category, with filled, outline, and sharp variants."
        />
        <meta property="og:title" content="Ionicons" />
        <meta
          property="og:description"
          content="All Ionicons available in @expo/vector-icons with filled, outline, and sharp variants."
        />
        <meta
          property="og:url"
          content="https://hypothesis.sh/references/ionicons"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Ionicons" />
        <link
          rel="canonical"
          href="https://hypothesis.sh/references/ionicons"
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
          <h1 className={styles.title}>Ionicons</h1>
          <p className={styles.tagline}>
            All icons available via{" "}
            <code style={{ fontSize: "11px" }}>@expo/vector-icons</code>{" "}
            Ionicons — {totalAll} base icons, each with filled, outline, and
            sharp variants (except logos). Click any name to copy.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search icon names..."
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
              <span className={styles.classBtnLabel}>{totalAll}</span>
            </button>
            {IONICON_CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                className={`${styles.classBtn} ${activeCategory === cat.label ? styles.classBtnActive : ""}`}
                style={
                  {
                    "--cls-color": cat.color,
                    "--cls-subtle": cat.subtle,
                  } as React.CSSProperties
                }
                onClick={() => handleCategoryToggle(cat.label)}
              >
                {cat.label}
                <span className={styles.classBtnLabel}>{cat.icons.length}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.content}>
          {filteredCategories.length === 0 ? (
            <div className={styles.empty}>
              No icons match &ldquo;{search}&rdquo;
            </div>
          ) : (
            <>
              {search && (
                <div className={iStyles.resultCount}>
                  {totalVisible} {totalVisible === 1 ? "icon" : "icons"} found
                </div>
              )}
              {filteredCategories.map((cat) => (
                <div key={cat.label} className={styles.section}>
                  <div
                    className={styles.sectionHeader}
                    style={
                      {
                        "--cls-color": cat.color,
                        "--cls-subtle": cat.subtle,
                        "--cls-border": cat.border,
                      } as React.CSSProperties
                    }
                  >
                    <span className={styles.sectionClass}>{cat.label}</span>
                    <span className={styles.sectionCount}>
                      {cat.icons.length}{" "}
                      {cat.icons.length === 1 ? "icon" : "icons"}
                    </span>
                  </div>

                  <div className={iStyles.iconGrid}>
                    {cat.icons.map((name) => {
                      const isLogo =
                        isLogoCategory(cat.label) || name === "ionicons";
                      return (
                        <div
                          key={name}
                          className={iStyles.iconCard}
                          style={
                            {
                              "--cls-color": cat.color,
                              "--cls-subtle": cat.subtle,
                            } as React.CSSProperties
                          }
                        >
                          <button
                            className={iStyles.iconName}
                            onClick={() => handleCopy(name)}
                            title={`Copy "${name}"`}
                          >
                            {copiedName === name ? (
                              <span className={iStyles.copied}>copied!</span>
                            ) : (
                              name
                            )}
                          </button>
                          {!isLogo && (
                            <div className={iStyles.variantRow}>
                              {VARIANT_LABELS.map(({ suffix, label }) => (
                                <button
                                  key={suffix}
                                  className={iStyles.variantChip}
                                  onClick={() => handleCopy(name + suffix)}
                                  title={`Copy "${name + suffix}"`}
                                >
                                  {copiedName === name + suffix ? "✓" : label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
