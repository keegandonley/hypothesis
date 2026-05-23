import fs from "fs";
import path from "path";
import Head from "next/head";
import Link from "next/link";
import type { GetStaticPaths, GetStaticProps } from "next";
import styles from "@/styles/release-notes.module.css";
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

function parseFrontmatter(raw: string): {
  meta: Record<string, string>;
  body: string;
} {
  if (!raw.startsWith("---")) return { meta: {}, body: raw };
  const end = raw.indexOf("---", 3);

  if (end === -1) return { meta: {}, body: raw };
  const block = raw.slice(3, end).trim();
  const meta: Record<string, string> = {};

  for (const line of block.split("\n")) {
    const colon = line.indexOf(":");

    if (colon > -1)
      meta[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }

  return { meta, body: raw.slice(end + 3).trim() };
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

export const getStaticPaths: GetStaticPaths = () => {
  const files = fs.readdirSync(RELEASES_DIR);
  const paths = files
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ params: { version: f.replace(/\.md$/, "") } }));

  return { paths, fallback: false };
};

type BlogPost = {
  title: string;
  description: string;
  cover: string;
  url: string;
} | null;

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const version = (params?.version as string) ?? "";
  const raw = fs.readFileSync(
    path.join(RELEASES_DIR, `${version}.md`),
    "utf-8",
  );
  const { meta, body } = parseFrontmatter(raw);
  const title = meta.title ?? version;
  const description = meta.description ?? "";
  const formattedDate = formatDate(version);
  const tags = parseTags(meta.tags);

  let blogPost: BlogPost = null;

  if (meta.blog) {
    try {
      const res = await fetch(
        `https://keegan.codes/api/posts/single?slug=${meta.blog}`,
      );

      if (res.ok) {
        const data = (await res.json()) as {
          title: string;
          description: string;
          cover: string;
          url: string;
        };

        blogPost = {
          title: data.title,
          description: data.description,
          cover: data.cover,
          url: data.url,
        };
      }
    } catch {}
  }

  return {
    props: {
      version,
      content: body,
      title,
      description,
      formattedDate,
    tags,
      blogPost,
    },
  };
};

// ── Markdown renderer ──────────────────────────────────────────────────────────

type Node =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "pre"; lang: string; code: string }
  | { type: "table"; headers: string[]; rows: string[][] };

function parseMarkdown(md: string): Node[] {
  const lines = md.split("\n");
  const nodes: Node[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];

      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }

      nodes.push({ type: "pre", lang, code: codeLines.join("\n") });
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      nodes.push({ type: "h3", text: line.slice(4) });
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      nodes.push({ type: "h2", text: line.slice(3) });
      i++;
      continue;
    }

    if (line.startsWith("# ")) {
      nodes.push({ type: "h1", text: line.slice(2) });
      i++;
      continue;
    }

    if (line.startsWith("|")) {
      const parseRow = (l: string): string[] =>
        l
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());
      const headers = parseRow(line);

      i++;
      if (i < lines.length && lines[i].startsWith("|")) i++;
      const rows: string[][] = [];

      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(parseRow(lines[i]));
        i++;
      }

      nodes.push({ type: "table", headers, rows });
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];

      while (
        i < lines.length &&
        (lines[i].startsWith("- ") || lines[i].startsWith("* "))
      ) {
        items.push(lines[i].slice(2));
        i++;
      }

      nodes.push({ type: "ul", items });
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];

      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }

      nodes.push({ type: "ol", items });
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    const paraLines: string[] = [];

    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith("- ") &&
      !lines[i].startsWith("* ") &&
      !lines[i].startsWith("|") &&
      !/^\d+\.\s/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length > 0)
      nodes.push({ type: "p", text: paraLines.join(" ") });
  }

  return nodes;
}

function Inline({ text }: { text: string }): React.ReactNode {
  const parts = text.split(
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g,
  );

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("*") && part.endsWith("*"))
          return <em key={i}>{part.slice(1, -1)}</em>;
        if (part.startsWith("`") && part.endsWith("`"))
          return <code key={i}>{part.slice(1, -1)}</code>;
        const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);

        if (linkMatch) {
          const isExternal = /^https?:\/\//.test(linkMatch[2]);

          return (
            <a
              key={i}
              href={linkMatch[2]}
              {...(isExternal
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {linkMatch[1]}
            </a>
          );
        }

        return part;
      })}
    </>
  );
}

