import { useState, useEffect } from "react";

export type Branding = {
  name: string;
  domain: string;
  tagline: string;
  actionType: string;
};

const defaultBranding: Branding = {
  name: "hypothesis",
  domain: "hypothesis.sh",
  tagline: "A workbench for web experiments",
  actionType: "hypothesis-test",
};

const configs: Record<string, Branding> = {
  "conclusion.sh": {
    name: "conclusion",
    domain: "conclusion.sh",
    tagline: "A workbench for web experiments",
    actionType: "conclusion-test",
  },
  "falsify.sh": {
    name: "falsify",
    domain: "falsify.sh",
    tagline: "A workbench for web experiments",
    actionType: "falsify-test",
  },
};

export function getBranding(hostname: string): Branding {
  return configs[hostname] ?? defaultBranding;
}

export function useBranding(): Branding {
  const [branding, setBranding] = useState(defaultBranding);
  useEffect(() => {
    setBranding(getBranding(window.location.hostname));
  }, []);
  return branding;
}
