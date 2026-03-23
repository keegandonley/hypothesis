import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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
          <div className={styles.sectionLabel}>References</div>
          <div className={styles.toolCards}>
            {[...references]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((ref) => (
                <ExperimentCard key={ref.name} {...ref} compact />
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
  docsHref?: string;
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
