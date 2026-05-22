import Head from "next/head";
import Link from "next/link";
import React, { useState, useMemo } from "react";
import { type GetStaticProps } from "next";
import styles from "@/styles/reference.module.css";
import { useBranding } from "@/lib/branding";
import { URL_SCHEME_GROUPS } from "@/data/ios-url-schemes";

export const getStaticProps: GetStaticProps = () => ({
  props: { groups: URL_SCHEME_GROUPS },
});

export default function IosUrlSchemesPage({
  groups,
}: {
  groups: typeof URL_SCHEME_GROUPS;
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
        const schemes = group.schemes.filter((s) => {
          if (activeGroup !== "all" && activeGroup !== group.id) return false;
          if (!q) return true;

          return (
            s.scheme.toLowerCase().includes(q) ||
            s.example.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q)
          );
        });

        return { ...group, schemes };
      })
      .filter((g) => g.schemes.length > 0);
  }, [search, activeGroup, groups]);

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — IOS URL SCHEMES`}</title>
        <meta
          name="description"
          content="iOS system URL schemes for Phone, FaceTime, Messages, Mail, Maps, App Store, and Settings."
        />
        <meta property="og:title" content="iOS URL Schemes" />
        <meta
          property="og:description"
          content="System URL schemes for Phone, FaceTime, Messages, Mail, Maps, App Store, and Settings."
        />
        <meta
          property="og:url"
          content="https://hypothesis.sh/references/ios-url-schemes"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="iOS URL Schemes" />
        <link
          rel="canonical"
          href="https://hypothesis.sh/references/ios-url-schemes"
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
          <h1 className={styles.title}>iOS URL Schemes</h1>
          <p className={styles.tagline}>
            System URL schemes for Phone, FaceTime, Messages, Mail, Maps, App
            Store, and Settings.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by scheme, example, or description..."
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
                {group.id}
                <span className={styles.classBtnLabel}>{group.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.content}>
          {filteredSections.length === 0 ? (
            <div className={styles.empty}>
              No schemes match &ldquo;{search}&rdquo;
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
                    {group.schemes.length}{" "}
                    {group.schemes.length === 1 ? "scheme" : "schemes"}
                  </span>
                </div>

                <div className={styles.codeList}>
                  {group.schemes.map((s) => (
                    <div
                      key={s.scheme}
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
                        <span className={styles.codeNameMono}>{s.scheme}</span>
                        <div className={styles.extList}>
                          <span className={styles.ext}>{s.example}</span>
                        </div>
                        <span className={styles.codeDesc}>{s.description}</span>
                        {s.note && (
                          <div className={styles.flagRow}>
                            <span
                              className={styles.flagBadge}
                              style={{
                                color: group.color,
                                backgroundColor: group.subtle,
                                borderColor: group.border,
                              }}
                            >
                              note
                            </span>
                            <span className={styles.codeDesc}>{s.note}</span>
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
