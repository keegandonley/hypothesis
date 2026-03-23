import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import styles from "@/styles/reference.module.css";
import { useBranding } from "@/lib/branding";
import { REGEX_GROUPS } from "@/data/regex-syntax";

export default function RegexSyntaxPage() {
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
    return REGEX_GROUPS.map((group) => {
      const tokens = group.tokens.filter((t) => {
        if (activeGroup !== "all" && activeGroup !== group.id) return false;
        if (!q) return true;
        return (
          t.token.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.example.toLowerCase().includes(q) ||
          (t.output ?? "").toLowerCase().includes(q)
        );
      });
      return { ...group, tokens };
    }).filter((g) => g.tokens.length > 0);
  }, [search, activeGroup]);

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — REGEX SYNTAX`}</title>
        <meta
          name="description"
          content="Regular expression syntax reference: anchors, character classes, quantifiers, groups, lookaheads, flags, and escape sequences."
        />
        <meta property="og:title" content="Regex Syntax" />
        <meta
          property="og:description"
          content="Quick reference for regex syntax — anchors, quantifiers, groups, lookaheads, flags, and more."
        />
        <meta
          property="og:url"
          content="https://hypothesis.sh/references/regex-syntax"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Regex Syntax" />
        <link
          rel="canonical"
          href="https://hypothesis.sh/references/regex-syntax"
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
          <h1 className={styles.title}>Regex Syntax</h1>
          <p className={styles.tagline}>
            Regular expression tokens with descriptions and examples. JavaScript flavor.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by token, description, or example..."
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
            {REGEX_GROUPS.map((group) => (
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
              No tokens match &ldquo;{search}&rdquo;
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
                    {group.tokens.length}{" "}
                    {group.tokens.length === 1 ? "token" : "tokens"}
                  </span>
                </div>

                <div className={styles.codeList}>
                  {group.tokens.map((token) => (
                    <div
                      key={token.token}
                      className={styles.codeRow}
                      style={
                        {
                          "--cls-color": group.color,
                          "--cls-subtle": group.subtle,
                          "--cls-border": group.border,
                        } as React.CSSProperties
                      }
                    >
                      <span className={styles.codeBadge} style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>
                        {token.token}
                      </span>
                      <div className={styles.codeInfo}>
                        <div className={styles.flagRow}>
                          <span className={styles.codeDesc}>
                            {token.description}
                          </span>
                        </div>
                        <div className={styles.flagRow}>
                          <code className={styles.codeDesc} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", opacity: 0.7 }}>
                            {token.example}
                          </code>
                          {token.output && (
                            <span className={styles.codeDesc} style={{ opacity: 0.5 }}>
                              → {token.output}
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
