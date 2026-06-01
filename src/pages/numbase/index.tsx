import { useEffect, useRef, useState } from "react";
import styles from "@/styles/numbase.module.css";
import { Badge, Button, CopyButton, PageLayout, Panel, PanelHeader, PanelBody, PermalinkRow } from "@/components/ui";
import { empty, fromDecimal, type Values } from "@/lib/numbase";

export default function NumbasePage(): React.ReactNode {
  const [values, setValues] = useState<Values>(empty);
  const [errorField, setErrorField] = useState<keyof Values | null>(null);
  const [url, setUrl] = useState("");


  const buildUrl = (dec: string): string => {
    if (!dec) return `${window.location.origin}${window.location.pathname}`;

    return `${window.location.origin}${window.location.pathname}?value=${dec}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("value");

    if (value) {
      const n = Number(value);

      if (
        !isNaN(n) &&
        Number.isInteger(n) &&
        n >= 0 &&
        n <= Number.MAX_SAFE_INTEGER
      )
        setValues(fromDecimal(n)); // eslint-disable-line react-hooks/set-state-in-effect
    }

    setUrl(window.location.href);
  }, []);

  const handleChange = (
    raw: string,
    field: keyof Values,
    base: number,
  ): void => {
    const trimmed = raw.trim();

    // Always reflect what was typed in the active field
    setValues((prev) => ({ ...prev, [field]: raw }));

    if (!trimmed) {
      setValues(empty);
      setErrorField(null);
      const newUrl = buildUrl("");

      history.replaceState(null, "", newUrl);
      setUrl(newUrl);

      return;
    }

    const n = parseInt(trimmed, base);

    if (isNaN(n) || n < 0 || n > Number.MAX_SAFE_INTEGER) {
      setErrorField(field);

      return;
    }

    setErrorField(null);
    const next = fromDecimal(n);

    // Keep what the user typed for their active field
    setValues({ ...next, [field]: raw.toUpperCase() });
    const newUrl = buildUrl(next.dec);

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };

  const handleReset = (): void => {
    setValues(empty);
    setErrorField(null);
    const newUrl = `${window.location.origin}${window.location.pathname}`;

    history.replaceState(null, "", newUrl);
    setUrl(newUrl);
  };



  const panels: {
    field: keyof Values;
    label: string;
    prefix: string;
    base: number;
    placeholder: string;
  }[] = [
    {
      field: "bin",
      label: "Binary",
      prefix: "0b",
      base: 2,
      placeholder: "e.g. 11111111",
    },
    {
      field: "oct",
      label: "Octal",
      prefix: "0o",
      base: 8,
      placeholder: "e.g. 377",
    },
    {
      field: "dec",
      label: "Decimal",
      prefix: "base 10",
      base: 10,
      placeholder: "e.g. 255",
    },
    {
      field: "hex",
      label: "Hex",
      prefix: "0x",
      base: 16,
      placeholder: "e.g. FF",
    },
  ];

  return (
    <div className={styles.page}>
      <PageLayout
        metaTitle="Number Base Converter"
        metaDescription="Convert numbers between binary, octal, decimal, and hexadecimal bases instantly. Free online number base converter — no installation required. No data sent to servers."
        path="/numbase"
        h1="Number Base"
        tagline="Convert integers between binary, octal, decimal, and hex"
      >

      <div className={styles.panels}>
        {panels.map(({ field, label, prefix, base, placeholder }) => {
          const isError = errorField === field;
          const val = values[field];

          return (
            <Panel key={field}>
              <PanelHeader label={label}>
                {isError ? (
                  <Badge color="error">invalid</Badge>
                ) : val ? (
                  <Badge>{val.length} digits</Badge>
                ) : (
                  <Badge>{prefix}</Badge>
                )}
              </PanelHeader>
              <PanelBody>
                <textarea
                  className={styles.textarea}
                  value={val}
                  onChange={(e) => {
                    handleChange(e.target.value, field, base);
                  }}
                  placeholder={placeholder}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                />
                {val && !isError && (
                  <CopyButton value={val} variant="ghost" size="xs" />
                )}
              </PanelBody>
            </Panel>
          );
        })}
      </div>

      <hr className={styles.divider} />

      <PermalinkRow url={url} onReset={handleReset} />
      </PageLayout>
    </div>
  );
}
