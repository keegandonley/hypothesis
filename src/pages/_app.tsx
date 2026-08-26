import React from "react";
import type { AppProps } from "next/app";
import "../styles/globals.css";
import { useBranding, brandingToCssVars } from "../lib/branding";
import { useWork } from "../lib/useWork";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

function App({ Component, pageProps }: AppProps): React.ReactNode {
  const branding = useBranding();

  useWork();

  return (
    <div style={brandingToCssVars(branding.colors)}>
      <Component {...pageProps} />
      <Analytics />
      <SpeedInsights />
    </div>
  );
}

export default App;
