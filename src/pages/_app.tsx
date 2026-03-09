import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { useBranding, brandingToCssVars } from '../lib/branding';

function App({ Component, pageProps }: AppProps) {
  const branding = useBranding();
  return (
    <div style={brandingToCssVars(branding.colors)}>
      <Component {...pageProps} />
    </div>
  );
}

export default App;
