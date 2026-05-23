import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/datetime.module.css";
import { Badge, Button, CopyButton, PageLayout, PermalinkRow } from "@/components/ui";
import { copyToClipboard } from "@/lib/copyToClipboard";
import { useIsIframe } from "@/lib/useIsIframe";

interface FormatRow {
  id: string;
  label: string;
  format: (d: Date) => string;
}

function pad(n: number, digits = 2): string {
  return String(n).padStart(digits, "0");
}

function formatRelative(d: Date): string {
  const diffMs = d.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const future = diffMs > 0;

  const seconds = Math.floor(abs / 1000);
  const minutes = Math.floor(abs / 60000);
  const hours = Math.floor(abs / 3600000);
  const days = Math.floor(abs / 86400000);
  const months = Math.floor(days / 30.4375);
  const years = Math.floor(days / 365.25);

  let unit: string;
  let count: number;

  if (years >= 1) {
    count = years;
    unit = years === 1 ? "year" : "years";
  } else if (months >= 1) {
    count = months;
    unit = months === 1 ? "month" : "months";
  } else if (days >= 1) {
    count = days;
    unit = days === 1 ? "day" : "days";
  } else if (hours >= 1) {
    count = hours;
    unit = hours === 1 ? "hour" : "hours";
  } else if (minutes >= 1) {
    count = minutes;
    unit = minutes === 1 ? "minute" : "minutes";
  } else {
    count = seconds;
    unit = seconds === 1 ? "second" : "seconds";
  }

  return future ? `in ${count} ${unit}` : `${count} ${unit} ago`;
}

function formatRfc2822(d: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return `${days[d.getUTCDay()]}, ${pad(d.getUTCDate())} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +0000`;
}

