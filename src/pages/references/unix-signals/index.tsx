import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import styles from "@/styles/reference.module.css";
import { useBranding } from "@/lib/branding";
import { SIGNAL_GROUPS } from "@/data/unix-signals";

export default function UnixSignalsPage() {
  const branding = useBranding();
  const [search, setSearch] = useState("");
  const [activeAction, setActiveAction] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const action = params.get("action");
    if (q) setSearch(q);
    if (action) setActiveAction(action);
  }, []);

  function updateUrl(q: string, action: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (action !== "all") params.set("action", action);
    const qs = params.toString();
    history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }

  function handleSearch(value: string) {
    setSearch(value);
    updateUrl(value, activeAction);
  }

  function handleActionToggle(action: string) {
    const next = activeAction === action ? "all" : action;
    setActiveAction(next);
    updateUrl(search, next);
  }

  const filteredSections = useMemo(() => {
    const q = search.toLowerCase().trim();
    return SIGNAL_GROUPS.map((group) => {
      const signals = group.signals.filter((s) => {
        if (activeAction !== "all" && activeAction !== group.action)
          return false;
        if (!q) return true;
        return (
          String(s.number).includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
        );
      });
      return { ...group, signals };
    }).filter((g) => g.signals.length > 0);
  }, [search, activeAction]);

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — UNIX SIGNALS`}</title>
        <meta
          name="description"
          content="Complete reference for Unix signals: numbers, names, default actions, and descriptions."
        />
        <meta property="og:title" content="Unix Signals" />
        <meta
          property="og:description"
          content="Complete reference for Unix signals: SIGTERM, SIGKILL, SIGINT, and more."
        />
        <meta
          property="og:url"
          content="https://hypothesis.sh/references/unix-signals"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Unix Signals" />
        <link
          rel="canonical"
          href="https://hypothesis.sh/references/unix-signals"
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
          <h1 className={styles.title}>Unix Signals</h1>
          <p className={styles.tagline}>
            Signal numbers, names, default actions, and whether they can be
            caught.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by number, name, or description..."
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
              className={`${styles.classBtn} ${activeAction === "all" ? styles.classBtnActive : ""}`}
              onClick={() => handleActionToggle("all")}
            >
              All
            </button>
            {SIGNAL_GROUPS.map((group) => (
              <button
                key={group.action}
                className={`${styles.classBtn} ${activeAction === group.action ? styles.classBtnActive : ""}`}
                style={
                  {
                    "--cls-color": group.color,
                    "--cls-subtle": group.subtle,
                  } as React.CSSProperties
                }
                onClick={() => handleActionToggle(group.action)}
              >
                {group.action}
                <span className={styles.classBtnLabel}>{group.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.content}>
          {filteredSections.length === 0 ? (
            <div className={styles.empty}>
              No signals match &ldquo;{search}&rdquo;
            </div>
          ) : (
            filteredSections.map((group) => (
              <div key={group.action} className={styles.section}>
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
                  <span className={styles.sectionClass}>{group.action}</span>
                  <span className={styles.sectionLabel}>{group.label}</span>
                  <span className={styles.sectionCount}>
                    {group.signals.length}{" "}
                    {group.signals.length === 1 ? "signal" : "signals"}
                  </span>
                </div>

                <div className={styles.codeList}>
                  {[...group.signals]
                    .sort((a, b) => a.number - b.number)
                    .map((signal) => (
                      <div
                        key={signal.number}
                        className={styles.codeRow}
                        style={
                          {
                            "--cls-color": group.color,
                            "--cls-subtle": group.subtle,
                            "--cls-border": group.border,
                          } as React.CSSProperties
                        }
                      >
                        <span className={styles.codeBadge}>
                          {signal.number}
                        </span>
                        <div className={styles.codeInfo}>
                          <span className={styles.codeName}>{signal.name}</span>
                          <div className={styles.flagRow}>
                            <span className={styles.codeDesc}>
                              {signal.description}
                            </span>
                          </div>
                          {!signal.catchable && (
                            <div className={styles.flagRow}>
                              <span className={styles.flagBadge}>
                                uncatchable
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
