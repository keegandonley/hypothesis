import Head from "next/head";
import Link from "next/link";
import styles from "../styles/offline.module.css";
import { useBranding } from "@/lib/branding";

export default function OfflinePage() {
  const branding = useBranding();

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — OFFLINE`}</title>
      </Head>
      <p className={styles.eyebrow}>{branding.domain}</p>
      <h1 className={styles.title}>You&apos;re offline</h1>
      <p className={styles.tagline}>
        This page isn&apos;t cached yet. Visit it online first to use it offline.
      </p>
      <Link href="/" className={styles.link}>
        back to home
      </Link>
    </div>
  );
}
