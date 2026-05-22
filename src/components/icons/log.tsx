import React from "react";

export function LogIcon({
  className,
}: {
  className?: string;
}): React.ReactNode {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <rect x="2.5" y="3.5" width="1.5" height="1.5" fill="currentColor" />
      <line
        x1="5.75"
        y1="4.25"
        x2="12.5"
        y2="4.25"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <rect x="2.5" y="6.75" width="1.5" height="1.5" fill="currentColor" />
      <line
        x1="5.75"
        y1="7.5"
        x2="12.5"
        y2="7.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <rect x="2.5" y="10" width="1.5" height="1.5" fill="currentColor" />
      <line
        x1="5.75"
        y1="10.75"
        x2="10"
        y2="10.75"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
