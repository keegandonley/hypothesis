import fs from "fs";
import path from "path";
import Head from "next/head";
import Link from "next/link";
import { type GetStaticProps } from "next";
import styles from "../../styles/release-notes.module.css";
import { useBranding } from "@/lib/branding";
import React from "react";
import { TAG_COLORS, type Tag } from "@/lib/tools";

const RELEASES_DIR = path.join(process.cwd(), "src/content/releases");

function parseTags(value?: string): string[] {
  if (!value) return [];

  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function parseFrontmatter(raw: string): Record<string, string> {
  if (!raw.startsWith("---")) return {};
  const end = raw.indexOf("---", 3);

  if (end === -1) return {};
  const block = raw.slice(3, end).trim();
  const meta: Record<string, string> = {};

  for (const line of block.split("\n")) {
    const colon = line.indexOf(":");

    if (colon > -1)
      meta[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }

  return meta;
}

function formatDate(slug: string): string {
  const parts = slug.split("-");

  if (parts.length !== 3) return slug;
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = parseInt(parts[1], 10);

  return `${months[month - 1]} ${parseInt(parts[2], 10)}, ${parts[0]}`;
}

export interface ReleaseEntry {
  slug: string;
  date: string;
  formattedDate: string;
  title: string;
  description: string;
  tags: string[];
}

export const getStaticProps: GetStaticProps = () => {
  const files = fs.readdirSync(RELEASES_DIR).filter((f) => f.endsWith(".md"));
  const releases: ReleaseEntry[] = files
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(RELEASES_DIR, file), "utf-8");
      const meta = parseFrontmatter(raw);

      return {
        slug,
        date: slug,
        formattedDate: formatDate(slug),
        title: meta.title ?? slug,
        description: meta.description ?? "",
        tags: parseTags(meta.tags),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return { props: { releases } };
};

export default function ReleaseNotesIndex({
  releases,
}: {
  releases: ReleaseEntry[];
}): React.ReactNode {
  const branding = useBranding();

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — RELEASE NOTES`}</title>
        <meta
          name="description"
          content={`What's new in ${branding.name} — a changelog of tools, features, and improvements.`}
        />
        <meta property="og:title" content="Release Notes" />
        <meta
          property="og:description"
          content={`What's new in ${branding.name} — a changelog of tools, features, and improvements.`}
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <link rel="canonical" href="https://hypothesis.sh/release-notes" />
      </Head>
      <div className={styles.inner}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.backLink}>
            <span style={{ marginBottom: "3px" }}>←</span> {branding.name}
          </Link>
          <a
            href="/api/rss"
            className={styles.rssLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            RSS
          </a>
        </nav>
        <hr className={styles.divider} />
        <div className={styles.content}>
          <h1>Release Notes</h1>
          <p>
            A changelog of new tools, features, and improvements to{" "}
            {branding.name}.
          </p>
        </div>
        <div className={styles.releaseList}>
          {releases.map((entry) => (
            <div key={entry.slug} className={styles.releaseCard}>
              <Link
                href={`/release-notes/${entry.slug}`}
                className={styles.releaseCardLink}
                aria-label={entry.title}
              />
              <div className={styles.releaseCardBody}>
                <div className={styles.releaseDate}>{entry.formattedDate}</div>
                <div className={styles.releaseTitle}>{entry.title}</div>
                {entry.description && (
                  <div className={styles.releaseDesc}>{entry.description}</div>
                )}
                <div className={styles.releaseArrow}>→</div>
              </div>
              {entry.tags.length > 0 && (
                <div className={styles.releaseCardFooter}>
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className={styles.cardTagDot}
                      title={tag}
                      style={
                        {
                          "--tag-color":
                            TAG_COLORS[tag as Tag]?.color ?? "#888",
                        } as React.CSSProperties
                      }
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
