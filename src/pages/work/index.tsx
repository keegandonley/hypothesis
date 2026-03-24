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

type Tab = {
  id: string;
  item: AnyItem;
  initialSrc: string;  // iframe src — set once at creation/restore, never updated
  currentUrl: string;  // live URL from url-update messages, used only for persistence
};

type StoredTabs = {
  tabs: { id: string; href: string; url: string }[];
  activeTabId: string | null;
};

function saveToStorage(tabs: Tab[], activeTabId: string | null) {
  if (tabs.length === 0) {
    localStorage.removeItem("work_tabs");
    return;
  }
  const data: StoredTabs = {
    tabs: tabs.map((t) => ({ id: t.id, href: t.item.href, url: t.currentUrl })),
    activeTabId,
  };
  localStorage.setItem("work_tabs", JSON.stringify(data));
}

export default function DashboardPage() {
  const branding = useBranding();

  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Keep a ref to activeTabId for use inside closures (handleMessage)
  const activeTabIdRef = useRef<string | null>(null);
  activeTabIdRef.current = activeTabId;

  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Restore from localStorage on mount; otherwise focus search
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") ?? "";
    setQuery(q);

    const saved = localStorage.getItem("work_tabs");
    if (saved) {
      try {
        const { tabs: savedTabs, activeTabId: savedActiveId } = JSON.parse(saved) as StoredTabs;
        const allItems = [...tools, ...experiments, ...references];
        const restoredTabs: Tab[] = savedTabs.flatMap(({ id, href, url }) => {
          const item = allItems.find((i) => i.href === href);
          if (!item) return [];
          const u = new URL(url, window.location.origin);
          u.searchParams.set("workMode", "1");
          u.searchParams.set("tabId", id);
          const src = u.pathname + u.search;
          return [{ id, item, initialSrc: src, currentUrl: src }];
        });
        if (restoredTabs.length > 0) {
          setTabs(restoredTabs);
          setActiveTabId(savedActiveId ?? restoredTabs[0].id);
          setMounted(true);
          return;
        }
      } catch {}
    }

    setMounted(true);
    inputRef.current?.focus();
  }, []);

  // Handle postMessages from embedded tools
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "clipboard-write" && typeof e.data.text === "string") {
        navigator.clipboard.writeText(e.data.text).catch(() => {});
      }
      if (e.data?.type === "focus-search") {
        inputRef.current?.focus();
        if (activeTabIdRef.current) setResultsOpen(true);
      }
      if (e.data?.type === "url-update" && typeof e.data.url === "string" && e.data.tabId) {
        const { url, tabId } = e.data as { url: string; tabId: string };
        setTabs((prev) => {
          const next = prev.map((t) => (t.id === tabId ? { ...t, currentUrl: url } : t));
          saveToStorage(next, activeTabIdRef.current);
          return next;
        });
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Cmd+K / Ctrl+K focuses the search input
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
        if (activeTabIdRef.current) setResultsOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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

  function openTab(item: AnyItem) {
    const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const url = `${item.href}?workMode=1&tabId=${id}`;
    const newTab: Tab = { id, item, initialSrc: url, currentUrl: url };
    const newTabs = [...tabs, newTab];
    setTabs(newTabs);
    setActiveTabId(id);
    saveToStorage(newTabs, id);
    setResultsOpen(false);
    setQuery("");
  }

  function closeTab(id: string) {
    const idx = tabs.findIndex((t) => t.id === id);
    const newTabs = tabs.filter((t) => t.id !== id);
    let newActiveId: string | null = null;
    if (newTabs.length > 0) {
      newActiveId = newTabs[Math.min(idx, newTabs.length - 1)].id;
    }
    setTabs(newTabs);
    setActiveTabId(newActiveId);
    saveToStorage(newTabs, newActiveId);
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
      if (item) openTab(item);
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (activeTabId && resultsOpen) {
        setResultsOpen(false);
        setQuery("");
      } else if (activeTabId) {
        closeTab(activeTabId);
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

  // ── View mode (tabs open) ─────────────────────────────────
  if (tabs.length > 0) {
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
                    openTab(item);
                    inputRef.current?.focus();
                  }}
                  onHover={setSelectedIndex}
                />
              </div>
            )}
          </div>
          <button
            className={styles.closeBtn}
            onClick={() => activeTabId && closeTab(activeTabId)}
          >
            esc
          </button>
        </div>
        <div className={styles.tabBar}>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={
                tab.id === activeTabId
                  ? `${styles.tab} ${styles.tabActive}`
                  : styles.tab
              }
              onClick={() => {
                setActiveTabId(tab.id);
                saveToStorage(tabs, tab.id);
              }}
            >
              <span>{tab.item.name}</span>
              <button
                className={styles.tabCloseBtn}
                onPointerDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                aria-label={`Close ${tab.item.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {tabs.map((tab) => (
          <iframe
            key={tab.id}
            className={styles.toolFrame}
            src={tab.initialSrc}
            title={tab.item.name}
            name="work-embed"
            style={{ display: tab.id === activeTabId ? "block" : "none" }}
          />
        ))}
      </div>
    );
  }

  // ── Search mode ──────────────────────────────────────────
  if (!mounted) return null;

  return (
    <div className={styles.page}>
      {head}
      <div className={styles.innerAnimated}>
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
            onSelect={openTab}
            onHover={setSelectedIndex}
          />
        </div>
      </div>
    </div>
  );
}
