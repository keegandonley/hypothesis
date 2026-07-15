import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "@/styles/httptest.module.css";
import {
  Badge,
  Button,
  CopyButton,
  PageLayout,
  Panel,
  PanelBody,
  PanelHeader,
  PermalinkRow,
} from "@/components/ui";
import {
  HTTPTEST_BASE,
  HTTPTEST_ENDPOINTS,
  HTTPTEST_GROUPS,
} from "@/lib/httptest";
import { useUrlSync } from "@/lib/useUrlSync";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

type Method = (typeof METHODS)[number];

const DEFAULT_PATH = "/get?foo=bar";
const DEFAULT_METHOD: Method = "GET";

/** Methods whose bodies the request builder offers to send. */
const BODY_METHODS: Method[] = ["POST", "PUT", "PATCH", "DELETE"];

interface ResponseState {
  status: number;
  statusText: string;
  durationMs: number;
  headers: [string, string][];
  body: string;
  /** Binary payloads are summarized rather than rendered as mojibake. */
  binaryBytes: number | null;
}

function isMethod(value: string): value is Method {
  return (METHODS as readonly string[]).includes(value);
}

function statusColor(status: number): "ready" | "warn" | "accent" {
  if (status < 300) return "ready";
  if (status < 400) return "accent";

  return "warn";
}

function prettifyBody(text: string, contentType: string): string {
  if (!contentType.includes("application/json")) return text;

  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    // Streamed NDJSON and error pages aren't single JSON documents — show raw.
    return text;
  }
}

