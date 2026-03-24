import { useState } from "react";

export function useWorkMode(): boolean {
  const [workMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).has("workMode");
  });
  return workMode;
}
