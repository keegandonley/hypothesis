import fs from "fs";
import path from "path";
import Head from "next/head";
import Link from "next/link";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";
import styles from "../../styles/docs.module.css";
import { useBranding } from "@/lib/branding";

const DOCS_DIR = path.join(process.cwd(), "src/content/docs");
const EXPERIMENT_SLUGS = new Set([
  "iframe-proxy",
  "message-stream",
  "message-factory",
  "webhook",
  "rsa",
]);

export const getStaticPaths: GetStaticPaths = async () => {
  const files = fs.readdirSync(DOCS_DIR);
  const paths = files
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ params: { slug: f.replace(/\.md$/, "") } }));
  return { paths, fallback: false };
};

function extractFirstParagraph(md: string): string {
  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (
      line.length > 0 &&
      !line.startsWith("#") &&
      !line.startsWith("```") &&
      !line.startsWith("-") &&
      !line.startsWith("*") &&
      !line.startsWith("|") &&
      !/^\d+\./.test(line)
    ) {
      return line
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .slice(0, 160);
    }
  }
  return "";
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params!.slug as string;
  const content = fs.readFileSync(path.join(DOCS_DIR, `${slug}.md`), "utf-8");
  const description = extractFirstParagraph(content);
  const toolPageExists = fs.existsSync(
    path.join(process.cwd(), "src/pages", slug),
  );
  const itemLabel = toolPageExists
    ? EXPERIMENT_SLUGS.has(slug)
      ? "experiment"
      : "tool"
    : null;
  return { props: { slug, content, description, itemLabel } };
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

    // Fenced code block
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

    // Headings
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

    // Table
    if (line.startsWith("|")) {
      const parseRow = (l: string) =>
        l
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());
      const headers = parseRow(line);
      i++;
      // skip separator row (---|---)
      if (i < lines.length && lines[i].startsWith("|")) i++;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        rows.push(parseRow(lines[i]));
        i++;
      }
      nodes.push({ type: "table", headers, rows });
      continue;
    }

    // Unordered list
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

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      nodes.push({ type: "ol", items });
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph — collect consecutive plain lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("```") &&
      !lines[i].startsWith("- ") &&
      !lines[i].startsWith("* ") &&
      !/^\d+\.\s/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      nodes.push({ type: "p", text: paraLines.join(" ") });
    }
  }

  return nodes;
}

function Inline({ text }: { text: string }) {
  const parts = text.split(
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g,
  );
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i}>{part.slice(1, -1)}</code>;
        }
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
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

function MarkdownContent({
  content,
  actionType,
}: {
  content: string;
  actionType: string;
}) {
  const substituted = content.replace(/hypothesis-test/g, actionType);
  const nodes = parseMarkdown(substituted);
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

export default function DocsPage({
  slug,
  content,
  description,
  itemLabel,
}: {
  slug: string;
  content: string;
  description: string;
  itemLabel: "tool" | "experiment" | null;
}) {
  const branding = useBranding();
  const router = useRouter();
  const embed = router.query.embed === "true";
  const ogTitle = `${slug.charAt(0).toUpperCase()}${slug.slice(1)} Docs`;
  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — ${slug.toUpperCase()} DOCS`}</title>
        {description && <meta name="description" content={description} />}
        <meta property="og:title" content={ogTitle} />
        {description && (
          <meta property="og:description" content={description} />
        )}
        <meta
          property="og:url"
          content={`https://hypothesis.sh/docs/${slug}`}
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={ogTitle} />
        {description && (
          <meta name="twitter:description" content={description} />
        )}
        <link rel="canonical" href={`https://hypothesis.sh/docs/${slug}`} />
      </Head>
      <div className={styles.inner}>
        {!embed && (
          <>
            <nav className={styles.nav}>
              <Link href="/" className={styles.backLink}>
                <span
                  style={{
                    marginBottom: "3px",
                  }}
                >
                  ←
                </span>{" "}
                {branding.name}
              </Link>
              {itemLabel && (
                <Link href={`/${slug}`} className={styles.toolLink}>
                  open {itemLabel}{" "}
                  <span style={{ letterSpacing: 0, marginBottom: "3px" }}>
                    →
                  </span>
                </Link>
              )}
            </nav>

            <hr className={styles.divider} />
          </>
        )}
        <MarkdownContent content={content} actionType={branding.actionType} />
      </div>
    </div>
  );
}
