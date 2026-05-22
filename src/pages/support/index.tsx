import Head from "next/head";
import Link from "next/link";
import styles from "../../styles/docs.module.css";
import { useBranding } from "@/lib/branding";
import { useIsIframe } from "@/lib/useIsIframe";

export default function SupportPage(): React.ReactNode {
  const branding = useBranding();
  const isIframe = useIsIframe();

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — SUPPORT`}</title>
        <meta
          name="description"
          content="Get support for hypothesis.sh and related domains."
        />
        <meta property="og:title" content="Support" />
        <meta
          property="og:description"
          content="Get support for hypothesis.sh and related domains."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://hypothesis.sh/support" />
      </Head>
      <div className={styles.inner}>
        <nav className={styles.nav}>
          <Link
            href="/"
            target={isIframe ? "_blank" : undefined}
            rel={isIframe ? "noopener noreferrer" : undefined}
            className={styles.backLink}
          >
            <span style={{ marginBottom: "3px" }}>←</span> {branding.name}
          </Link>
        </nav>
        <hr className={styles.divider} />

        <div className={styles.content}>
          <h1>Support</h1>

          <p>
            For help with any of the tools or apps on this site, email us at{" "}
            <a href="mailto:hello@k10y.com">hello@k10y.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
