import { useEffect } from "react";
import Head from "next/head";
import styles from "../../styles/open-mobile.module.css";

const APP_STORE_URL =
  "https://apps.apple.com/us/app/hypothesis-sh/id6764898246";
const QR_URL = "/api/qr?value=https%3A%2F%2Fhypothesis.sh%2Fopen-mobile&ecl=M";

export default function OpenMobilePage(): React.ReactNode {
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      window.location.replace(APP_STORE_URL);
    }
  }, []);

  return (
    <>
      <Head>
        <title>Hypothesis for iOS</title>
        <meta name="apple-itunes-app" content="app-id=6764898246" />
      </Head>
      <div className={styles.page}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Mobile App</span>
          </div>
          <div className={styles.qrPane}>
            <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://static.donley.xyz/appstore-white.svg"
                alt="Download on the App Store"
                className={styles.appStoreBadge}
              />
            </a>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={QR_URL}
              alt="QR code for hypothesis.sh/open-mobile"
              className={styles.qrImage}
            />
            <p className={styles.qrCaption}>Scan to install the app</p>
          </div>
        </div>
      </div>
    </>
  );
}
