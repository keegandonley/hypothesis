import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import styles from "../styles/index.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding, getBranding } from "@/lib/branding";
import {
  tools,
  experiments,
  references,
  ALL_TAGS,
  TAG_COLORS,
  type Tag,
} from "@/lib/tools";


export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const host = req.headers.host ?? "hypothesis.sh";
  const hostname = host.split(":")[0];
  const branding = getBranding(hostname);
  const protocol = req.headers["x-forwarded-proto"] ?? "https";
  const baseUrl = `${protocol}://${host}`;
  return {
    props: {
      ogImageUrl: `${baseUrl}/api/og?domain=${hostname}`,
      ogTitle: branding.name,
      ogDescription: branding.tagline,
      seoDescription:
        "A free collection of online developer tools — Base64 encoder/decoder, JWT inspector, regex tester, UUID generator, color converter, and 30+ more. No signup required.",
    },
  };
};

export default function HomePage({
  ogImageUrl,
  ogTitle,
  ogDescription,
  seoDescription,
}: {
  ogImageUrl: string;
  ogTitle: string;
  ogDescription: string;
  seoDescription: string;
}) {
  const branding = useBranding();
  const router = useRouter();
  const [activeTags, setActiveTags] = useState<Tag[]>([]);
  const [query, setQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const focusedIndexRef = useRef<number | null>(null);
  const navRef = useRef({ items: [] as Array<{ href: string }>, toolsCount: 0, expsCount: 0 });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setFocusedIndex(null);
    focusedIndexRef.current = null;
  }, [query, activeTags]);

  useEffect(() => {
    if (focusedIndex === null) return;
    document.querySelector(`[data-nav-index="${focusedIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [focusedIndex]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (document.activeElement === searchRef.current) {
        if (e.key === "ArrowDown" && navRef.current.items.length > 0) {
          e.preventDefault();
          searchRef.current?.blur();
          focusedIndexRef.current = 0;
          setFocusedIndex(0);
        } else if (e.key === "Escape") {
          setQuery("");
          searchRef.current?.blur();
        }
        return;
      }
      const { items, toolsCount, expsCount } = navRef.current;
      const total = items.length;
      if (total === 0) return;
      const current = focusedIndexRef.current;

      function colsAt(i: number) {
        const twoCol = window.innerWidth > 480;
        if (i < toolsCount) return twoCol ? 2 : 1;
        if (i < toolsCount + expsCount) return 1;
        return twoCol ? 2 : 1;
      }

      function sectionBounds(i: number): [number, number] {
        if (i < toolsCount) return [0, toolsCount];
        if (i < toolsCount + expsCount) return [toolsCount, toolsCount + expsCount];
        return [toolsCount + expsCount, total];
      }

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        let next: number;
        if (current === null) {
          next = e.key === "ArrowUp" || e.key === "ArrowLeft" ? total - 1 : 0;
        } else {
          const cols = colsAt(current);
          const [secStart, secEnd] = sectionBounds(current);
          const posInSection = current - secStart;
          const col = posInSection % cols;
          if (e.key === "ArrowRight") {
            next = Math.min(current + 1, total - 1);
          } else if (e.key === "ArrowLeft") {
            next = Math.max(current - 1, 0);
          } else if (e.key === "ArrowDown") {
            if (posInSection + cols < secEnd - secStart) {
              next = current + cols;
            } else if (secEnd < total) {
              const nextCols = colsAt(secEnd);
              next = secEnd + Math.min(col, nextCols - 1);
            } else {
              next = current;
            }
          } else {
            // ArrowUp
            if (posInSection - cols >= 0) {
              next = current - cols;
            } else if (secStart > 0) {
              const [prevSecStart, prevSecEnd] = sectionBounds(secStart - 1);
              const prevCols = colsAt(prevSecStart);
              const prevCount = prevSecEnd - prevSecStart;
              const lastRowStart = prevSecStart + Math.floor((prevCount - 1) / prevCols) * prevCols;
              next = Math.min(lastRowStart + Math.min(col, prevCols - 1), prevSecEnd - 1);
            } else {
              next = current;
            }
          }
        }
        focusedIndexRef.current = next;
        setFocusedIndex(next);
      } else if (e.key === "Enter" && current !== null) {
        e.preventDefault();
        router.push(items[current].href);
      } else if (e.key === "Escape") {
        if (current !== null) {
          focusedIndexRef.current = null;
          setFocusedIndex(null);
        } else {
          setQuery("");
          searchRef.current?.blur();
        }
      } else if (e.key === "Tab") {
        focusedIndexRef.current = null;
        setFocusedIndex(null);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function matchesQuery(name: string, desc: string) {
    if (!query) return true;
    const lower = query.toLowerCase();
    return name.toLowerCase().includes(lower) || desc.toLowerCase().includes(lower);
  }

  const filteredTools = tools
    .filter((t) => activeTags.length === 0 || t.tags.some((tag) => activeTags.includes(tag)))
    .filter((t) => matchesQuery(t.name, t.description));

  const filteredExperiments = experiments.filter((e) => matchesQuery(e.name, e.description));
  const filteredRefs = references.filter((r) => matchesQuery(r.name, r.description));

  const sortedTools = [...filteredTools].sort((a, b) => a.name.localeCompare(b.name));
  const sortedRefs = [...filteredRefs].sort((a, b) => a.name.localeCompare(b.name));
  const toolsCount = sortedTools.length;
  const expsCount = filteredExperiments.length;
  navRef.current = { items: [...sortedTools, ...filteredExperiments, ...sortedRefs], toolsCount, expsCount };

  function toggleTag(tag: Tag) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }
  return (
    <div className={styles.page}>
      <Head>
        <title>{branding.name.toUpperCase()}</title>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
        <link rel="canonical" href="https://hypothesis.sh/" />
      </Head>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.eyebrow}>{branding.tagline}</div>
          <h1 className={styles.title}>
            {branding.name}
            <span className={styles.cursor} />
          </h1>
          <p className={styles.tagline}>
            {/* {branding.tagline}{" | "} */}
            <Link
              href="/docs/multi-domain"
              className={styles.docsLink}
              style={{ display: "inline-flex", verticalAlign: "middle" }}
            >
              <DocIcon />
              docs
            </Link>
            {" · "}
            <Link
              href="/work"
              className={styles.docsLink}
              style={{ display: "inline-flex", verticalAlign: "middle", gap: "4px" }}
            >
              enter work mode
            </Link>
          </p>
        </header>

        <hr className={styles.divider} />

        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search tools, experiments, references…"
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {!query && <kbd className={styles.searchKbd}>/</kbd>}
        </div>

        {filteredTools.length > 0 && <div className={styles.section}>
          <div className={styles.sectionLabel}>Tools</div>
          <div className={styles.tagFilters}>
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                className={`${styles.tagButton} ${activeTags.includes(tag) ? styles.tagButtonActive : ""}`}
                style={
                  {
                    "--tag-color": TAG_COLORS[tag].color,
                    "--tag-color-subtle": TAG_COLORS[tag].subtle,
                  } as React.CSSProperties
                }
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className={styles.toolCards}>
            {sortedTools.map((tool, i) => (
              <ExperimentCard key={tool.name} {...tool} compact active={focusedIndex === i} navIndex={i} />
            ))}
          </div>
        </div>}

        {filteredExperiments.length > 0 && <div className={styles.section}>
          <div className={styles.sectionLabel}>Experiments</div>
          <div className={styles.cards}>
            {filteredExperiments.map((exp, i) => (
              <ExperimentCard key={exp.id} {...exp} active={focusedIndex === toolsCount + i} navIndex={toolsCount + i} />
            ))}
          </div>
        </div>}

        {filteredRefs.length > 0 && <div className={styles.section}>
          <div className={styles.sectionLabel}>References</div>
          <div className={styles.toolCards}>
            {sortedRefs.map((ref, i) => (
              <ExperimentCard key={ref.name} {...ref} compact active={focusedIndex === toolsCount + expsCount + i} navIndex={toolsCount + expsCount + i} />
            ))}
          </div>
        </div>}

        {query && filteredTools.length === 0 && filteredExperiments.length === 0 && filteredRefs.length === 0 && (
          <p className={styles.emptyState}>No results for &ldquo;{query}&rdquo;</p>
        )}

        <div className={styles.section}>
          <div className={styles.sectionLabel}>About this project</div>
          <a
            href="https://keegan.codes/blog/claude-code-developer-tools"
            className={styles.blogCard}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="https://static.donley.xyz/claude-code-dev-tools-cover.png"
              alt="Blog post cover"
              width={1920}
              height={1080}
              sizes="88px"
              className={styles.blogCover}
            />
            <div className={styles.blogContent}>
              <div className={styles.blogTitle}>
                Claude Code is Great at Building Developer Tools
              </div>
              <div className={styles.blogTagline}>
                An analysis of leveraging Claude Code to generate developer
                tools on the fly.
              </div>
            </div>
          </a>
        </div>

        <div className={styles.footer}>
          A project by{" "}
          <a
            href="https://keegan.codes"
            className={styles.footerLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            keegan donley
          </a>
        </div>
      </div>
    </div>
  );
}


function ExperimentCard({
  id,
  name,
  description,
  href,
  docsHref,
  compact,
  tags,
  active,
  navIndex,
}: {
  id?: string;
  name: string;
  description: string;
  href: string;
  docsHref?: string;
  compact?: boolean;
  tags?: Tag[];
  active?: boolean;
  navIndex?: number;
}) {
  return (
    <div className={`${styles.card}${active ? ` ${styles.cardActive}` : ""}`} data-nav-index={navIndex}>
      <Link href={href} className={styles.cardLink} aria-label={name} />
      {compact ? (
        <div className={styles.cardMainCompact}>
          <div className={styles.cardHeader}>
            <div className={styles.cardBody}>
              <div className={styles.cardName}>{name}</div>
            </div>
            <div className={styles.arrow}>→</div>
          </div>
          <div className={styles.cardDesc}>{description}</div>
        </div>
      ) : (
        <div className={styles.cardMain}>
          <div className={styles.badge}>{id}</div>
          <div className={styles.cardBodyRow}>
            <div className={styles.cardBody}>
              <div className={styles.cardName}>{name}</div>
              <div className={styles.cardDesc}>{description}</div>
            </div>
            <div className={styles.arrow}>→</div>
          </div>
        </div>
      )}
      <div className={compact ? styles.cardFooterCompact : styles.cardFooter}>
        {docsHref && (
          <Link href={docsHref} className={styles.docsLink}>
            <DocIcon />
            docs
          </Link>
        )}
        {tags && tags.length > 0 && (
          <div className={styles.cardTags}>
            {tags.map((tag) => (
              <span
                key={tag}
                className={styles.cardTagDot}
                title={tag}
                style={
                  {
                    "--tag-color": TAG_COLORS[tag].color,
                  } as React.CSSProperties
                }
              >
                {tag.slice(0, 2).toUpperCase()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
