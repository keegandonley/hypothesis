import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/datetime.module.css";
import { Badge, Button, CopyButton, PageLayout, PermalinkRow } from "@/components/ui";
import { FORMAT_ROWS, parseInput } from "@/lib/datetime";
import { useUrlSync } from "@/lib/useUrlSync";

export default function DateTimePage(): React.ReactNode {
  const { replaceUrl, replaceUrlNow } = useUrlSync();
  const [input, setInput] = useState("");
  const [parsedDate, setParsedDate] = useState<Date | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const [liveDate, setLiveDate] = useState<Date | null>(null);
  const [relativeLive, setRelativeLive] = useState(true);
  const [, setRelativeTick] = useState(0);
  const [url, setUrl] = useState("");
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

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleNow = (): void => {
    const now = String(Date.now());

    setInput(now);
    setParsedDate(new Date(parseInt(now, 10)));
    const newUrl = buildUrl(now, liveMode);

    replaceUrl(newUrl);
    setUrl(newUrl);
  };

  const handleReset = (): void => {
    setInput("");
    setParsedDate(null);
    const newUrl = buildUrl("", liveMode);

    replaceUrlNow(newUrl);
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

      replaceUrl(newUrl);
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
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNow}
          disabled={liveMode}
        >
          Now
        </Button>
        <Button
          variant="toggle"
          active={liveMode}
          onClick={handleLiveToggle}
        >
          Live {liveMode ? "ON" : "OFF"}
        </Button>
        {liveMode && <Badge color="ready">Live</Badge>}
        {!liveMode && !hasInput && (
          <Badge color="blue">Ready</Badge>
        )}
        {!liveMode &&
          hasInput &&
          (isInvalid ? (
            <Badge color="warn">Invalid</Badge>
          ) : (
            <Badge color="ready">Valid</Badge>
          ))}
      </div>

      <div className={styles.conversionGrid}>
        {FORMAT_ROWS.map((row) => {
          const value = displayDate ? row.format(displayDate) : null;
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
                      <Button
                        variant="toggle"
                        active={relativeLive && !liveMode}
                        onClick={liveMode ? undefined : handleRelativeLiveToggle}
                        disabled={liveMode}
                      >
                        {liveMode
                          ? "Live Unavailable"
                          : `Live ${relativeLive ? "ON" : "OFF"}`}
                      </Button>
                    )}
                    <CopyButton
                      value={value ?? ""}
                      variant="ghost"
                      size="sm"
                      disabled={value === null}
                    />
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