export default function HttptestPage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const [path, setPath] = useState(DEFAULT_PATH);
  const [method, setMethod] = useState<Method>(DEFAULT_METHOD);
  const [requestBody, setRequestBody] = useState("");
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [origin, setOrigin] = useState("");
  const [url, setUrl] = useState("");

  const baseUrl = origin ? `${origin}${HTTPTEST_BASE}` : HTTPTEST_BASE;

  const grouped = useMemo(
    () =>
      HTTPTEST_GROUPS.map((group) => ({
        group,
        endpoints: HTTPTEST_ENDPOINTS.filter((e) => e.group === group),
      })),
    [],
  );

  const buildUrl = useCallback((nextPath: string, nextMethod: Method) => {
    const params = new URLSearchParams({ path: nextPath });

    if (nextMethod !== DEFAULT_METHOD) params.set("method", nextMethod);

    return `${window.location.origin}${window.location.pathname}?${params}`;
  }, []);

  // Restore state from the permalink on mount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const restoredPath = params.get("path") ?? DEFAULT_PATH;
    const rawMethod = params.get("method") ?? DEFAULT_METHOD;
    const restoredMethod = isMethod(rawMethod) ? rawMethod : DEFAULT_METHOD;

    /* eslint-disable react-hooks/set-state-in-effect */
    setOrigin(window.location.origin);
    setPath(restoredPath);
    setMethod(restoredMethod);
    setUrl(buildUrl(restoredPath, restoredMethod));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [buildUrl]);

  const syncUrl = (nextPath: string, nextMethod: Method): void => {
    if (!origin) return;
    const next = buildUrl(nextPath, nextMethod);

    setUrl(next);
    replaceUrl(next);
  };

  const handlePathChange = (next: string): void => {
    setPath(next);
    syncUrl(next, method);
  };

  const handleMethodChange = (next: Method): void => {
    setMethod(next);
    syncUrl(path, next);
  };

  const handleSelectEndpoint = (example: string, methods: string[]): void => {
    const next = isMethod(methods[0]) ? methods[0] : DEFAULT_METHOD;

    setPath(example);
    setMethod(next);
    setUrl(buildUrl(example, next));
    replaceUrlNow(buildUrl(example, next));
  };

  const handleReset = (): void => {
    setPath(DEFAULT_PATH);
    setMethod(DEFAULT_METHOD);
    setRequestBody("");
    setResponse(null);
    setError(null);
    setUrl(buildUrl(DEFAULT_PATH, DEFAULT_METHOD));
    replaceUrlNow(window.location.pathname);
  };

  const handleSend = async (): Promise<void> => {
    setPending(true);
    setError(null);

    const started = performance.now();

    try {
      const hasBody = BODY_METHODS.includes(method) && requestBody.length > 0;
      const res = await fetch(
        `${HTTPTEST_BASE}${path.startsWith("/") ? path : `/${path}`}`,
        {
          method,
          // Let the browser follow /redirect chains, as a real client would.
          redirect: "follow",
          headers: hasBody ? { "Content-Type": "application/json" } : undefined,
          body: hasBody ? requestBody : undefined,
        },
      );
      const durationMs = Math.round(performance.now() - started);
      const contentType = res.headers.get("content-type") ?? "";
      const isBinary = contentType.includes("application/octet-stream");
      // Only one of these consumes the body, so no clone is needed.
      const text = isBinary ? "" : await res.text();
      const binaryBytes = isBinary
        ? (await res.arrayBuffer()).byteLength
        : null;

      setResponse({
        status: res.status,
        statusText: res.statusText,
        durationMs,
        headers: [...res.headers.entries()],
        body: prettifyBody(text, contentType),
        binaryBytes,
      });
    } catch (e) {
      setResponse(null);
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="httptest"
        metaDescription="An httpbin-compatible HTTP request and response test service. Inspect headers, force status codes, test auth, redirects, cookies, and delays."
        path="/httptest"
        h1="httptest"
        tagline="An httpbin-compatible request & response service — with a live explorer."
      >
        <div className={styles.body}>
          <div className={styles.baseRow}>
            <div className={styles.baseDetails}>
              <span className={styles.label}>service endpoint</span>
              <code className={styles.baseUrl}>{baseUrl}</code>
            </div>
            <span className={styles.hint}>
              swap <code className={styles.code}>httpbin.org</code> for this
            </span>
            <CopyButton value={baseUrl} />
          </div>

          <div className={styles.columns}>
            <Panel className={styles.catalog}>
              <PanelHeader label="endpoints" />
              <PanelBody className={styles.catalogBody}>
                {grouped.map(({ group, endpoints }) => (
                  <div key={group} className={styles.group}>
                    <span className={styles.groupLabel}>{group}</span>
                    {endpoints.map((endpoint) => (
                      <button
                        key={endpoint.path}
                        type="button"
                        className={`${styles.endpoint}${
                          path === endpoint.example ? ` ${styles.selected}` : ""
                        }`}
                        onClick={() => {
                          handleSelectEndpoint(
                            endpoint.example,
                            endpoint.methods,
                          );
                        }}
                        title={endpoint.description}
                        aria-pressed={path === endpoint.example}
                      >
                        <span className={styles.endpointTopline}>
                          <span className={styles.endpointMethod}>
                            {endpoint.methods.join(" · ")}
                          </span>
                          <code className={styles.endpointPath}>
                            {endpoint.path}
                          </code>
                        </span>
                        <span className={styles.endpointDesc}>
                          {endpoint.description}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </PanelBody>
            </Panel>

            <div className={styles.runner}>
              <Panel className={styles.requestPanel}>
                <PanelHeader label="request">
                  <span className={styles.hint}>Enter to send</span>
                </PanelHeader>
                <PanelBody className={styles.requestBody}>
                  <div className={styles.requestRow}>
                    <select
                      className={styles.select}
                      value={method}
                      onChange={(e) => {
                        handleMethodChange(e.target.value as Method);
                      }}
                      aria-label="HTTP method"
                    >
                      {METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <div className={styles.urlField}>
                      <span className={styles.prefix}>{HTTPTEST_BASE}</span>
                      <input
                        className={styles.input}
                        value={path}
                        onChange={(e) => {
                          handlePathChange(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void handleSend();
                        }}
                        spellCheck={false}
                        aria-label="Request path"
                      />
                    </div>
                    <Button
                      variant="primary"
                      onClick={() => void handleSend()}
                      disabled={pending}
                      status={pending ? "pending" : "idle"}
                    >
                      Send
                    </Button>
                  </div>

                  {BODY_METHODS.includes(method) && (
                    <div className={styles.payload}>
                      <label
                        className={styles.payloadLabel}
                        htmlFor="request-body"
                      >
                        JSON body
                      </label>
                      <textarea
                        id="request-body"
                        className={styles.textarea}
                        value={requestBody}
                        onChange={(e) => {
                          setRequestBody(e.target.value);
                        }}
                        placeholder='{"hello":"world"}'
                        spellCheck={false}
                      />
                    </div>
                  )}
                </PanelBody>
              </Panel>

              {error && <div className={styles.error}>{error}</div>}

              <Panel className={styles.responsePanel}>
                <PanelHeader label="response">
                  {response && (
                    <>
                      <Badge color={statusColor(response.status)}>
                        {response.status} {response.statusText}
                      </Badge>
                      <span className={styles.hint}>
                        {response.durationMs} ms
                      </span>
                    </>
                  )}
                </PanelHeader>
                {response ? (
                  <PanelBody className={styles.responseBody}>
                    <div className={styles.responseSection}>
                      <span className={styles.sectionLabel}>headers</span>
                      <div className={styles.responseHeaders}>
                        {response.headers.map(([key, value]) => (
                          <div key={key} className={styles.headerLine}>
                            <span className={styles.headerKey}>{key}</span>
                            <span className={styles.headerValue}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className={styles.responseSection}>
                      <span className={styles.sectionLabel}>body</span>
                      <pre className={styles.pre}>
                        {response.binaryBytes !== null
                          ? `<${response.binaryBytes} bytes of binary data>`
                          : response.body || "<empty body>"}
                      </pre>
                    </div>
                  </PanelBody>
                ) : (
                  <div className={styles.emptyResponse}>
                    <span className={styles.emptyPrompt}>Ready to inspect</span>
                    <span>
                      Choose an endpoint or enter a path, then send a request.
                    </span>
                  </div>
                )}
              </Panel>
            </div>
          </div>
        </div>

        <hr className={styles.divider} />

        <PermalinkRow url={url} onReset={handleReset} />
      </PageLayout>
    </div>
  );
}
