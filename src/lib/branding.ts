import { useState, useEffect } from "react";

export type BrandingColors = {
  accent: string;
};

export type Branding = {
  name: string;
  domain: string;
  tagline: string;
  actionType: string;
  colors: BrandingColors;
};

const defaultBranding: Branding = {
  name: "hypothesis",
  domain: "hypothesis.sh",
  tagline: "A workbench for web experiments",
  actionType: "hypothesis-test",
  colors: { accent: "#7ee8a2" },
};

const configs: Record<string, Branding> = {
  "conclusion.sh": {
    name: "conclusion",
    domain: "conclusion.sh",
    tagline: "A workbench for testing ideas",
    actionType: "conclusion-test",
    colors: { accent: "#a3e635" },
  },
  "falsify.sh": {
    name: "falsify",
    domain: "falsify.sh",
    tagline: "Web experiment validation",
    actionType: "falsify-test",
    colors: { accent: "#5eead4" },
  },
  "observation.sh": {
    name: "observation",
    domain: "observation.sh",
    tagline: "Tools for observing web behavior",
    actionType: "observation-test",
    colors: { accent: "#818cf8" },
  },
};

export function getBranding(hostname: string): Branding {
  return configs[hostname] ?? defaultBranding;
}

type CSSVarMap = React.CSSProperties & Record<string, string>;

export function brandingToCssVars(colors: BrandingColors): CSSVarMap {
  const hex = colors.accent.replace("#", "");
  return {
    "--accent": `#${hex}`,
    "--accent-subtle": `#${hex}18`,
    "--accent-border": `#${hex}33`,
    "--accent-hover": `#${hex}30`,
    "--accent-hover-strong": `#${hex}55`,
  } as CSSVarMap;
}

export function useBranding(): Branding {
  const [branding, setBranding] = useState(defaultBranding);
  useEffect(() => {
    setBranding(getBranding(window.location.hostname));
  }, []);
  return branding;
}
