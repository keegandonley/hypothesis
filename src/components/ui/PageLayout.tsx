import React from "react";
import Link from "next/link";
import { ToolHead } from "@/components/ToolHead";
import { DocIcon } from "@/components/icons/doc";
import { ReferenceLinks } from "@/components/ReferenceLinks";
import { useBranding } from "@/lib/branding";
import { useIsIframe } from "@/lib/useIsIframe";
import { useWorkMode } from "@/lib/useWorkMode";
import styles from "./PageLayout.module.css";

interface Ref {
  name: string;
  slug: string;
}

interface PageLayoutProps {
  metaTitle: string;
  metaDescription: string;
  path: string;
  h1?: string;
  tagline: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
  refs?: Ref[];
}

export function PageLayout({
  metaTitle,
  metaDescription,
  path,
  h1,
  tagline,
  children,
  badge,
  refs,
}: PageLayoutProps): React.ReactNode {
  const branding = useBranding();
  const isIframe = useIsIframe();
  const workMode = useWorkMode();

  return (
    <>
      <ToolHead
        title={metaTitle}
        description={metaDescription}
        path={path}
        brandName={branding.name}
      />
      <div className={styles.header}>
        <div className={styles.eyebrow} data-eyebrow>
          <Link
            href="/"
            target={isIframe ? "_blank" : undefined}
            rel={isIframe ? "noopener noreferrer" : undefined}
            className={styles.domainLink}
          >
            {branding.domain}
          </Link>
          {"·"}
          <Link
            href={`/docs${path}`}
            className={styles.docsLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DocIcon className={styles.icon} /> docs
          </Link>
          {badge}
        </div>
        <h1 className={styles.title}>{h1 ?? metaTitle}</h1>
        <p className={styles.tagline}>{tagline}</p>
        {refs && !workMode && <ReferenceLinks refs={refs} />}
      </div>
      <hr className={styles.divider} />
      {children}
    </>
  );
}
