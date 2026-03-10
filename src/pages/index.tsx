import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import styles from "../styles/index.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding, getBranding } from "@/lib/branding";

const experiments = [
  {
    id: "EXP-001",
    name: "iframe-proxy",
    description:
      "Proxy iframes securely with full event handling and introspection for debugging.",
    href: "/iframe-proxy?debug=true",
    docsHref: "/docs/iframe-proxy",
  },
  {
    id: "EXP-002",
    name: "message-stream",
    description: "Capture and inspect frame messages in real time.",
    href: "/message-stream",
    docsHref: "/docs/message-stream",
  },
  {
    id: "EXP-003",
    name: "message-factory",
    description:
      "Design and trigger postMessage actions with an interactive viewer and designer.",
    href: "/message-factory",
    docsHref: "/docs/message-factory",
  },
];

const tools = [
  {
    id: "TOOL-1",
    name: "base64",
    description:
      "Encode and decode base64 strings with live sync and shareable permalinks.",
    href: "/base64",
    docsHref: "/docs/base64",
  },
  {
    id: "TOOL-2",
    name: "urlencode",
    description:
      "Encode and decode URL strings with live sync and shareable permalinks.",
    href: "/urlencode",
    docsHref: "/docs/urlencode",
  },
  {
    id: "TOOL-3",
    name: "regex",
    description:
      "Test regular expressions against strings with live match results and shareable permalinks.",
    href: "/regex",
    docsHref: "/docs/regex",
  },
  {
    id: "TOOL-4",
    name: "pretty-print",
    description:
      "Format and validate JSON with live pretty-printing and shareable permalinks.",
    href: "/pretty-print",
    docsHref: "/docs/pretty-print",
  },
];

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const host = req.headers.host ?? "hypothesis.sh";
  const hostname = host.split(":")[0];
  const branding = getBranding(hostname);
  const protocol = req.headers["x-forwarded-proto"] ?? "https";
  const baseUrl = `${protocol}://${host}`;
  return { props: { ogImageUrl: `${baseUrl}/api/og?domain=${hostname}`, ogTitle: branding.name, ogDescription: branding.tagline } };
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
  return (
    <div className={styles.page}>
      <Head>
        <title>{branding.name}</title>
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
          <div className={styles.sectionLabel}>Experiments</div>
          <div className={styles.cards}>
            {experiments.map((exp) => (
              <ExperimentCard key={exp.id} {...exp} />
            ))}
          </div>
        </div>
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Tools</div>
          <div className={styles.cards}>
            {tools.map((tool) => (
              <ExperimentCard key={tool.id} {...tool} />
            ))}
          </div>
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
}: {
  id: string;
  name: string;
  description: string;
  href: string;
  docsHref: string;
}) {
  const router = useRouter();
  return (
    <div className={styles.card} onClick={() => router.push(href)}>
      <div className={styles.cardMain}>
        <div className={styles.badge}>{id}</div>
        <div className={styles.cardBody}>
          <div className={styles.cardName}>{name}</div>
          <div className={styles.cardDesc}>{description}</div>
        </div>
        <div className={styles.arrow}>→</div>
      </div>
      <div className={styles.cardFooter}>
        <Link
          href={docsHref}
          className={styles.docsLink}
          onClick={(e) => e.stopPropagation()}
        >
          <DocIcon />
          docs
        </Link>
      </div>
    </div>
  );
}