const FORMAT_ROWS: FormatRow[] = [
  {
    id: "unix_s",
    label: "Unix (sec)",
    format: (d) => String(Math.floor(d.getTime() / 1000)),
  },
  { id: "unix_ms", label: "Unix (ms)", format: (d) => String(d.getTime()) },
  { id: "iso", label: "ISO 8601", format: (d) => d.toISOString() },
  { id: "utc", label: "UTC String", format: (d) => d.toUTCString() },
  { id: "rfc2822", label: "RFC 2822", format: (d) => formatRfc2822(d) },
  { id: "local", label: "Local", format: (d) => d.toLocaleString() },
  {
    id: "date_only",
    label: "Date",
    format: (d) =>
      `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
  },
  {
    id: "time_utc",
    label: "Time (UTC)",
    format: (d) =>
      `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`,
  },
  {
    id: "day_of_week",
    label: "Day of Week",
    format: (d) =>
      d.toLocaleDateString(undefined, { weekday: "long", timeZone: "UTC" }),
  },
  {
    id: "month_year",
    label: "Month / Year",
    format: (d) =>
      d.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
  },
  { id: "relative", label: "Relative", format: (d) => formatRelative(d) },
  { id: "http", label: "HTTP Date", format: (d) => d.toUTCString() },
];

function parseInput(value: string): Date | null {
  if (!value.trim()) return null;

  // Pure integer: try unix ms or unix seconds
  if (/^\d+$/.test(value.trim())) {
    const n = parseInt(value.trim(), 10);

    if (value.trim().length >= 13) {
      const d = new Date(n);

      if (!isNaN(d.getTime())) return d;
    } else {
      const d = new Date(n * 1000);

      if (!isNaN(d.getTime())) return d;
    }
  }

  // General string parse
  const d = new Date(value);

  if (!isNaN(d.getTime())) return d;

  return null;
}

export default function DateTimePage(): React.ReactNode {
  const isIframe = useIsIframe();
  const [input, setInput] = useState("");
  const [parsedDate, setParsedDate] = useState<Date | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const [liveDate, setLiveDate] = useState<Date | null>(null);
  const [relativeLive, setRelativeLive] = useState(true);
  const [, setRelativeTick] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const relativeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const buildUrl = (val: string, live: boolean): string => {
    const params = new URLSearchParams();

    if (val) params.set("value", val);
    if (live) params.set("live", "true");
    const qs = params.toString();

    return `${window.location.origin}${window.location.pathname}${qs ? `?${qs}` : ""}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("value");

    if (value) {
      setInput(value); // eslint-disable-line react-hooks/set-state-in-effect
      setParsedDate(parseInput(value));
    }

    const live = params.get("live") === "true";

    if (live) setLiveMode(true);
    setUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (liveMode) {
      setLiveDate(new Date()); // eslint-disable-line react-hooks/set-state-in-effect
      liveIntervalRef.current = setInterval(() => {
        setLiveDate(new Date());
      }, 200);
    } else {
      if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }

      setLiveDate(null);
    }

    return () => {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    };
  }, [liveMode]);

  const handleInputChange = (value: string): void => {
    setInput(value);
    setParsedDate(parseInput(value));
    const newUrl = buildUrl(value, liveMode);

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleNow = (): void => {
    const now = String(Date.now());

    setInput(now);
    setParsedDate(new Date(parseInt(now, 10)));
    const newUrl = buildUrl(now, liveMode);

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleRowCopy = (id: string, text: string): void => {
    void copyToClipboard(text).then(() => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      setCopied(id);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(null);
      }, 1500);
    });
  };

  const handleReset = (): void => {
    setInput("");
    setParsedDate(null);
    setCopied(null);
    const newUrl = buildUrl("", liveMode);

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  useEffect(() => {
    if (relativeLive && !liveMode) {
      relativeIntervalRef.current = setInterval(() => {
        setRelativeTick((t) => t + 1);
      }, 1000);
    } else {
      if (relativeIntervalRef.current) {
        clearInterval(relativeIntervalRef.current);
        relativeIntervalRef.current = null;
      }
    }

    return () => {
      if (relativeIntervalRef.current)
        clearInterval(relativeIntervalRef.current);
    };
  }, [relativeLive, liveMode]);

  const handleLiveToggle = (): void => {
    setLiveMode((prev) => {
      const next = !prev;
      const newUrl = buildUrl(next ? "" : input, next);

      history.replaceState(null, "", newUrl);
      setUrl(newUrl);

      return next;
    });
  };

  const handleRelativeLiveToggle = (): void => {
    setRelativeLive((prev) => !prev);
  };

  const displayDate = liveMode ? liveDate : parsedDate;
  const hasInput = input.trim().length > 0;
  const isInvalid = !liveMode && hasInput && parsedDate === null;

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Datetime Converter"
        metaDescription="Convert Unix timestamps, ISO dates, and relative times across timezones with live sync. Free online timestamp converter — no installation required."
        path="/datetime"
        h1="DateTime"
        tagline="Convert timestamps and dates between many formats at once"
      >

      <div className={styles.inputRow}>
        <input
          className={styles.inputField}
          type="text"
          value={liveMode ? "" : input}
          onChange={(e) => {
            handleInputChange(e.target.value);
          }}
          placeholder={
            liveMode
              ? "Live mode active..."
              : "Enter a timestamp, ISO string, or any date..."
          }
          spellCheck={false}
          autoComplete="off"
          disabled={liveMode}
        />
        <button
          className={styles.nowBtn}
          onClick={handleNow}
          disabled={liveMode}
        >
          Now
        </button>
        <button
          className={`${styles.nowBtn}${liveMode ? ` ${styles.nowBtnActive}` : ""}`}
          onClick={handleLiveToggle}
        >
          Live {liveMode ? "ON" : "OFF"}
        </button>
        {liveMode && <Badge color="ready">Live</Badge>}
        {!liveMode && !hasInput && (
          <Badge color="blue">Ready</Badge>
        )}
        {!liveMode &&
          hasInput &&
          (isInvalid ? (
            <Badge color="error">Invalid</Badge>
          ) : (
            <Badge color="ready">Valid</Badge>
          ))}
      </div>

      <div className={styles.conversionGrid}>
        {FORMAT_ROWS.map((row) => {
          const value = displayDate ? row.format(displayDate) : null;
          const isCopied = copied === row.id;
          const isRelativeRow = row.id === "relative";

          return (
            <div key={row.id} className={styles.conversionRow}>
              <span className={styles.conversionLabel}>{row.label}</span>
              {value !== null ? (
                <span className={styles.conversionValue}>{value}</span>
              ) : (
                <span className={styles.conversionValueEmpty}>—</span>
              )}
              <div className={styles.rowActions}>
                {isRelativeRow && (
                  <button
                    className={`${styles.nowBtn}${relativeLive && !liveMode ? ` ${styles.nowBtnActive}` : ""}`}
                    onClick={liveMode ? undefined : handleRelativeLiveToggle}
                    disabled={liveMode}
                  >
                    {liveMode
                      ? "Live Unavailable"
                      : `Live ${relativeLive ? "ON" : "OFF"}`}
                  </button>
                )}
                {!isIframe &&
                  (value !== null ? (
                    <button
                      className={`${styles.copyRowBtn}${isCopied ? ` ${styles.copied}` : ""}`}
                      onClick={() => {
                        handleRowCopy(row.id, value);
                      }}
                    >
                      {isCopied ? "Copied!" : "Copy"}
                    </button>
                  ) : (
                    <span className={styles.copyRowBtnDisabled}>Copy</span>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
      </PageLayout>
    </div>
  );
}
