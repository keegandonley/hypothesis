import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { GetStaticProps } from "next";
import styles from "@/styles/reference.module.css";
import { useBranding } from "@/lib/branding";
import { PSQL_COMMAND_GROUPS } from "@/data/psql-meta-commands";

export const getStaticProps: GetStaticProps = () => ({
  props: { groups: PSQL_COMMAND_GROUPS },
});

export default function PsqlMetaCommandsPage({
  groups,
}: {
  groups: typeof PSQL_COMMAND_GROUPS;
}) {
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
        <title>{`${branding.name.toUpperCase()} — PSQL META-COMMANDS`}</title>
        <meta
          name="description"
          content="Complete reference for psql backslash meta-commands: informational \\d* listings, formatting, I/O, conditional blocks, connection, and more."
        />
        <meta property="og:title" content="psql Meta-Commands" />
        <meta
          property="og:description"
          content="All psql backslash commands with syntax and descriptions — from \\dt to \\gexec to \\pset."
        />
        <meta
          property="og:url"
          content="https://hypothesis.sh/references/psql-meta-commands"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="psql Meta-Commands" />
        <link
          rel="canonical"
          href="https://hypothesis.sh/references/psql-meta-commands"
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
          <h1 className={styles.title}>psql Meta-Commands</h1>
          <p className={styles.tagline}>
            Backslash commands for the Postgres interactive terminal —
            informational listings, query buffer control, formatting,
            conditionals, and more.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by command, syntax, or description..."
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
                onClick={() => handleGroupToggle(group.id)}
              >
                {group.badge}
                <span className={styles.classBtnLabel}>{group.label}</span>
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
                  <span className={styles.sectionLabel}>{group.label}</span>
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
                            style={
                              {
                                color: group.color,
                                backgroundColor: group.subtle,
                                borderColor: group.border,
                              } as React.CSSProperties
                            }
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
