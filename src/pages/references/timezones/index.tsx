import Head from "next/head";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import styles from "@/styles/reference.module.css";
import { useBranding } from "@/lib/branding";
import { TIMEZONES, TZ_GROUPS, type TzGroup } from "@/data/timezones";

function getOffsetStr(iana: string, date: Date): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: iana,
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  return tz.replace("GMT", "UTC");
}

function parseOffsetMinutes(offsetStr: string): number {
  if (offsetStr === "UTC" || offsetStr === "GMT") return 0;
  const match = offsetStr.match(/UTC([+-])(\d+)(?::(\d+))?/);
  if (!match) return 0;
  const sign = match[1] === "+" ? 1 : -1;
  const hours = parseInt(match[2]);
  const minutes = parseInt(match[3] ?? "0");
  return sign * (hours * 60 + minutes);
}

function getTimeStr(iana: string, date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: iana,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

type ActiveGroup = TzGroup | "all";

export default function TimezonesPage() {
  const branding = useBranding();
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<ActiveGroup>("all");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const grp = params.get("grp") as ActiveGroup | null;
    if (q) setSearch(q);
    if (grp) setActiveGroup(grp);
  }, []);

  function updateUrl(q: string, grp: ActiveGroup) {
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

  function handleGroupToggle(grp: ActiveGroup) {
    const next = activeGroup === grp ? "all" : grp;
    setActiveGroup(next);
    updateUrl(search, next);
  }

  const enriched = useMemo(() => {
    const date = now ?? new Date();
    return TIMEZONES.map((tz) => {
      const offsetStr = getOffsetStr(tz.iana, date);
      const offsetMins = parseOffsetMinutes(offsetStr);
      const timeStr = getTimeStr(tz.iana, date);
      return { ...tz, offsetStr, offsetMins, timeStr };
    });
  }, [now]);

  const filteredSections = useMemo(() => {
    const q = search.toLowerCase().trim();
    return TZ_GROUPS.map((group) => {
      const entries = enriched
        .filter((tz) => {
          if (activeGroup !== "all" && activeGroup !== tz.group) return false;
          if (tz.group !== group.id) return false;
          if (!q) return true;
          return (
            tz.iana.toLowerCase().includes(q) ||
            tz.offsetStr.toLowerCase().includes(q) ||
            tz.abbrs.some((a) => a.toLowerCase().includes(q)) ||
            tz.cities.some((c) => c.toLowerCase().includes(q))
          );
        })
        .sort((a, b) => a.offsetMins - b.offsetMins);
      return { ...group, entries };
    }).filter((g) => g.entries.length > 0);
  }, [enriched, search, activeGroup]);

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — TIMEZONES`}</title>
        <meta
          name="description"
          content="World timezone reference with live current time, UTC offsets, IANA identifiers, and major cities."
        />
        <meta property="og:title" content="Timezone Reference" />
        <meta
          property="og:description"
          content="World timezones with live current time, UTC offsets, IANA names, and major cities."
        />
        <meta
          property="og:url"
          content="https://hypothesis.sh/references/timezones"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Timezone Reference" />
        <link
          rel="canonical"
          href="https://hypothesis.sh/references/timezones"
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
          <h1 className={styles.title}>Timezones</h1>
          <p className={styles.tagline}>
            World timezones with live current time, UTC offsets, IANA
            identifiers, and major cities.
          </p>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search by IANA name, city, offset, or abbreviation..."
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
            {TZ_GROUPS.map((grp) => (
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
                {grp.id}
                <span className={styles.classBtnLabel}>{grp.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.content}>
          {filteredSections.length === 0 ? (
            <div className={styles.empty}>
              No timezones match &ldquo;{search}&rdquo;
            </div>
          ) : (
            filteredSections.map((section) => (
              <div key={section.id} className={styles.section}>
                <div
                  className={styles.sectionHeader}
                  style={
                    {
                      "--cls-color": section.color,
                      "--cls-subtle": section.subtle,
                      "--cls-border": section.border,
                    } as React.CSSProperties
                  }
                >
                  <span className={styles.sectionClass}>{section.id}</span>
                  <span className={styles.sectionLabel}>{section.label}</span>
                  <span className={styles.sectionCount}>
                    {section.entries.length}{" "}
                    {section.entries.length === 1 ? "timezone" : "timezones"}
                  </span>
                </div>

                <div className={styles.codeList}>
                  {section.entries.map((tz) => (
                    <div
                      key={tz.iana}
                      className={styles.codeRow}
                      style={
                        {
                          "--cls-color": section.color,
                          "--cls-subtle": section.subtle,
                          "--cls-border": section.border,
                          gridTemplateColumns: "80px 1fr",
                        } as React.CSSProperties
                      }
                    >
                      <span className={styles.codeBadge}>{tz.offsetStr}</span>
                      <div className={styles.codeInfo}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                            gap: "12px",
                          }}
                        >
                          <span className={styles.codeNameMono}>
                            {tz.iana}
                          </span>
                          {now && (
                            <span
                              className={styles.codeDesc}
                              style={{ flexShrink: 0, fontVariantNumeric: "tabular-nums" }}
                            >
                              {tz.timeStr}
                            </span>
                          )}
                        </div>
                        {tz.abbrs.length > 0 && (
                          <div className={styles.extList}>
                            {tz.abbrs.map((abbr) => (
                              <span key={abbr} className={styles.ext}>
                                {abbr}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className={styles.codeDesc}>
                          {tz.cities.join(", ")}
                        </span>
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
