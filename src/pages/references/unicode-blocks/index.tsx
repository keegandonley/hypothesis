import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import styles from "@/styles/reference.module.css";
import { useBranding } from "@/lib/branding";
import { UNICODE_BLOCK_GROUPS } from "@/data/unicode-blocks";

function formatRange(start: number, end: number): string {
  return `U+${start.toString(16).toUpperCase().padStart(4, "0")}–U+${end.toString(16).toUpperCase().padStart(4, "0")}`;
}

export default function UnicodeBlocksPage() {
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
    return UNICODE_BLOCK_GROUPS.map((grp) => {
      const blocks = grp.blocks.filter((b) => {
        if (activeGroup !== "all" && activeGroup !== grp.id) return false;
        if (!q) return true;
        return (
          b.name.toLowerCase().includes(q) ||
          formatRange(b.start, b.end).toLowerCase().includes(q) ||
          b.sample.some((s) => s.includes(q))
        );
      });
      return { ...grp, blocks };
    }).filter((g) => g.blocks.length > 0);
  }, [search, activeGroup]);

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — UNICODE BLOCKS`}</title>
        <meta
          name="description"
          content="Named Unicode block ranges from Basic Latin to Supplementary planes, with sample glyphs."
        />
        <meta property="og:title" content="Unicode Blocks" />
        <meta
          property="og:description"
          content="Named Unicode block ranges from Basic Latin to Supplementary planes, with sample glyphs and assigned character counts."
        />
        <meta
          property="og:url"
          content="https://hypothesis.sh/references/unicode-blocks"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Unicode Blocks" />
        <link
          rel="canonical"
          href="https://hypothesis.sh/references/unicode-blocks"
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
          <h1 className={styles.title}>Unicode Blocks</h1>
          <p className={styles.tagline}>
            Named code point ranges from Basic Latin to Supplementary planes,
            with assigned character counts and sample glyphs.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by block name or range..."
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
            {UNICODE_BLOCK_GROUPS.map((grp) => (
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
                {grp.badge}
                <span className={styles.classBtnLabel}>{grp.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.content}>
          {filteredGroups.length === 0 ? (
            <div className={styles.empty}>
              No blocks match &ldquo;{search}&rdquo;
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
                  <span className={styles.sectionClass}>{grp.badge}</span>
                  <span className={styles.sectionLabel}>{grp.label}</span>
                  <span className={styles.sectionCount}>
                    {grp.blocks.length}{" "}
                    {grp.blocks.length === 1 ? "block" : "blocks"}
                  </span>
                </div>

                <div className={styles.codeList}>
                  {grp.blocks.map((b) => (
                    <div
                      key={`${b.name}-${b.start}`}
                      className={styles.codeRowFull}
                      style={
                        {
                          "--cls-color": grp.color,
                          "--cls-subtle": grp.subtle,
                          "--cls-border": grp.border,
                        } as React.CSSProperties
                      }
                    >
                      <div className={styles.codeInfo}>
                        <div className={styles.unicodeBlockRow}>
                          <span className={styles.codeNameMono}>{b.name}</span>
                          <span className={styles.unicodeRange}>
                            {formatRange(b.start, b.end)}
                          </span>
                          <span className={styles.unicodeCount}>
                            {b.assigned.toLocaleString()} assigned
                          </span>
                        </div>
                        <div className={styles.unicodeSample}>
                          {b.sample.map((ch, i) => (
                            <span key={i} className={styles.unicodeGlyph}>
                              {ch}
                            </span>
                          ))}
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
