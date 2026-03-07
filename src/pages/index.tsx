import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../styles/index.module.css";

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
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div className={styles.eyebrow}>v0.1.0</div>
          <h1 className={styles.title}>
            hypothesis
            <span className={styles.cursor} />
          </h1>
          <p className={styles.tagline}>A workbench for web experiments</p>
        </header>

        <hr className={styles.divider} />

        <div className={styles.experiments}>
          {experiments.map((exp) => (
            <ExperimentCard key={exp.id} {...exp} />
          ))}
        </div>

        <div className={styles.footer}>
          tools for thinking | A project by{" "}
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

function DocIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2.5" y="1.5" width="10" height="12" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <line x1="5" y1="5.5" x2="10" y2="5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5" y1="8" x2="10" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="5" y1="10.5" x2="8" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
