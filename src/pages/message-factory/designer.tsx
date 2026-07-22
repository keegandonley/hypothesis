import { useEffect, useState } from "react";
import styles from "@/styles/message-factory-designer.module.css";
import { useIsIframe } from "@/lib/useIsIframe";
import {
  Badge,
  Button,
  PageLayout,
  PermalinkRow,
  CopyButton,
} from "@/components/ui";
import { useUrlSync } from "@/lib/useUrlSync";

interface Action {
  id: string;
  name: string;
  payload: string; // raw JSON string (may be invalid)
}

function encodeActions(actions: Action[]): string {
  const clean = actions.map((a) => ({
    id: a.id,
    name: a.name,
    payload: (() => {
      try {
        return JSON.parse(a.payload) as Record<string, unknown>;
      } catch {
        return {};
      }
    })(),
  }));

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  return btoa(unescape(encodeURIComponent(JSON.stringify(clean))));
}

function decodeActions(raw: string): Action[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const parsed = JSON.parse(decodeURIComponent(escape(atob(raw)))) as Record<
      string,
      unknown
    >[];

    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => ({
      id: typeof item.id === "string" ? item.id : "",
      name: typeof item.name === "string" ? item.name : "",
      payload: JSON.stringify(
        item.payload !== undefined ? item.payload : {},
        null,
        2,
      ),
    }));
  } catch {
    return [];
  }
}

function buildBaseUrl(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

function buildUrl(actions: Action[]): string {
  const hasContent = actions.some((a) => a.id || a.name || a.payload !== "{}");

  if (!hasContent && actions.length === 0) return buildBaseUrl();

  return `${buildBaseUrl()}?actions=${encodeActions(actions)}`;
}

function buildViewerUrl(actions: Action[]): string {
  const b64 = encodeActions(actions);

  return `${window.location.origin}/message-factory/viewer?actions=${b64}`;
}

function isValidJson(s: string): boolean {
  try {
    JSON.parse(s);

    return true;
  } catch {
    return false;
  }
}

// Beyond this, the permalink stops being reliably shareable (browser/proxy
// URL limits), so PermalinkRow disables copying via its tooLong prop.
const MAX_SHAREABLE_URL_LENGTH = 2000;

let actionIdCounter = 0;

function newAction(): Action & { _key: string } {
  actionIdCounter += 1;

  return { _key: String(actionIdCounter), id: "", name: "", payload: "{}" };
}

export default function DesignerPage(): React.ReactNode {
  const isIframe = useIsIframe();
  const [actions, setActions] = useState<(Action & { _key: string })[]>([]);
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const [url, setUrl] = useState("");
  const [viewerUrl, setViewerUrl] = useState("");


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("actions");

    if (raw) {
      const decoded = decodeActions(raw);

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActions(
        decoded.map((a) => {
          actionIdCounter += 1;

          return { ...a, _key: String(actionIdCounter) };
        }),
      );
      setViewerUrl(buildViewerUrl(decoded));
    } else {
      setViewerUrl(`${window.location.origin}/message-factory/viewer`);
    }

    setUrl(window.location.href);
  }, []);

  const syncUrl = (next: (Action & { _key: string })[]): void => {
    const newUrl = buildUrl(next);

    replaceUrl(newUrl);
    setUrl(newUrl);
    setViewerUrl(buildViewerUrl(next));
  };

  const handleChange = (
    key: string,
    field: keyof Action,
    value: string,
  ): void => {
    const next = actions.map((a) =>
      a._key === key ? { ...a, [field]: value } : a,
    );

    setActions(next);
    syncUrl(next);
  };

  const handleAdd = (): void => {
    const next = [...actions, newAction()];

    setActions(next);
    syncUrl(next);
  };

  const handleRemove = (key: string): void => {
    const next = actions.filter((a) => a._key !== key);

    setActions(next);
    syncUrl(next);
  };

  const handleReset = (): void => {
    setActions([]);
    const newUrl = buildBaseUrl();

    replaceUrlNow(newUrl);
    setUrl(newUrl);
    setViewerUrl(`${window.location.origin}/message-factory/viewer`);
  };

  return (
    <div className={styles.page}>
      {/* path is the parent tool: docs only exist at /docs/message-factory
          (no nested docs route), and PageLayout derives its docs link from
          path. Matches the docs link this page had before PageLayout. */}
      <PageLayout
        metaTitle="Message Designer"
        metaDescription="Build arrays of postMessage actions with shareable permalinks for testing message-driven pages."
        path="/message-factory/designer"
        docsPath="/message-factory"
        tagline="Build arrays of postMessage actions with shareable permalinks."
      >

      {/* Actions list */}
      <div className={styles.actionsList}>
        {actions.length === 0 && (
          <div className={styles.emptyState}>
            No actions yet. Click &ldquo;Add Action&rdquo; to get started.
          </div>
        )}
        {actions.map((action, idx) => (
          <div key={action._key} className={styles.actionCard}>
            <div className={styles.actionCardHeader}>
              <span className={styles.actionIndex}>action {idx + 1}</span>
              <Button
                variant="reset"
                size="xs"
                onClick={() => {
                  handleRemove(action._key);
                }}
              >
                Remove
              </Button>
            </div>
            <div className={styles.actionFields}>
              <div className={styles.fieldRow}>
                <label
                  className={styles.fieldLabel}
                  htmlFor={`action-name-${action._key}`}
                >
                  name
                </label>
                <input
                  id={`action-name-${action._key}`}
                  type="text"
                  className={styles.fieldInput}
                  value={action.name}
                  onChange={(e) => {
                    handleChange(action._key, "name", e.target.value);
                  }}
                  placeholder="Button label"
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              <div className={styles.fieldRow}>
                <label
                  className={styles.fieldLabel}
                  htmlFor={`action-id-${action._key}`}
                >
                  id
                </label>
                <input
                  id={`action-id-${action._key}`}
                  type="text"
                  className={styles.fieldInput}
                  value={action.id}
                  onChange={(e) => {
                    handleChange(action._key, "id", e.target.value);
                  }}
                  placeholder="action-id"
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              <div className={styles.fieldRow}>
                <label
                  className={styles.fieldLabel}
                  htmlFor={`action-payload-${action._key}`}
                >
                  payload
                  {!isValidJson(action.payload) && (
                    <Badge color="warn">invalid json</Badge>
                  )}
                </label>
                <textarea
                  id={`action-payload-${action._key}`}
                  className={styles.payloadTextarea}
                  value={action.payload}
                  onChange={(e) => {
                    handleChange(action._key, "payload", e.target.value);
                  }}
                  placeholder="{}"
                  spellCheck={false}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button variant="copy" onClick={handleAdd}>
        + Add Action
      </Button>

      <hr className={styles.divider} />

      <PermalinkRow
        url={url}
        onReset={handleReset}
        tooLong={url.length > MAX_SHAREABLE_URL_LENGTH}
      />

      {/* Open Viewer row */}
      <div className={styles.viewerRow}>
        {!isIframe && (
          <CopyButton value={viewerUrl} />
        )}
        <div className={styles.viewerLinks}>
          <a
            href={viewerUrl}
            className={styles.viewerLink}
            target="_blank"
            rel="noreferrer"
          >
            Open Viewer →
          </a>
          <a
            href={`${viewerUrl}${viewerUrl.includes("?") ? "&" : "?"}debug=true`}
            className={styles.viewerLink}
            target="_blank"
            rel="noreferrer"
          >
            Open Viewer (debug) →
          </a>
        </div>
      </div>
      </PageLayout>
    </div>
  );
}
