import Head from "next/head";
import Link from "next/link";
import React, { useState, useMemo } from "react";
import { type GetStaticProps } from "next";
import styles from "@/styles/reference.module.css";
import { useBranding } from "@/lib/branding";
import { PG_OPERATOR_GROUPS } from "@/data/postgres-operators";

export const getStaticProps: GetStaticProps = () => ({
  props: { groups: PG_OPERATOR_GROUPS },
});

export default function PostgresOperatorsPage({
  groups,
}: {
  groups: typeof PG_OPERATOR_GROUPS;
}): React.ReactNode {
  const branding = useBranding();
  const [search, setSearch] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (new URLSearchParams(window.location.search).get("q") ?? ""),
  );
  const [activeGroup, setActiveGroup] = useState(() =>
    typeof window === "undefined"
      ? "all"
      : (new URLSearchParams(window.location.search).get("grp") ?? "all"),
  );

  function updateUrl(q: string, grp: string): void {
    const params = new URLSearchParams();

    if (q) params.set("q", q);
    if (grp !== "all") params.set("grp", grp);
    const qs = params.toString();

    history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }

  function handleSearch(value: string): void {
    setSearch(value);
    updateUrl(value, activeGroup);
  }

  function handleGroupToggle(grp: string): void {
    const next = activeGroup === grp ? "all" : grp;

    setActiveGroup(next);
    updateUrl(search, next);
  }

  const filteredSections = useMemo(() => {
    const q = search.toLowerCase().trim();

    return groups
      .map((group) => {
        const operators = group.operators.filter((op) => {
          if (activeGroup !== "all" && activeGroup !== group.id) return false;
          if (!q) return true;

          return (
            op.operator.toLowerCase().includes(q) ||
            op.description.toLowerCase().includes(q) ||
            op.example.toLowerCase().includes(q)
          );
        });

        return { ...group, operators };
      })
      .filter((g) => g.operators.length > 0);
  }, [search, activeGroup, groups]);

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — POSTGRES OPERATORS`}</title>
        <meta
          name="description"
          content="PostgreSQL JSONB and array operators: ->, ->>, #>, @>, ?, ||, and more — with descriptions, examples, and results."
        />
        <meta property="og:title" content="Postgres JSONB & Array Operators" />
        <meta
          property="og:description"
          content="Reference for PostgreSQL JSONB and array operators with examples and results for each."
        />
        <meta
          property="og:url"
          content="https://hypothesis.sh/references/postgres-operators"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Postgres JSONB & Array Operators" />
        <link
          rel="canonical"
          href="https://hypothesis.sh/references/postgres-operators"
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
          <h1 className={styles.title}>Postgres JSONB &amp; Array Operators</h1>
          <p className={styles.tagline}>
            Postgres operators for JSONB and array values — access, containment,
            existence, modification, and path queries — each with a runnable
            example and its result.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by operator, description, or example..."
              value={search}
              onChange={(e) => {
                handleSearch(e.target.value);
              }}
              autoComplete="off"
              spellCheck={false}
            />
            {search && (
              <button
                className={styles.clearBtn}
                onClick={() => {
                  handleSearch("");
                }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className={styles.classFilters}>
            <button
              className={`${styles.classBtn} ${activeGroup === "all" ? styles.classBtnActive : ""}`}
              onClick={() => {
                handleGroupToggle("all");
              }}
            >
              All
            </button>
            {groups.map((group) => (
              <button
                key={group.id}
                className={`${styles.classBtn} ${activeGroup === group.id ? styles.classBtnActive : ""}`}
                style={
                  {
                    "--cls-color": group.color,
                    "--cls-subtle": group.subtle,
                  } as React.CSSProperties
                }
                onClick={() => {
                  handleGroupToggle(group.id);
                }}
              >
                {group.badge}
                {group.badge !== group.label && (
                  <span className={styles.classBtnLabel}>{group.label}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.content}>
          {filteredSections.length === 0 ? (
            <div className={styles.empty}>
              No operators match &ldquo;{search}&rdquo;
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
                  <span className={styles.sectionClass}>{group.badge}</span>
                  {group.badge !== group.label && (
                    <span className={styles.sectionLabel}>{group.label}</span>
                  )}
                  <span className={styles.sectionCount}>
                    {group.operators.length}{" "}
                    {group.operators.length === 1 ? "operator" : "operators"}
                  </span>
                </div>

                <div className={styles.codeList}>
                  {group.operators.map((op, i) => (
                    <div
                      key={`${op.operator}-${i}`}
                      className={styles.codeRowFull}
                      style={
                        {
                          "--cls-color": group.color,
                          "--cls-subtle": group.subtle,
                          "--cls-border": group.border,
                        } as React.CSSProperties
                      }
                    >
                      <div className={styles.codeInfo}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            className={styles.codeNameMono}
                            style={{ color: group.color }}
                          >
                            {op.operator}
                          </span>
                          {op.since && (
                            <span
                              className={styles.supersededBy}
                              style={{
                                color: group.color,
                                backgroundColor: group.subtle,
                                borderColor: group.border,
                              }}
                            >
                              {op.since}
                            </span>
                          )}
                        </div>
                        <span className={styles.codeDesc}>
                          {op.description}
                        </span>
                        {(() => {
                          const idx = op.example.indexOf(" →  ");
                          const input =
                            idx === -1 ? op.example : op.example.slice(0, idx);
                          const output =
                            idx === -1 ? null : op.example.slice(idx + 4);

                          return (
                            <div
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: "11px",
                                marginTop: "6px",
                                lineHeight: 1.6,
                                color: "var(--muted)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px",
                              }}
                            >
                              <div style={{ color: "var(--text)" }}>
                                {input}
                              </div>
                              {output !== null && (
                                <div>
                                  <span style={{ opacity: 0.6 }}>→ </span>
                                  <span style={{ color: group.color }}>
                                    {output}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
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
