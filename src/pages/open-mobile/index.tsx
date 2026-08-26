import type { GetServerSideProps } from "next";
import Head from "next/head";
import styles from "@/styles/open-mobile.module.css";

const APP_STORE_URL =
  "https://apps.apple.com/us/app/hypothesis-sh/id6764898246";

// !!! PLACEHOLDER — DO NOT GUESS THIS URL !!!
// The Android build is not published on Google Play yet, so no listing URL
// exists. While this is empty, Android visitors get the honest "not on Google
// Play yet" panel below instead of a redirect. Paste the real
// https://play.google.com/store/apps/details?id=com.keegancodes.hypothesis
// URL here once the listing is actually live.
const PLAY_STORE_URL = "";

const QR_URL = "/api/qr?value=https%3A%2F%2Fhypothesis.sh%2Fopen-mobile&ecl=M";

type MobilePlatform = "ios" | "android" | "other";

function detectPlatform(userAgent: string): MobilePlatform {
  if (/Android/i.test(userAgent)) {
    return "android";
  }

  if (/iPad|iPhone|iPod/.test(userAgent)) {
    return "ios";
  }

  return "other";
}

interface OpenMobileProps {
  platform: MobilePlatform;
}

// The platform sniff runs on the server so the store hand-off is a real
// redirect rather than a post-hydration jump.
export const getServerSideProps: GetServerSideProps<OpenMobileProps> = (
  context,
) => {
  const platform = detectPlatform(context.req.headers["user-agent"] ?? "");

  if (platform === "ios") {
    return Promise.resolve({
      redirect: { destination: APP_STORE_URL, permanent: false },
    });
  }

  if (platform === "android" && PLAY_STORE_URL) {
    return Promise.resolve({
      redirect: { destination: PLAY_STORE_URL, permanent: false },
    });
  }

  return Promise.resolve({ props: { platform } });
};

export default function OpenMobilePage({
  platform,
}: OpenMobileProps): React.ReactNode {
  return (
    <>
      <Head>
        <title>Hypothesis for Mobile</title>
        <meta name="apple-itunes-app" content="app-id=6764898246" />
      </Head>
      <div className={styles.page}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelLabel}>Mobile App</span>
          </div>
          {platform === "android" ? (
            <div className={styles.qrPane}>
              <p className={styles.androidHeading}>Android</p>
              <p className={styles.androidNote}>
                The Android app is not on Google Play yet. It is in development
                — check back soon.
              </p>
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.androidAltLink}
              >
                Available on iOS today
              </a>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </>
  );
}