function MarkdownContent({ content }: { content: string }): React.ReactNode {
  const nodes = parseMarkdown(content);

  return (
    <div className={styles.content}>
      {nodes.map((node, i) => {
        switch (node.type) {
          case "h1":
            return (
              <h1 key={i}>
                <Inline text={node.text} />
              </h1>
            );
          case "h2":
            return (
              <h2
                key={i}
                id={node.text
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^a-z0-9-]/g, "")}
              >
                <Inline text={node.text} />
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                id={node.text
                  .toLowerCase()
                  .replace(/\s+/g, "-")
                  .replace(/[^a-z0-9-]/g, "")}
              >
                <Inline text={node.text} />
              </h3>
            );
          case "p":
            return (
              <p key={i}>
                <Inline text={node.text} />
              </p>
            );
          case "ul":
            return (
              <ul key={i}>
                {node.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i}>
                {node.items.map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </ol>
            );
          case "pre":
            return (
              <pre key={i}>
                <code>{node.code}</code>
              </pre>
            );
          case "table":
            return (
              <table key={i} className={styles.table}>
                <thead>
                  <tr>
                    {node.headers.map((h, j) => (
                      <th key={j}>
                        <Inline text={h} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {node.rows.map((row, j) => (
                    <tr key={j}>
                      {row.map((cell, k) => (
                        <td key={k}>
                          <Inline text={cell} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
        }
      })}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ReleaseNotePage({
  version,
  content,
  title,
  description,
  formattedDate,
  tags,
  blogPost,
}: {
  version: string;
  content: string;
  title: string;
  description: string;
  formattedDate: string;
  tags: string[];
  blogPost: BlogPost;
}): React.ReactNode {
  const branding = useBranding();
  const ogImageUrl = `https://hypothesis.sh/api/og?type=release&title=${encodeURIComponent(title)}&date=${version}&domain=hypothesis.sh`;

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — ${title.toUpperCase()}`}</title>
        {description && <meta name="description" content={description} />}
        <meta property="og:title" content={title} />
        {description && (
          <meta property="og:description" content={description} />
        )}
        <meta
          property="og:url"
          content={`https://hypothesis.sh/release-notes/${version}`}
        />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        {description && (
          <meta name="twitter:description" content={description} />
        )}
        <meta name="twitter:image" content={ogImageUrl} />
        <link
          rel="canonical"
          href={`https://hypothesis.sh/release-notes/${version}`}
        />
      </Head>
      <div className={styles.inner}>
        <nav className={styles.nav}>
          <Link href="/release-notes" className={styles.backLink}>
            <span style={{ marginBottom: "3px" }}>←</span> Release Notes
          </Link>
          <div className={styles.metaDate}>{formattedDate}</div>
        </nav>
        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.map((tag) => (
              <span
                key={tag}
                className={styles.cardTagDot}
                title={tag}
                style={
                  {
                    "--tag-color": TAG_COLORS[tag as Tag]?.color ?? "#888",
                  } as React.CSSProperties
                }
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <hr className={styles.divider} />
        <MarkdownContent content={content} />
        {tags.includes("mobile") && (
          <a
            href="https://apps.apple.com/us/app/hypothesis-sh/id6764898246"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.appStoreLink}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://static.donley.xyz/appstore-white.svg"
              alt="Download on the App Store"
              className={styles.appStoreBadge}
            />
          </a>
        )}
        {blogPost && (
          <a
            href={blogPost.url}
            className={styles.blogCard}
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://static.donley.xyz/${blogPost.cover}`}
              alt={blogPost.title}
              className={styles.blogCover}
            />
            <div className={styles.blogCardContent}>
              <div className={styles.blogCardLabel}>Blog Post</div>
              <div className={styles.blogCardTitle}>{blogPost.title}</div>
              <div className={styles.blogCardDesc}>{blogPost.description}</div>
            </div>
          </a>
        )}
      </div>
    </div>
  );
}
