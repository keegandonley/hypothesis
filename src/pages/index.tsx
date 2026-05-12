import fs from "fs";
import path from "path";
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

const RELEASES_DIR = path.join(process.cwd(), "src/content/releases");

type ReleaseEntry = {
  slug: string;
  date: string;
  formattedDate: string;
  title: string;
  description: string;
  tags: string[];
};

function parseReleaseFrontmatter(raw: string): Record<string, string> {
  if (!raw.startsWith("---")) return {};
  const end = raw.indexOf("---", 3);
  if (end === -1) return {};
  const block = raw.slice(3, end).trim();
  const meta: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const colon = line.indexOf(":");
    if (colon > -1) meta[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
  return meta;
}

function parseReleaseTags(value?: string): string[] {
  if (!value) return [];
  return value.split(",").map((t) => t.trim()).filter(Boolean);
}

function formatReleaseDate(slug: string): string {
  const parts = slug.split("-");
  if (parts.length !== 3) return slug;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = parseInt(parts[1], 10);
  return `${months[month - 1]} ${parseInt(parts[2], 10)}, ${parts[0]}`;
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const host = req.headers.host ?? "hypothesis.sh";
  const hostname = host.split(":")[0];
  const branding = getBranding(hostname);
  const protocol = req.headers["x-forwarded-proto"] ?? "https";
  const baseUrl = `${protocol}://${host}`;

  let releasesList: ReleaseEntry[] = [];
  try {
    const files = fs.readdirSync(RELEASES_DIR).filter((f) => f.endsWith(".md"));
    releasesList = files
      .map((file) => {
        const slug = file.replace(/\.md$/, "");
        const raw = fs.readFileSync(path.join(RELEASES_DIR, file), "utf-8");
        const meta = parseReleaseFrontmatter(raw);
        return {
          slug,
          date: slug,
          formattedDate: formatReleaseDate(slug),
          title: meta.title ?? slug,
          description: meta.description ?? "",
          tags: parseReleaseTags(meta.tags),
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 1);
  } catch {}

  return {
    props: {
      ogImageUrl: `${baseUrl}/api/og?domain=${hostname}`,
      ogTitle: branding.name,
      ogDescription: branding.tagline,
      seoDescription:
        "A free collection of online developer tools — Base64 encoder/decoder, JWT inspector, regex tester, UUID generator, color converter, and 30+ more. No signup required.",
      toolsList: tools,
      experimentsList: experiments,
      referencesList: references,
      releasesList,
    },
  };
};

export default function HomePage({
  ogImageUrl,
  ogTitle,
  ogDescription,
  seoDescription,
  toolsList,
  experimentsList,
  referencesList,
  releasesList,
}: {
  ogImageUrl: string;
  ogTitle: string;
  ogDescription: string;
  seoDescription: string;
  toolsList: typeof tools;
  experimentsList: typeof experiments;
  referencesList: typeof references;
  releasesList: ReleaseEntry[];
}) {
  const branding = useBranding();
  const router = useRouter();
  const [activeTags, setActiveTags] = useState<Tag[]>([]);
  const [activeRefTags, setActiveRefTags] = useState<Tag[]>([]);
  const [query, setQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const focusedIndexRef = useRef<number | null>(null);
  const navRef = useRef({
    items: [] as Array<{ href: string }>,
    toolsCount: 0,
    expsCount: 0,
  });

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
    document
      .querySelector(`[data-nav-index="${focusedIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
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
        if (i < toolsCount + expsCount)
          return [toolsCount, toolsCount + expsCount];
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
              const lastRowStart =
                prevSecStart +
                Math.floor((prevCount - 1) / prevCols) * prevCols;
              next = Math.min(
                lastRowStart + Math.min(col, prevCols - 1),
                prevSecEnd - 1,
              );
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
    return (
      name.toLowerCase().includes(lower) || desc.toLowerCase().includes(lower)
    );
  }

  const filteredTools = toolsList
    .filter(
      (t) =>
        query ||
        activeTags.length === 0 ||
        t.tags.some((tag) => activeTags.includes(tag)),
    )
    .filter((t) => matchesQuery(t.name, t.description));

  const filteredExperiments = experimentsList.filter((e) =>
    matchesQuery(e.name, e.description),
  );
  const filteredRefs = referencesList
    .filter(
      (r) =>
        query ||
        activeRefTags.length === 0 ||
        r.tags.some((tag) => activeRefTags.includes(tag)),
    )
    .filter((r) => matchesQuery(r.name, r.description));

  const sortedTools = [...filteredTools].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const sortedRefs = [...filteredRefs].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const toolsCount = sortedTools.length;
  const expsCount = filteredExperiments.length;
  navRef.current = {
    items: [...sortedTools, ...filteredExperiments, ...sortedRefs],
    toolsCount,
    expsCount,
  };

  function toggleTag(tag: Tag) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function toggleRefTag(tag: Tag) {
    setActiveRefTags((prev) =>
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
              style={{
                display: "inline-flex",
                verticalAlign: "middle",
                gap: "4px",
              }}
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

        {filteredTools.length > 0 && (
          <div className={styles.section}>
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
                <ExperimentCard
                  key={tool.name}
                  {...tool}
                  compact
                  active={focusedIndex === i}
                  navIndex={i}
                />
              ))}
            </div>
          </div>
        )}

        {filteredExperiments.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Experiments</div>
            <div className={styles.toolCards}>
              {filteredExperiments.map((exp, i) => (
                <ExperimentCard
                  key={exp.id}
                  {...exp}
                  compact
                  active={focusedIndex === toolsCount + i}
                  navIndex={toolsCount + i}
                />
              ))}
            </div>
          </div>
        )}

        {filteredRefs.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>References</div>
            <div className={styles.tagFilters}>
              {ALL_TAGS.filter((tag) =>
                referencesList.some((r) => r.tags.includes(tag)),
              ).map((tag) => (
                <button
                  key={tag}
                  className={`${styles.tagButton} ${activeRefTags.includes(tag) ? styles.tagButtonActive : ""}`}
                  style={
                    {
                      "--tag-color": TAG_COLORS[tag].color,
                      "--tag-color-subtle": TAG_COLORS[tag].subtle,
                    } as React.CSSProperties
                  }
                  onClick={() => toggleRefTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
            <div className={styles.toolCards}>
              {sortedRefs.map((ref, i) => (
                <ExperimentCard
                  key={ref.name}
                  {...ref}
                  compact
                  active={focusedIndex === toolsCount + expsCount + i}
                  navIndex={toolsCount + expsCount + i}
                />
              ))}
            </div>
          </div>
        )}

        {query &&
          filteredTools.length === 0 &&
          filteredExperiments.length === 0 &&
          filteredRefs.length === 0 && (
            <p className={styles.emptyState}>
              No results for &ldquo;{query}&rdquo;
            </p>
          )}

        {releasesList.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Latest Release</div>
            <div className={styles.cards}>
              {releasesList.map((release) => (
                <ExperimentCard
                  key={release.slug}
                  id={release.formattedDate}
                  name={release.title}
                  description={release.description}
                  href={`/release-notes/${release.slug}`}
                  active={false}
                  releaseTags={release.tags}
                />
              ))}
            </div>
            <div style={{ marginTop: "8px", display: "flex", justifyContent: "flex-end" }}>
              <Link href="/release-notes" className={styles.docsLink}>
                View all release notes →
              </Link>
            </div>
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.sectionLabel}>About this project</div>
          <a
            href="https://keegan.codes/blog/introducing-the-hypothesis-mobile-app"
            className={styles.blogCard}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="https://static.donley.xyz/hypothesis-cover.png"
              alt="Blog post cover"
              width={1920}
              height={1080}
              sizes="88px"
              className={styles.blogCover}
            />
            <div className={styles.blogContent}>
              <div className={styles.blogTitle}>
                Introducing the Companion Mobile App for Hypothesis.sh
              </div>
              <div className={styles.blogTagline}>
                A free iOS app with push notifications, persistent webhook
                sessions, and pocket-sized access to developer tools.
              </div>
            </div>
          </a>
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
          <a
            href="https://apps.apple.com/us/app/hypothesis-sh/id6764898246"
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://static.donley.xyz/appstore-white.svg"
              alt="Download on the App Store"
              className={styles.appStoreBadge}
            />
          </a>
          <div className={styles.footerText}>
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
  releaseTags,
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
  releaseTags?: string[];
}) {
  return (
    <div
      className={`${styles.card}${active ? ` ${styles.cardActive}` : ""}`}
      data-nav-index={navIndex}
    >
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
          <div className={styles.cardBodyRow}>
            {id && <div className={styles.badge}>{id}</div>}
            <div className={styles.arrow} style={{ marginLeft: "auto" }}>→</div>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.cardName}>{name}</div>
            <div className={styles.cardDesc}>{description}</div>
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
        {releaseTags && releaseTags.length > 0 && (
          <div className={styles.cardTags}>
            {releaseTags.map((tag) => (
              <span
                key={tag}
                className={styles.cardTagPill}
                title={tag}
                style={{ "--tag-color": TAG_COLORS[tag as Tag]?.color ?? "#888" } as React.CSSProperties}
              >
                {tag}
              </span>
            ))}
          </div>
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
        {id && compact && <div className={styles.badge} style={{ marginLeft: "auto" }}>{id}</div>}
      </div>
    </div>
  );
}
