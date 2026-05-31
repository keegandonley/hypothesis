import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/csp.module.css";
import {
  Badge,
  Button,
  CopyButton,
  PageLayout,
  PermalinkRow,
} from "@/components/ui";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { analyzeCsp, SEVERITY_ORDER, type Severity } from "@/lib/csp";
import type { CspFetchResult } from "../api/csp-fetch";

const SEVERITY_LABEL: Record<Severity, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
};

const VIA_LABEL: Record<string, string> = {
  explicit: "explicit",
  "default-src": "via default-src",
  unrestricted: "unrestricted",
};

const SAMPLE =
  "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline'; img-src *";

export default function CspPage(): React.ReactNode {
  const [policy, setPolicy] = useState("");
  const [permalink, setPermalink] = useState("");
  const [fetchUrl, setFetchUrl] = useState("");
  const [fetchStatus, setFetchStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");
  const [fetchError, setFetchError] = useState("");
  const [fetchInfo, setFetchInfo] = useState<CspFetchResult | null>(null);

  const buildUrl = (value: string): string => {
    if (!value) return `${window.location.origin}${window.location.pathname}`;

    return `${window.location.origin}${window.location.pathname}?policy=${encodeURIComponent(value)}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("policy");

    if (value) setPolicy(value); // eslint-disable-line react-hooks/set-state-in-effect
    setPermalink(window.location.href);
  }, []);

  const handlePolicyChange = (value: string): void => {
    setPolicy(value);
    const next = buildUrl(value);

    history.replaceState(null, "", next);
    setPermalink(next);
  };

  const handleReset = (): void => {
    setPolicy("");
    setFetchInfo(null);
    setFetchError("");
    setFetchStatus("idle");
    const next = `${window.location.origin}${window.location.pathname}`;

    history.replaceState(null, "", next);
    setPermalink(next);
  };

  const handleFetch = async (): Promise<void> => {
    const target = fetchUrl.trim();

    if (!target) return;
    setFetchStatus("loading");
    setFetchError("");
    setFetchInfo(null);

    try {
      const res = await fetch(`/api/csp-fetch?url=${encodeURIComponent(target)}`);
      const json = (await res.json()) as CspFetchResult | { error: string };

      if (!res.ok || "error" in json) {
        setFetchStatus("error");
        setFetchError("error" in json ? json.error : "Request failed");

        return;
      }

      setFetchStatus("idle");
      setFetchInfo(json);

      const found = json.csp ?? json.cspReportOnly;

      if (found) handlePolicyChange(found);
      else
        setFetchError(
          `No Content-Security-Policy header on ${json.finalUrl} (HTTP ${json.status}).`,
        );
    } catch {
      setFetchStatus("error");
      setFetchError("Could not reach the fetch service");
    }
  };

  const analysis = useMemo(() => analyzeCsp(policy), [policy]);

  const sortedFindings = useMemo(
    () =>
      [...analysis.findings].sort(
        (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
      ),
    [analysis.findings],
  );

  const counts = useMemo(() => {
    const c: Record<Severity, number> = { high: 0, medium: 0, low: 0, info: 0 };

    for (const f of analysis.findings) c[f.severity]++;

    return c;
  }, [analysis.findings]);

  const hasPolicy = analysis.directives.length > 0;

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="CSP Analyzer"
        metaDescription="Parse, visualize, and audit a Content-Security-Policy header. Spot unsafe-inline, wildcards, missing directives, and clickjacking gaps. Fetch a live policy from any URL."
        path="/csp"
        h1="CSP Analyzer"
        tagline="Parse, visualize, and audit a Content-Security-Policy"
        refs={[
          { name: "HTTP Headers", slug: "http-headers" },
          { name: "HTTP Status Codes", slug: "http-status-codes" },
        ]}
      >
        <Panel className={styles.inputPanel}>
          <PanelHeader label="Policy">
            {hasPolicy && (
              <Badge>{analysis.directives.length} directives</Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                handlePolicyChange(SAMPLE);
              }}
            >
              Sample
            </Button>
          </PanelHeader>
          <textarea
            className={styles.textarea}
            value={policy}
            onChange={(e) => {
              handlePolicyChange(e.target.value);
            }}
            placeholder="Paste a Content-Security-Policy header value here…"
            spellCheck={false}
            rows={3}
          />
          <div className={styles.fetchRow}>
            <input
              className={styles.fetchInput}
              type="url"
              value={fetchUrl}
              onChange={(e) => {
                setFetchUrl(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleFetch();
              }}
              placeholder="…or fetch from a URL (https://example.com)"
              spellCheck={false}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleFetch()}
              disabled={fetchStatus === "loading" || !fetchUrl.trim()}
            >
              {fetchStatus === "loading" ? "Fetching…" : "Fetch"}
            </Button>
          </div>
          {fetchError && <p className={styles.fetchError}>{fetchError}</p>}
          {fetchInfo && (fetchInfo.csp ?? fetchInfo.cspReportOnly) && (
            <p className={styles.fetchMeta}>
              Loaded{" "}
              {fetchInfo.csp && fetchInfo.cspReportOnly
                ? "CSP + CSP (report-only)"
                : fetchInfo.csp
                  ? "CSP"
                  : "CSP (report-only)"}{" "}
              from {fetchInfo.finalUrl} · HTTP {fetchInfo.status}
            </p>
          )}
        </Panel>

        {hasPolicy && (
          <div className={styles.results}>
            <Panel className={styles.findingsPanel}>
              <PanelHeader label="Audit">
                {counts.high > 0 && (
                  <span className={`${styles.count} ${styles.high}`}>
                    {counts.high} high
                  </span>
                )}
                {counts.medium > 0 && (
                  <span className={`${styles.count} ${styles.medium}`}>
                    {counts.medium} medium
                  </span>
                )}
                {counts.low > 0 && (
                  <span className={`${styles.count} ${styles.low}`}>
                    {counts.low} low
                  </span>
                )}
              </PanelHeader>
              <ul className={styles.findings}>
                {sortedFindings.map((f, i) => (
                  <li key={i} className={styles.finding}>
                    <span
                      className={`${styles.sev} ${styles[f.severity]}`}
                      title={SEVERITY_LABEL[f.severity]}
                    >
                      {SEVERITY_LABEL[f.severity]}
                    </span>
                    <div className={styles.findingBody}>
                      <div className={styles.findingTitle}>
                        {f.title}
                        {f.directive && (
                          <code className={styles.findingDirective}>
                            {f.directive}
                          </code>
                        )}
                      </div>
                      <div className={styles.findingDetail}>{f.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel className={styles.effectivePanel}>
              <PanelHeader label="Effective policy" />
              <div className={styles.effectiveTable}>
                {analysis.effective.map((e) => (
                  <div key={e.directive} className={styles.effectiveRow}>
                    <code className={styles.effectiveName}>{e.directive}</code>
                    <div className={styles.effectiveSources}>
                      {e.via === "unrestricted" ? (
                        <span className={styles.unrestricted}>
                          unrestricted
                        </span>
                      ) : (
                        e.sources.map((s, i) => (
                          <code key={i} className={styles.source}>
                            {s}
                          </code>
                        ))
                      )}
                    </div>
                    <span
                      className={`${styles.via} ${e.via === "default-src" ? styles.viaFallback : ""}`}
                    >
                      {VIA_LABEL[e.via]}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className={styles.directivesPanel}>
              <PanelHeader label="Directives">
                <CopyButton value={policy} variant="ghost" size="sm" />
              </PanelHeader>
              <div className={styles.directiveTable}>
                {analysis.directives.map((d, i) => (
                  <div
                    key={i}
                    className={`${styles.directiveRow}${d.duplicate ? ` ${styles.directiveDup}` : ""}`}
                  >
                    <code className={styles.directiveName}>{d.name}</code>
                    <div className={styles.directiveSources}>
                      {d.sources.length === 0 ? (
                        <span className={styles.empty}>(no sources)</span>
                      ) : (
                        d.sources.map((s, j) => (
                          <code key={j} className={styles.source}>
                            {s}
                          </code>
                        ))
                      )}
                    </div>
                    {d.duplicate && <Badge color="error">duplicate</Badge>}
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}
      </PageLayout>

      <hr className={styles.divider} />

      <PermalinkRow url={permalink} onReset={handleReset} />
    </div>
  );
}
