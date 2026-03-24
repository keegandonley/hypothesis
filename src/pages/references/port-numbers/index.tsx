import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import styles from "@/styles/reference.module.css";
import { useBranding } from "@/lib/branding";
import { PORT_GROUPS } from "@/data/port-numbers";

export default function PortNumbersPage() {
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
    return PORT_GROUPS.map((group) => {
      const ports = group.ports.filter((p) => {
        if (activeGroup !== "all" && activeGroup !== group.id) return false;
        if (!q) return true;
        return (
          String(p.port).includes(q) ||
          p.service.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.protocol.toLowerCase().includes(q)
        );
      });
      return { ...group, ports };
    }).filter((g) => g.ports.length > 0);
  }, [search, activeGroup]);

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — PORT NUMBERS`}</title>
        <meta
          name="description"
          content="Well-known TCP and UDP port numbers grouped by category: web, database, mail, file transfer, remote access, and more."
        />
        <meta property="og:title" content="Port Numbers" />
        <meta
          property="og:description"
          content="Well-known TCP/UDP port numbers: 22 SSH, 80 HTTP, 443 HTTPS, 3306 MySQL, 5432 PostgreSQL, and more."
        />
        <meta
          property="og:url"
          content="https://hypothesis.sh/references/port-numbers"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Port Numbers" />
        <link
          rel="canonical"
          href="https://hypothesis.sh/references/port-numbers"
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
          <h1 className={styles.title}>Port Numbers</h1>
          <p className={styles.tagline}>
            Well-known TCP and UDP ports grouped by service category.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by port, service, or description..."
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
            {PORT_GROUPS.map((group) => (
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
              No ports match &ldquo;{search}&rdquo;
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
                    {group.ports.length}{" "}
                    {group.ports.length === 1 ? "port" : "ports"}
                  </span>
                </div>

                <div className={styles.codeList}>
                  {[...group.ports]
                    .sort((a, b) => a.port - b.port)
                    .map((port) => (
                      <div
                        key={port.port}
                        className={styles.codeRow}
                        style={
                          {
                            "--cls-color": group.color,
                            "--cls-subtle": group.subtle,
                            "--cls-border": group.border,
                          } as React.CSSProperties
                        }
                      >
                        <span className={styles.codeBadge}>{port.port}</span>
                        <div className={styles.codeInfo}>
                          <span className={styles.codeName}>{port.service}</span>
                          <div className={styles.flagRow}>
                            <span className={styles.codeDesc}>
                              {port.description}
                            </span>
                          </div>
                          <div className={styles.flagRow}>
                            <span className={styles.flagBadge} style={{ color: group.color, backgroundColor: group.subtle, borderColor: group.border }}>
                              {port.protocol}
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
