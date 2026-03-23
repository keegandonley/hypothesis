import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import styles from "@/styles/reference.module.css";
import { useBranding } from "@/lib/branding";
import { EXIT_CODE_GROUPS } from "@/data/exit-codes";

export default function ExitCodesPage() {
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
    return EXIT_CODE_GROUPS.map((group) => {
      const codes = group.codes.filter((c) => {
        if (activeGroup !== "all" && activeGroup !== group.id) return false;
        if (!q) return true;
        return (
          c.code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          (c.notes ?? "").toLowerCase().includes(q)
        );
      });
      return { ...group, codes };
    }).filter((g) => g.codes.length > 0);
  }, [search, activeGroup]);

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — EXIT CODES`}</title>
        <meta
          name="description"
          content="Unix/Linux process exit codes: 0 success, 1 general error, 126/127 shell errors, and 128+N signal offsets."
        />
        <meta property="og:title" content="Exit Codes" />
        <meta
          property="og:description"
          content="Unix/Linux process exit codes — from 0 (success) to 143 (SIGTERM) with meanings and context."
        />
        <meta
          property="og:url"
          content="https://hypothesis.sh/references/exit-codes"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Exit Codes" />
        <link
          rel="canonical"
          href="https://hypothesis.sh/references/exit-codes"
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
          <h1 className={styles.title}>Exit Codes</h1>
          <p className={styles.tagline}>
            Standard Unix/Linux process exit codes and their meanings.
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
              className={`${styles.classBtn} ${activeGroup === "all" ? styles.classBtnActive : ""}`}
              onClick={() => handleGroupToggle("all")}
            >
              All
            </button>
            {EXIT_CODE_GROUPS.map((group) => (
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
              No codes match &ldquo;{search}&rdquo;
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
                    {group.codes.length}{" "}
                    {group.codes.length === 1 ? "code" : "codes"}
                  </span>
                </div>

                <div className={styles.codeList}>
                  {group.codes.map((code) => (
                    <div
                      key={code.code}
                      className={styles.codeRow}
                      style={
                        {
                          "--cls-color": group.color,
                          "--cls-subtle": group.subtle,
                          "--cls-border": group.border,
                        } as React.CSSProperties
                      }
                    >
                      <span className={styles.codeBadge}>{code.code}</span>
                      <div className={styles.codeInfo}>
                        <span className={styles.codeName}>{code.name}</span>
                        <div className={styles.flagRow}>
                          <span className={styles.codeDesc}>
                            {code.description}
                          </span>
                        </div>
                        {code.notes && (
                          <div className={styles.flagRow}>
                            <span className={styles.flagBadge} style={{ color: group.color, backgroundColor: group.subtle, borderColor: group.border }}>
                              {code.notes}
                            </span>
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
