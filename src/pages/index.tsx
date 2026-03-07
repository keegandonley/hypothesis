import Link from "next/link";

const FONT =
  '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace';

const ACCENT = "#7ee8a2";
const BG = "#0c0c10";
const CARD_BG = "#13131a";
const BORDER = "#1e1e2e";
const TEXT = "#f0ede8";
const MUTED = "#5a5a6e";

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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: BG,
        backgroundImage: `radial-gradient(circle, ${BORDER} 1px, transparent 1px)`,
        backgroundSize: "28px 28px",
        fontFamily: FONT,
        color: TEXT,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "560px" }}>
        {/* Header */}
        <header style={{ marginBottom: "48px" }}>
          <div
            style={{
              fontSize: "11px",
              letterSpacing: "0.2em",
              color: ACCENT,
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            lab / v0.1.0
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(32px, 6vw, 48px)",
              fontWeight: "700",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: TEXT,
              lineHeight: 1,
              display: "flex",
              alignItems: "baseline",
              gap: "4px",
            }}
          >
            hypothesis
            <span
              style={{
                display: "inline-block",
                width: "3px",
                height: "0.85em",
                backgroundColor: ACCENT,
                marginLeft: "2px",
                animation: "blink 1.2s step-end infinite",
                verticalAlign: "baseline",
                borderRadius: "1px",
              }}
            />
          </h1>
          <p
            style={{
              margin: "16px 0 0",
              fontSize: "13px",
              color: MUTED,
              lineHeight: "1.6",
              letterSpacing: "0.02em",
            }}
          >
            A workbench for web experiments.
          </p>
        </header>

        {/* Divider */}
        <div
          style={{
            borderTop: `1px solid ${BORDER}`,
            marginBottom: "32px",
          }}
        />

        {/* Experiment list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {experiments.map((exp) => (
            <ExperimentCard key={exp.id} {...exp} />
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "64px",
            fontSize: "11px",
            color: MUTED,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          tools for thinking | A project by{" "}
          <a
            href="https://keegan.codes"
            style={{ color: MUTED, transition: "color 0.15s ease" }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color = ACCENT)
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.color = MUTED)
            }
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
      <div
        style={{
          backgroundColor: CARD_BG,
          border: `1px solid ${BORDER}`,
          borderRadius: "8px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          transition: "border-color 0.15s ease, background-color 0.15s ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = ACCENT + "55";
          (e.currentTarget as HTMLDivElement).style.backgroundColor = "#16161f";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = BORDER;
          (e.currentTarget as HTMLDivElement).style.backgroundColor = CARD_BG;
        }}
      >
        {/* ID badge */}
        <div
          style={{
            fontSize: "10px",
            fontWeight: "700",
            letterSpacing: "0.12em",
            color: ACCENT,
            backgroundColor: ACCENT + "18",
            border: `1px solid ${ACCENT}33`,
            borderRadius: "4px",
            padding: "4px 8px",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          {id}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: TEXT,
              marginBottom: "4px",
              letterSpacing: "0.02em",
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: MUTED,
              lineHeight: "1.5",
              letterSpacing: "0.01em",
            }}
          >
            {description}
          </div>
        </div>

        {/* Arrow */}
        <div
          style={{
            fontSize: "18px",
            color: MUTED,
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          →
        </div>
      </div>
    </Link>
  );
}
