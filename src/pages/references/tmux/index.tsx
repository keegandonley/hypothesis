import Head from "next/head";
import Link from "next/link";
import React, { useState, useMemo } from "react";
import { type GetStaticProps } from "next";
import styles from "@/styles/reference.module.css";
import { useBranding } from "@/lib/branding";
import { TMUX_GROUPS } from "@/data/tmux";
import { useUrlSync } from "@/lib/useUrlSync";

export const getStaticProps: GetStaticProps = () => ({
  props: { groups: TMUX_GROUPS },
});

export default function TmuxReferencePage({
  groups,
}: {
  groups: typeof TMUX_GROUPS;
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

  const { replaceUrl } = useUrlSync();

  function updateUrl(q: string, grp: string): void {
    const params = new URLSearchParams();

    if (q) params.set("q", q);
    if (grp !== "all") params.set("grp", grp);
    const qs = params.toString();

    replaceUrl(qs ? `?${qs}` : window.location.pathname);
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
        const commands = group.commands.filter((c) => {
          if (activeGroup !== "all" && activeGroup !== group.id) return false;
          if (!q) return true;

          return (
            c.command.toLowerCase().includes(q) ||
            c.syntax.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
          );
        });

        return { ...group, commands };
      })
      .filter((g) => g.commands.length > 0);
  }, [search, activeGroup, groups]);

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — TMUX REFERENCE`}</title>
        <meta
          name="description"
          content="tmux quick reference: default prefix key bindings for sessions, windows, panes, layouts, and copy mode, plus CLI subcommands with full syntax."
        />
        <meta property="og:title" content="tmux Reference" />
        <meta
          property="og:description"
          content="Every default tmux key binding and CLI subcommand, searchable and grouped by purpose."
        />
        <meta
          property="og:url"
          content="https://hypothesis.sh/references/tmux"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="tmux Reference" />
        <link rel="canonical" href="https://hypothesis.sh/references/tmux" />
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
          <h1 className={styles.title}>tmux</h1>
          <p className={styles.tagline}>
            Default prefix key bindings (with C-b as the prefix) and CLI
            subcommands — sessions, windows, panes, layouts, copy mode, and
            more.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by key, command, or description..."
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
              No commands match &ldquo;{search}&rdquo;
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
                    {group.commands.length}{" "}
                    {group.commands.length === 1 ? "command" : "commands"}
                  </span>
                </div>

                <div className={styles.codeList}>
                  {group.commands.map((cmd) => (
                    <div
                      key={cmd.command}
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
                        <span className={styles.codeNameMono}>
                          {cmd.command}
                        </span>
                        <span className={styles.codeDesc}>
                          {cmd.description}
                        </span>
                        <div className={styles.flagRow}>
                          <span
                            className={styles.supersededBy}
                            style={{
                              color: group.color,
                              backgroundColor: group.subtle,
                              borderColor: group.border,
                            }}
                          >
                            {cmd.syntax}
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
