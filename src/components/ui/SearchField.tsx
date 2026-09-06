import React from "react";
import styles from "./SearchField.module.css";

interface SearchFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
}

export function SearchField({
  value,
  onValueChange,
  placeholder,
}: SearchFieldProps): React.ReactNode {
  return (
    <div className={styles.root}>
      <span className={styles.icon} aria-hidden="true">
        ⌕
      </span>
      <input
        className={styles.input}
        type="text"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button
          type="button"
          className={styles.clear}
          onClick={() => {
            onValueChange("");
          }}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
