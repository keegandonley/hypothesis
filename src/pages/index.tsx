import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { GetServerSideProps } from "next";
import styles from "../styles/index.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding, getBranding } from "@/lib/branding";

type Tag = "encoding" | "security" | "conversion" | "web" | "sysadmin" | "text";
const ALL_TAGS: Tag[] = [
  "encoding",
  "security",
  "conversion",
  "web",
  "sysadmin",
  "text",
];

const TAG_COLORS: Record<Tag, { color: string; subtle: string }> = {
  encoding: { color: "#60a5fa", subtle: "#60a5fa18" },
  security: { color: "#f87171", subtle: "#f8717118" },
  conversion: { color: "#c084fc", subtle: "#c084fc18" },
  web: { color: "#2dd4bf", subtle: "#2dd4bf18" },
  sysadmin: { color: "#fbbf24", subtle: "#fbbf2418" },
  text: { color: "#34d399", subtle: "#34d39918" },
};

const experiments = [
  {
    id: "EXP-001",
    name: "iframe proxy",
    description:
      "Proxy iframes securely with full event handling and introspection for debugging.",
    href: "/iframe-proxy?debug=true",
    docsHref: "/docs/iframe-proxy",
  },
  {
    id: "EXP-002",
    name: "message stream",
    description: "Capture and inspect frame messages in real time.",
    href: "/message-stream",
    docsHref: "/docs/message-stream",
  },
  {
    id: "EXP-003",
    name: "message factory",
    description:
      "Design and trigger postMessage actions with an interactive viewer and designer.",
    href: "/message-factory",
    docsHref: "/docs/message-factory",
  },
  {
    id: "EXP-004",
    name: "webhook",
    description:
      "Capture and inspect incoming HTTP webhook requests in real time.",
    href: "/webhook",
    docsHref: "/docs/webhook",
  },
  {
    id: "EXP-005",
    name: "rsa encryption",
    description:
      "Generate RSA-OAEP key pairs, encrypt messages, and decrypt them in-browser using the Web Crypto API.",
    href: "/rsa",
    docsHref: "/docs/rsa",
  },
];

