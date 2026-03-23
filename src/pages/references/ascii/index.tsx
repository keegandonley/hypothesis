import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import styles from "@/styles/reference.module.css";
import { useBranding } from "@/lib/branding";
import { ASCII_GROUPS, AsciiCategory } from "@/data/ascii";

function renderGlyph(abbr: string, category: AsciiCategory, ctrl?: string): string {
  if (category === "control") {
    return ctrl ?? abbr;
  }
  return abbr;
}

export default function AsciiPage() {
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

  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase().trim();
    return ASCII_GROUPS.map((grp) => {
      const chars = grp.chars.filter((c) => {
        if (activeGroup !== "all" && activeGroup !== grp.id) return false;
        if (!q) return true;
        return (
          String(c.code).includes(q) ||
          c.hex.toLowerCase().includes(q) ||
          c.oct.includes(q) ||
          c.abbr.toLowerCase() === q ||
          c.name.toLowerCase().includes(q) ||
          (c.ctrl && c.ctrl.toLowerCase().includes(q))
        );
      });
      return { ...grp, chars };
    }).filter((g) => g.chars.length > 0);
  }, [search, activeGroup]);

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — ASCII TABLE`}</title>
        <meta
          name="description"
          content="All 128 ASCII characters with decimal, hex, octal, and named descriptions."
        />
        <meta property="og:title" content="ASCII Table" />
        <meta
          property="og:description"
          content="All 128 ASCII characters: control codes, digits, uppercase, lowercase, symbols — with decimal, hex, and octal values."
        />
        <meta
          property="og:url"
          content="https://hypothesis.sh/references/ascii"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="ASCII Table" />
        <link
          rel="canonical"
          href="https://hypothesis.sh/references/ascii"
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
          <h1 className={styles.title}>ASCII Table</h1>
          <p className={styles.tagline}>
            All 128 ASCII characters with decimal, hexadecimal, octal, and
            named descriptions.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by decimal, hex, octal, or name..."
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
            {ASCII_GROUPS.map((grp) => (
              <button
                key={grp.id}
                className={`${styles.classBtn} ${activeGroup === grp.id ? styles.classBtnActive : ""}`}
                style={
                  {
                    "--cls-color": grp.color,
                    "--cls-subtle": grp.subtle,
                  } as React.CSSProperties
                }
                onClick={() => handleGroupToggle(grp.id)}
              >
                {grp.label}
                <span className={styles.classBtnLabel}>{grp.range}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.content}>
          {filteredGroups.length === 0 ? (
            <div className={styles.empty}>
              No characters match &ldquo;{search}&rdquo;
            </div>
          ) : (
            filteredGroups.map((grp) => (
              <div key={grp.id} className={styles.section}>
                <div
                  className={styles.sectionHeader}
                  style={
                    {
                      "--cls-color": grp.color,
                      "--cls-subtle": grp.subtle,
                      "--cls-border": grp.border,
                    } as React.CSSProperties
                  }
                >
                  <span className={styles.sectionClass}>{grp.label}</span>
                  <span className={styles.sectionLabel}>{grp.range}</span>
                  <span className={styles.sectionCount}>
                    {grp.chars.length}{" "}
                    {grp.chars.length === 1 ? "char" : "chars"}
                  </span>
                </div>

                <div className={styles.codeList}>
                  {grp.chars.map((c) => (
                    <div
                      key={c.code}
                      className={styles.asciiRow}
                      style={
                        {
                          "--cls-color": grp.color,
                          "--cls-subtle": grp.subtle,
                          "--cls-border": grp.border,
                        } as React.CSSProperties
                      }
                    >
                      <span className={styles.asciiGlyph}>
                        {renderGlyph(c.abbr, c.category, c.ctrl)}
                      </span>
                      <span className={styles.asciiMeta}>{c.code}</span>
                      <span className={styles.asciiMeta}>
                        {c.hex}
                        <sub>16</sub>
                      </span>
                      <span className={styles.asciiMeta}>
                        {c.oct}
                        <sub>8</sub>
                      </span>
                      <span className={styles.asciiName}>{c.name}</span>
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
