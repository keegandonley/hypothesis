import Link from "next/link";
import styles from "../styles/index.module.css";

const experiments = [
  {
    id: "EXP-001",
    name: "iframe-proxy",
    description:
      "Proxy iframes securely with full event handling and introspection for debugging.",
    href: "/iframe-proxy",
  },
  {
    id: "EXP-002",
    name: "messages",
    description: "Capture and inspect frame messages in real time.",
    href: "/messages",
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
          tools for thinking |{" "}
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
}: {
  id: string;
  name: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} style={{ display: "block" }}>
      <div className={styles.card}>
        <div className={styles.badge}>{id}</div>
        <div className={styles.cardBody}>
          <div className={styles.cardName}>{name}</div>
          <div className={styles.cardDesc}>{description}</div>
        </div>
        <div className={styles.arrow}>→</div>
      </div>
    </Link>
  );
}
