import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import styles from "../../styles/work.module.css";
import { useBranding } from "@/lib/branding";
import {
  tools,
  experiments,
  references,
  TAG_COLORS,
  type AnyItem,
  type Tag,
} from "@/lib/tools";

type Segment = { text: string; highlight: boolean };

function highlight(text: string, query: string): Segment[] {
  if (!query.trim()) return [{ text, highlight: false }];
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return [{ text, highlight: false }];
  return [
    { text: text.slice(0, idx), highlight: false },
    { text: text.slice(idx, idx + query.length), highlight: true },
    { text: text.slice(idx + query.length), highlight: false },
  ].filter((s) => s.text.length > 0);
}

function Highlighted({ text, query }: { text: string; query: string }) {
  const segments = highlight(text, query);
  return (
    <>
      {segments.map((seg, i) =>
        seg.highlight ? (
          <mark key={i} className={styles.highlight}>
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

function filterItems(query: string) {
  if (!query.trim()) {
    return { tools, experiments, references };
  }
  const q = query.toLowerCase();
  const matchItem = (item: AnyItem) =>
    item.name.toLowerCase().includes(q) ||
    item.description.toLowerCase().includes(q) ||
    ("tags" in item
      ? (item.tags as Tag[]).some((t) => t.toLowerCase().includes(q))
      : false);
  return {
    tools: tools.filter(matchItem),
    experiments: experiments.filter(matchItem),
    references: references.filter(matchItem),
  };
}

function ResultRows({
  query,
  selectedIndex,
  itemRefs,
  onSelect,
  onHover,
}: {
  query: string;
  selectedIndex: number;
  itemRefs: React.MutableRefObject<(HTMLAnchorElement | null)[]>;
  onSelect: (item: AnyItem, idx: number) => void;
  onHover: (idx: number) => void;
}) {
  const matched = filterItems(query);
  const groups: { label: string; items: AnyItem[] }[] = [
    { label: "Tools", items: matched.tools },
    { label: "Experiments", items: matched.experiments },
    { label: "References", items: matched.references },
  ].filter((g) => g.items.length > 0);

  const flatItems = groups.flatMap((g) => g.items);

  if (flatItems.length === 0) {
    return <div className={styles.emptyState}>no results for &ldquo;{query}&rdquo;</div>;
  }

  let flatIndex = 0;

  return (
    <>
      {groups.map((group) => (
        <div key={group.label}>
          <div className={styles.groupLabel}>{group.label}</div>
          {group.items.map((item) => {
            const idx = flatIndex++;
            const isSelected = idx === selectedIndex;
            return (
              <a
                key={item.href}
                href={item.href}
                ref={(el) => {
                  itemRefs.current[idx] = el;
                }}
                className={
                  isSelected
                    ? `${styles.resultRow} ${styles.resultRowSelected}`
                    : styles.resultRow
                }
                onMouseEnter={() => onHover(idx)}
                onClick={(e) => {
                  e.preventDefault();
                  onSelect(item, idx);
                }}
              >
                <div className={styles.resultMain}>
                  <div className={styles.resultName}>
                    <Highlighted text={item.name} query={query} />
                  </div>
                  <div className={styles.resultDesc}>
                    <Highlighted text={item.description} query={query} />
                  </div>
                  {"tags" in item && item.tags.length > 0 && (
                    <div className={styles.resultTags}>
                      {(item.tags as Tag[]).map((tag) => (
                        <span
                          key={tag}
                          className={styles.resultTag}
                          style={
                            {
                              "--tag-color": TAG_COLORS[tag].color,
                              "--tag-subtle": TAG_COLORS[tag].subtle,
                            } as React.CSSProperties
                          }
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {"id" in item && (
                  <span className={styles.kindBadge}>{item.id}</span>
                )}
              </a>
            );
          })}
        </div>
      ))}
      <div className={styles.hint}>
        <span>
          <kbd>↑↓</kbd> navigate
        </span>
        <span>
          <kbd>↵</kbd> open
        </span>
        <span>
          <kbd>⌘K</kbd> search
        </span>
        <span>
          <kbd>esc</kbd> {flatItems.length > 0 ? "clear" : "back"}
        </span>
      </div>
    </>
  );
}

export default function DashboardPage() {
  const branding = useBranding();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeItem, setActiveItem] = useState<AnyItem | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Restore query from URL on mount and focus input
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") ?? "";
    setQuery(q);
    inputRef.current?.focus();
  }, []);

  // Handle clipboard-write messages from embedded tools
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "clipboard-write" && typeof e.data.text === "string") {
        navigator.clipboard.writeText(e.data.text).catch(() => {});
      }
      if (e.data?.type === "focus-search") {
        inputRef.current?.focus();
        if (activeItem) setResultsOpen(true);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [activeItem]);

  // Cmd+K / Ctrl+K focuses the search input
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
        if (activeItem) setResultsOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeItem]);

  // Sync query to URL
  useEffect(() => {
    const newUrl = query
      ? `${window.location.origin}/work?q=${encodeURIComponent(query)}`
      : `${window.location.origin}/work`;
    history.replaceState(null, "", newUrl);
  }, [query]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const matched = filterItems(query);
  const flatItems = [
    ...matched.tools,
    ...matched.experiments,
    ...matched.references,
  ];
  const totalCount = flatItems.length;

  function selectItem(item: AnyItem) {
    setActiveItem(item);
    setResultsOpen(false);
    setQuery("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, totalCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[selectedIndex];
      if (item) selectItem(item);
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (activeItem && resultsOpen) {
        setResultsOpen(false);
        setQuery("");
      } else if (activeItem) {
        setActiveItem(null);
      } else {
        setQuery("");
      }
    }
  }

  const head = (
    <Head>
      <title>work — {branding.domain}</title>
    </Head>
  );

  // ── View mode ────────────────────────────────────────────
  if (activeItem !== null) {
    return (
      <div className={styles.pageView}>
        {head}
        <div className={styles.topBar}>
          <div className={styles.searchContainer}>
            <input
              ref={inputRef}
              className={styles.searchInputCompact}
              type="text"
              placeholder="search..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onFocus={() => setResultsOpen(true)}
              onBlur={() => setResultsOpen(false)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                className={styles.clearBtn}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
            {resultsOpen && (
              <div
                className={styles.resultsDropdown}
                onPointerDown={(e) => e.preventDefault()}
              >
                <ResultRows
                  query={query}
                  selectedIndex={selectedIndex}
                  itemRefs={itemRefs}
                  onSelect={(item) => {
                    selectItem(item);
                    inputRef.current?.focus();
                  }}
                  onHover={setSelectedIndex}
                />
              </div>
            )}
          </div>
          <button
            className={styles.closeBtn}
            onClick={() => setActiveItem(null)}
          >
            esc
          </button>
        </div>
        <iframe
          className={styles.toolFrame}
          src={`${activeItem.href}?workMode=1`}
          title={activeItem.name}
          name="work-embed"
        />
      </div>
    );
  }

  // ── Search mode ──────────────────────────────────────────
  return (
    <div className={styles.page}>
      {head}
      <div className={styles.inner}>
        <div className={styles.searchWrap}>
          <input
            ref={inputRef}
            className={styles.searchInput}
            type="text"
            placeholder="search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              className={styles.clearBtn}
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className={styles.results}>
          <ResultRows
            query={query}
            selectedIndex={selectedIndex}
            itemRefs={itemRefs}
            onSelect={selectItem}
            onHover={setSelectedIndex}
          />
        </div>
      </div>
    </div>
  );
}
