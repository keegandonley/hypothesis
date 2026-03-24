import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../../styles/message-factory.module.css";
import { DocIcon } from "@/components/icons/doc";
import { useBranding } from "@/lib/branding";

const subExperiments = [
  {
    id: "EXP-003.A",
    name: "message designer",
    description:
      "Build arrays of postMessage actions with name, id, and payload. Shareable permalinks.",
    href: "/message-factory/designer",
    docsHref: "/docs/message-factory#message-designer",
  },
  {
    id: "EXP-003.B",
    name: "message viewer",
    description:
      "Load actions from URL and render buttons that trigger postMessage to the parent frame.",
    href: "/message-factory/viewer",
    docsHref: "/docs/message-factory#message-viewer",
  },
];

export default function MessageFactoryPage() {
  const branding = useBranding();
  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — MESSAGE FACTORY`}</title>
      </Head>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.eyebrow} data-eyebrow>EXP-003</div>
          <h1 className={styles.title}>Message Factory</h1>
          <p className={styles.tagline}>
            Design and trigger postMessage actions with an interactive viewer
            and designer.
          </p>
          <div className={styles.backRow}>
            <Link href="/" className={styles.backLink}>
              ← back
            </Link>
          </div>
        </header>

        <hr className={styles.divider} />

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Sub-experiments</div>
          <div className={styles.cards}>
            {subExperiments.map((exp) => (
              <SubExperimentCard key={exp.id} {...exp} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SubExperimentCard({
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
