import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/index.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding } from "@/lib/branding";

const experiments = [
  {
    id: "EXP-001",
    name: "iframe-proxy",
    description:
      "Proxy iframes securely with full event handling and introspection for debugging.",
    href: "/iframe-proxy",
    docsHref: "/docs/iframe-proxy",
  },
  {
    id: "EXP-002",
    name: "messages",
    description: "Capture and inspect frame messages in real time.",
    href: "/messages",
    docsHref: "/docs/messages",
  },
  {
    id: "EXP-003",
    name: "base64",
    description:
      "Encode and decode base64 strings with live sync and shareable permalinks.",
    href: "/base64",
    docsHref: "/docs/base64",
  },
];

export default function HomePage() {
  const branding = useBranding();
  return (
    <div className={styles.page}>
      <Head>
        <title>{branding.name}</title>
      </Head>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.eyebrow}>v0.1.0</div>
          <h1 className={styles.title}>
            {branding.name}
            <span className={styles.cursor} />
          </h1>
          <p className={styles.tagline}>
            {branding.tagline}{" | "}
            <Link href="/docs/multi-domain" className={styles.docsLink} style={{ display: "inline-flex", verticalAlign: "middle" }}>
              <DocIcon />
              docs
            </Link>
          </p>
        </header>

        <hr className={styles.divider} />

        <div className={styles.experiments}>
          {experiments.map((exp) => (
            <ExperimentCard key={exp.id} {...exp} />
          ))}
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
