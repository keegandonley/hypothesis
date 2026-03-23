import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import styles from "@/styles/reference.module.css";
import { useBranding } from "@/lib/branding";
import { STATUS_CODES, STATUS_CLASSES } from "@/data/http-status-codes";

export default function HttpStatusCodesPage() {
  const branding = useBranding();
  const [search, setSearch] = useState("");
  const [activeClass, setActiveClass] = useState("all");

  // Restore state from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const cls = params.get("class");
    if (q) setSearch(q);
    if (cls) setActiveClass(cls);
  }, []);

  function updateUrl(q: string, cls: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (cls !== "all") params.set("class", cls);
    const qs = params.toString();
    history.replaceState(
      null,
      "",
      qs ? `?${qs}` : window.location.pathname,
    );
  }

  function handleSearch(value: string) {
    setSearch(value);
    updateUrl(value, activeClass);
  }

  function handleClassToggle(cls: string) {
    const next = activeClass === cls ? "all" : cls;
    setActiveClass(next);
    updateUrl(search, next);
  }

  const filteredSections = useMemo(() => {
    const q = search.toLowerCase().trim();
    return STATUS_CLASSES.map((cls) => {
      const codes = STATUS_CODES[cls.class].filter((code) => {
        if (activeClass !== "all" && activeClass !== cls.class) return false;
        if (!q) return true;
        return (
          String(code.code).includes(q) ||
          code.name.toLowerCase().includes(q) ||
          code.description.toLowerCase().includes(q)
        );
      });
      return { ...cls, codes };
    }).filter((s) => s.codes.length > 0);
  }, [search, activeClass]);

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — HTTP STATUS CODES`}</title>
        <meta
          name="description"
          content="Complete reference for HTTP response status codes with color coding and instant search."
        />
        <meta property="og:title" content="HTTP Status Codes" />
        <meta
          property="og:description"
          content="Complete reference for HTTP response status codes: 1xx through 5xx."
        />
        <meta
          property="og:url"
          content="https://hypothesis.sh/references/http-status-codes"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="HTTP Status Codes" />
        <link
          rel="canonical"
          href="https://hypothesis.sh/references/http-status-codes"
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
          <h1 className={styles.title}>HTTP Status Codes</h1>
          <p className={styles.tagline}>
            Complete reference for HTTP response status codes.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by code, name, or description..."
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
              className={`${styles.classBtn} ${activeClass === "all" ? styles.classBtnActive : ""}`}
              onClick={() => handleClassToggle("all")}
            >
              All
            </button>
            {STATUS_CLASSES.map((cls) => (
              <button
                key={cls.class}
                className={`${styles.classBtn} ${activeClass === cls.class ? styles.classBtnActive : ""}`}
                style={
                  {
                    "--cls-color": cls.color,
                    "--cls-subtle": cls.subtle,
                  } as React.CSSProperties
                }
                onClick={() => handleClassToggle(cls.class)}
              >
                {cls.class}
                <span className={styles.classBtnLabel}>{cls.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.content}>
          {filteredSections.length === 0 ? (
            <div className={styles.empty}>
              No codes match &ldquo;{search}&rdquo;
            </div>
          ) : (
            filteredSections.map((section) => (
              <div key={section.class} className={styles.section}>
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
                  <span className={styles.sectionClass}>{section.class}</span>
                  <span className={styles.sectionLabel}>{section.label}</span>
                  <span className={styles.sectionCount}>
                    {section.codes.length}{" "}
                    {section.codes.length === 1 ? "code" : "codes"}
                  </span>
                </div>

                <div className={styles.codeList}>
                  {section.codes.map((code) => (
                    <div
                      key={code.code}
                      className={styles.codeRow}
                      style={
                        {
                          "--cls-color": section.color,
                          "--cls-subtle": section.subtle,
                          "--cls-border": section.border,
                        } as React.CSSProperties
                      }
                    >
                      <span className={styles.codeBadge}>{code.code}</span>
                      <div className={styles.codeInfo}>
                        <span className={styles.codeName}>{code.name}</span>
                        <span className={styles.codeDesc}>
                          {code.description}
                        </span>
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