const tools: {
  name: string;
  description: string;
  href: string;
  docsHref: string;
  tags: Tag[];
}[] = [
  {
    name: "base64",
    description:
      "Encode and decode base64 strings with live sync and shareable permalinks.",
    href: "/base64",
    docsHref: "/docs/base64",
    tags: ["encoding", "web", "text", "conversion"],
  },
  {
    name: "bitwise",
    description:
      "Visualize AND, OR, XOR, NAND, NOR, and shift operations with binary and decimal output side by side.",
    href: "/bitwise",
    docsHref: "/docs/bitwise",
    tags: ["sysadmin"],
  },
  {
    name: "chmod",
    description:
      "Convert between numeric and symbolic Unix file permission modes with a visual breakdown table.",
    href: "/chmod",
    docsHref: "/docs/chmod",
    tags: ["conversion", "sysadmin"],
  },
  {
    name: "cidr",
    description:
      "Calculate subnet details from CIDR notation: network address, broadcast, mask, host range, and more.",
    href: "/cidr",
    docsHref: "/docs/cidr",
    tags: ["sysadmin"],
  },
  {
    name: "color",
    description:
      "Convert color values between HEX, RGB, RGBA, HSL, and OKLCH with live preview.",
    href: "/color",
    docsHref: "/docs/color",
    tags: ["conversion", "web"],
  },
  {
    name: "compress",
    description:
      "Compress PNG, JPEG, and WebP images server-side. Convert to WebP or AVIF for maximum file size reduction.",
    href: "/compress",
    docsHref: "/docs/compress",
    tags: ["conversion", "web"],
  },
  {
    name: "css unit",
    description:
      "Convert between CSS units: px, rem, em, %, vh, vw, pt, cm, mm, in with adjustable context.",
    href: "/css-unit",
    docsHref: "/docs/css-unit",
    tags: ["conversion", "web"],
  },
  {
    name: "cron",
    description:
      "Parse cron expressions into plain English and preview the next 10 scheduled run times.",
    href: "/cron",
    docsHref: "/docs/cron",
    tags: ["sysadmin"],
  },
  {
    name: "datetime",
    description:
      "Convert timestamps and dates between many formats at once with live sync and shareable permalinks.",
    href: "/datetime",
    docsHref: "/docs/datetime",
    tags: ["conversion", "web"],
  },
  {
    name: "hash",
    description:
      "Generate MD5, SHA-1, SHA-256, SHA-384, and SHA-512 hashes from any text input.",
    href: "/hash",
    docsHref: "/docs/hash",
    tags: ["encoding", "security", "sysadmin", "web", "text"],
  },
  {
    name: "html entity",
    description:
      "Encode and decode HTML entities for safe display in web pages with multiple encoding modes.",
    href: "/html-entity",
    docsHref: "/docs/html-entity",
    tags: ["encoding", "web", "text"],
  },
  {
    name: "jwt",
    description:
      "Decode JWT tokens and inspect header, payload claims, and expiry status.",
    href: "/jwt",
    docsHref: "/docs/jwt",
    tags: ["security", "web"],
  },
  {
    name: "lorem ipsum",
    description:
      "Generate lorem ipsum placeholder text by words, sentences, or paragraphs with one click.",
    href: "/lorem",
    docsHref: "/docs/lorem",
    tags: ["web", "text"],
  },
  {
    name: "number base",
    description:
      "Convert integers between binary, octal, decimal, and hex with live sync and shareable permalinks.",
    href: "/numbase",
    docsHref: "/docs/numbase",
    tags: ["conversion"],
  },
  {
    name: "pretty print",
    description:
      "Format and validate JSON with live pretty-printing and shareable permalinks.",
    href: "/pretty-print",
    docsHref: "/docs/pretty-print",
    tags: ["web"],
  },
  {
    name: "qr code",
    description:
      "Generate QR codes from any text or URL and download as SVG or PNG.",
    href: "/qr",
    docsHref: "/docs/qr",
    tags: ["web"],
  },
  {
    name: "regex",
    description:
      "Test regular expressions against strings with live match results and shareable permalinks.",
    href: "/regex",
    docsHref: "/docs/regex",
    tags: ["web", "sysadmin", "text"],
  },
  {
    name: "json → typescript",
    description:
      "Convert a JSON sample into TypeScript interface definitions instantly.",
    href: "/json-ts",
    docsHref: "/docs/json-ts",
    tags: ["conversion", "web"] as Tag[],
  },
  {
    name: "text diff",
    description:
      "Compare two blocks of text and highlight additions and deletions line by line.",
    href: "/diff",
    docsHref: "/docs/diff",
    tags: ["text"] as Tag[],
  },
  {
    name: "text stats",
    description:
      "Analyze text statistics: character count, word count, reading time, and word frequency analysis.",
    href: "/text-stats",
    docsHref: "/docs/text-stats",
    tags: ["text"],
  },
  {
    name: "unicode",
    description:
      "Inspect each character's code point, UTF-8/UTF-16 encoding, category, script, and HTML entity.",
    href: "/unicode",
    docsHref: "/docs/unicode",
    tags: ["text", "encoding"],
  },
  {
    name: "url encode",
    description:
      "Encode and decode URL strings with live sync and shareable permalinks.",
    href: "/urlencode",
    docsHref: "/docs/urlencode",
    tags: ["encoding", "web", "text"],
  },
  {
    name: "my ip",
    description:
      "Look up your current public IP address with geolocation, ASN, and network details.",
    href: "/my-ip",
    docsHref: "/docs/my-ip",
    tags: ["web", "sysadmin"],
  },
  {
    name: "uuid",
    description:
      "Generate UUIDs of any version with one click and shareable permalinks.",
    href: "/uuid",
    docsHref: "/docs/uuid",
    tags: ["security", "sysadmin", "web"],
  },
];

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
    },
  };
};

export default function HomePage({
  ogImageUrl,
  ogTitle,
  ogDescription,
}: {
  ogImageUrl: string;
  ogTitle: string;
  ogDescription: string;
}) {
  const branding = useBranding();
  const [activeTags, setActiveTags] = useState<Tag[]>([]);

  const filteredTools =
    activeTags.length === 0
      ? tools
      : tools.filter((t) => t.tags.some((tag) => activeTags.includes(tag)));

  function toggleTag(tag: Tag) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }
  return (
    <div className={styles.page}>
      <Head>
        <title>{branding.name.toUpperCase()}</title>
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
          </p>
        </header>

        <hr className={styles.divider} />

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
            {[...filteredTools]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((tool) => (
                <ExperimentCard key={tool.name} {...tool} compact />
              ))}
          </div>
        </div>
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Experiments</div>
          <div className={styles.cards}>
            {experiments.map((exp) => (
              <ExperimentCard key={exp.id} {...exp} />
            ))}
          </div>
        </div>

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
}: {
  id?: string;
  name: string;
  description: string;
  href: string;
  docsHref: string;
  compact?: boolean;
  tags?: Tag[];
}) {
  return (
    <div className={styles.card}>
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
        <Link href={docsHref} className={styles.docsLink}>
          <DocIcon />
          docs
        </Link>
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
