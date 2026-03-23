import Link from "next/link";
import styles from "@/styles/referenceLinks.module.css";

interface Ref {
  name: string;
  slug: string;
}

export function ReferenceLinks({ refs }: { refs: Ref[] }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>ref:</span>
      {refs.map((r) => (
        <Link
          key={r.slug}
          href={`/references/${r.slug}`}
          className={styles.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          {r.name}
        </Link>
      ))}
    </div>
  );
}
