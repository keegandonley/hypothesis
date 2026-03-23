import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import styles from "@/styles/reference.module.css";
import { useBranding } from "@/lib/branding";
import { DNS_GROUPS } from "@/data/dns-record-types";

export default function DnsRecordTypesPage() {
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
    return DNS_GROUPS.map((group) => {
      const records = group.records.filter((r) => {
        if (activeGroup !== "all" && activeGroup !== group.id) return false;
        if (!q) return true;
        return (
          r.type.toLowerCase().includes(q) ||
          r.fullName.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.example.toLowerCase().includes(q)
        );
      });
      return { ...group, records };
    }).filter((g) => g.records.length > 0);
  }, [search, activeGroup]);

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — DNS RECORD TYPES`}</title>
        <meta
          name="description"
          content="DNS record types reference: A, AAAA, CNAME, MX, TXT, NS, SOA, PTR, SRV, CAA, and DNSSEC records with descriptions and examples."
        />
        <meta property="og:title" content="DNS Record Types" />
        <meta
          property="og:description"
          content="A, AAAA, CNAME, MX, TXT, NS, SOA, SRV, CAA — DNS record types with descriptions and examples."
        />
        <meta
          property="og:url"
          content="https://hypothesis.sh/references/dns-record-types"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="DNS Record Types" />
        <link
          rel="canonical"
          href="https://hypothesis.sh/references/dns-record-types"
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
          <h1 className={styles.title}>DNS Record Types</h1>
          <p className={styles.tagline}>
            Common DNS record types with descriptions, use cases, and example syntax.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by type, name, or description..."
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
            {DNS_GROUPS.map((group) => (
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
              No records match &ldquo;{search}&rdquo;
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
                    {group.records.length}{" "}
                    {group.records.length === 1 ? "record" : "records"}
                  </span>
                </div>

                <div className={styles.codeList}>
                  {group.records.map((record) => (
                    <div
                      key={record.type}
                      className={styles.codeRow}
                      style={
                        {
                          "--cls-color": group.color,
                          "--cls-subtle": group.subtle,
                          "--cls-border": group.border,
                        } as React.CSSProperties
                      }
                    >
                      <span className={styles.codeBadge}>{record.type.split(" ")[0]}</span>
                      <div className={styles.codeInfo}>
                        <span className={styles.codeName}>{record.fullName}</span>
                        <div className={styles.flagRow}>
                          <span className={styles.codeDesc}>
                            {record.description}
                          </span>
                        </div>
                        <div className={styles.flagRow}>
                          <code className={styles.codeDesc} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", opacity: 0.7 }}>
                            {record.example}
                          </code>
                        </div>
                        {record.notes && (
                          <div className={styles.flagRow}>
                            <span className={styles.flagBadge} style={{ color: group.color, backgroundColor: group.subtle, borderColor: group.border }}>
                              {record.notes}
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
