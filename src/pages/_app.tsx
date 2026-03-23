import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { useBranding, brandingToCssVars } from '../lib/branding';
import { useWork } from '../lib/useWork';
import { Analytics } from '@vercel/analytics/react';

function App({ Component, pageProps }: AppProps) {
  const branding = useBranding();
  useWork();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }, []);

  return (
    <div style={brandingToCssVars(branding.colors)}>
      <Component {...pageProps} />
      <Analytics />
    </div>
  );
}

export default App;
