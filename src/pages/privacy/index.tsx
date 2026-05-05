import Head from "next/head";
import Link from "next/link";
import styles from "../../styles/docs.module.css";
import { useBranding } from "@/lib/branding";

export default function PrivacyPage() {
  const branding = useBranding();

  return (
    <div className={styles.page}>
      <Head>
        <title>{`${branding.name.toUpperCase()} — PRIVACY POLICY`}</title>
        <meta
          name="description"
          content="Privacy policy for hypothesis.sh and related domains."
        />
        <meta property="og:title" content="Privacy Policy" />
        <meta
          property="og:description"
          content="Privacy policy for hypothesis.sh and related domains."
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://hypothesis.sh/privacy" />
      </Head>
      <div className={styles.inner}>
        <nav className={styles.nav}>
          <Link href="/" className={styles.backLink}>
            <span style={{ marginBottom: "3px" }}>←</span> {branding.name}
          </Link>
        </nav>
        <hr className={styles.divider} />

        <div className={styles.content}>
          <h1>Privacy Policy</h1>

          <p>
            This privacy policy applies to the websites hypothesis.sh,
            conclusion.sh, falsify.sh, and observation.sh (collectively, "the
            Service"), as well as any associated mobile applications. It
            describes what data is collected, how it is used, and your rights
            with respect to that data. Last updated: May 5, 2026.
          </p>

          <h2>What We Collect</h2>

          <h3>Analytics</h3>
          <p>
            The Service uses Vercel Analytics to collect anonymous usage data,
            including page views, referrer URLs, device type, operating system,
            browser, and approximate location (country/region level). This data
            is aggregated and does not identify individual users. Vercel
            Analytics does not use cookies or persistent identifiers for
            tracking. See{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              vercel.com/legal/privacy-policy
            </a>{" "}
            for details on how Vercel handles this data.
          </p>

          <h3>Data collected automatically</h3>
          <p>
            When you visit the Service, your IP address and standard HTTP
            request headers are processed by our hosting provider (Vercel) as
            part of serving each request. Vercel derives approximate geolocation
            information from your IP address (city, region, country,
            latitude/longitude, and timezone). We do not log or store this
            information except as described below.
          </p>

          <h3>Webhook sessions and events</h3>
          <p>
            The webhook experiment lets you create a temporary endpoint to
            inspect incoming HTTP requests.
          </p>
          <p>
            <strong>Web (anonymous) sessions:</strong> When you create a
            session from the website without a device account, your IP address
            is stored alongside a randomly generated session ID solely to
            enforce a per-IP rate limit and prevent abuse. Anonymous sessions
            and all associated webhook events are automatically deleted after
            one hour of inactivity.
          </p>
          <p>
            <strong>Mobile app sessions:</strong> When you use the webhook
            feature in the mobile app, a persistent session is created and
            associated with your device ID. Webhook events received by that
            session are stored indefinitely and are not subject to automatic
            expiration. You may request deletion of this data at any time by
            contacting us at the address below.
          </p>

          <h3>Push notification tokens</h3>
          <p>
            If you use the push notification feature (available in the mobile
            app and the push-test tool), the following data is stored in our
            database so we can deliver notifications to your device:
          </p>
          <ul>
            <li>A randomly generated device identifier (UUID) created on your device</li>
            <li>Your device push token issued by the platform (Apple APNs)</li>
            <li>The platform name (e.g. "ios")</li>
          </ul>
          <p>
            This data is used solely to route push notifications to your device.
            You can stop receiving notifications at any time by disabling
            notification permissions in your device settings.
          </p>

          <h3>My IP tool</h3>
          <p>
            The My IP tool calls our API to return your IP address and
            Vercel-derived geolocation data directly to you in the browser. This
            data is not stored on our servers.
          </p>

          <h2>Client-Side Tool Processing</h2>
          <p>
            The vast majority of tools on the Service (Base64, JWT inspector,
            regex tester, UUID generator, color converter, and others not listed
            above) process all input entirely in your browser. No tool input or
            output is transmitted to our servers. There are no user accounts and
            no login is required.
          </p>

          <h2>Third-Party Services</h2>

          <h3>Vercel</h3>
          <p>
            The Service is hosted on Vercel. Vercel processes every request and
            may retain server logs, including IP addresses, in accordance with
            their own privacy policy. Vercel also powers the analytics described
            above. See{" "}
            <a
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
            >
              vercel.com/legal/privacy-policy
            </a>{" "}
            for details.
          </p>

          <h3>Apple Push Notification Service (APNs)</h3>
          <p>
            Push notifications are delivered via Apple's APNs infrastructure.
            When a notification is sent, your push token is transmitted to
            Apple's servers. See Apple's privacy documentation for details on
            how APNs handles this data.
          </p>

          <h2>Data Retention and Deletion</h2>
          <p>
            Anonymous webhook sessions and their events are deleted
            automatically after one hour of inactivity. Mobile app webhook
            sessions and events, as well as push notification tokens, are
            retained indefinitely. You may request deletion of any data
            associated with your device by contacting us at the address below
            with your device ID.
          </p>

          <h2>Children's Privacy</h2>
          <p>
            The Service is not directed at children under 13. We do not
            knowingly collect personal information from children under 13. If
            you believe we have inadvertently collected such information, please
            contact us and we will delete it promptly.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. The "last updated" date
            at the top of this page reflects the most recent revision. Continued
            use of the Service after changes are posted constitutes acceptance of
            the updated policy.
          </p>

          <h2>Contact</h2>
          <p>
            Questions or requests regarding this privacy policy can be sent to{" "}
            <a href="mailto:kd@keegandonley.com">kd@keegandonley.com</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
