import { PageLayout } from "@/components/ui";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "@/styles/message-factory.module.css";
import { DocIcon } from "@/components/icons/doc";
import { Badge } from "@/components/ui";

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

export default function MessageFactoryPage(): React.ReactNode {


  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Message Factory"
        metaDescription="Build and send custom postMessage payloads between iframes for testing cross-origin communication."
        path="/message-factory"
        tagline="Design and trigger postMessage actions with an interactive viewer and designer."
      >
      <div className={styles.inner}>

        <div className={styles.section}>
          <div className={styles.sectionLabel}>Sub-experiments</div>
          <div className={styles.cards}>
            {subExperiments.map((exp) => (
              <SubExperimentCard key={exp.id} {...exp} />
            ))}
          </div>
        </div>
      </div>
      </PageLayout>
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
}): React.ReactNode {
  const router = useRouter();

  return (
    <div className={styles.card} onClick={() => router.push(href)}>
      <div className={styles.cardMain}>
        <Badge>{id}</Badge>
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
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <DocIcon />
          docs
        </Link>
      </div>
    </div>
  );
}
