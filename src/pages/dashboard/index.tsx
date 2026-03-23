import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import styles from "../../styles/dashboard.module.css";
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

export default function DashboardPage() {
  const branding = useBranding();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Restore query from URL on mount and focus input
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") ?? "";
    setQuery(q);
    inputRef.current?.focus();
  }, []);

  // Sync query to URL
  useEffect(() => {
    const newUrl = query
      ? `${window.location.origin}/dashboard?q=${encodeURIComponent(query)}`
      : `${window.location.origin}/dashboard`;
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
  const groups: { label: string; items: AnyItem[] }[] = [
    { label: "Tools", items: matched.tools },
    { label: "Experiments", items: matched.experiments },
    { label: "References", items: matched.references },
  ].filter((g) => g.items.length > 0);

  const flatItems = groups.flatMap((g) => g.items);
  const totalCount = flatItems.length;

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
      if (item) router.push(item.href);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
    }
  }

  let flatIndex = 0;

  return (
    <div className={styles.page}>
      <Head>
        <title>dashboard — {branding.domain}</title>
      </Head>
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

        {totalCount > 0 ? (
          <div className={styles.results}>
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
                      onMouseEnter={() => setSelectedIndex(idx)}
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
                <kbd>esc</kbd> clear
              </span>
            </div>
          </div>
        ) : (
          <div className={`${styles.results}`}>
            <div className={styles.emptyState}>no results for "{query}"</div>
          </div>
        )}
      </div>
    </div>
  );
}
