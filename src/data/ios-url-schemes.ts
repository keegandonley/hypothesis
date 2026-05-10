export interface UrlScheme {
  scheme: string;
  example: string;
  description: string;
  note?: string;
}

export interface UrlSchemeGroup {
  id: string;
  label: string;
  color: string;
  subtle: string;
  border: string;
  schemes: UrlScheme[];
}

export const URL_SCHEME_GROUPS: UrlSchemeGroup[] = [
  {
    id: "phone",
    label: "Phone & FaceTime",
    color: "#60a5fa",
    subtle: "#60a5fa18",
    border: "#60a5fa33",
    schemes: [
      {
        scheme: "tel:",
        example: "tel:+15551234567",
        description:
          "Initiates a phone call. Opens the dialer with the number pre-filled and prompts the user to confirm before dialing.",
      },
      {
        scheme: "telprompt:",
        example: "telprompt:+15551234567",
        description:
          "Same as tel: but always shows a confirmation dialog before dialing, even in contexts that would otherwise proceed silently.",
      },
      {
        scheme: "facetime:",
        example: "facetime:user@example.com",
        description:
          "Starts a FaceTime video call. Accepts an email address or phone number. Falls back gracefully on devices without a front camera.",
        note: "Declare facetime in LSApplicationQueriesSchemes to use canOpenURL.",
      },
      {
        scheme: "facetime-audio:",
        example: "facetime-audio:+15551234567",
        description:
          "Starts a FaceTime audio-only call to an email address or phone number.",
        note: "Declare facetime-audio in LSApplicationQueriesSchemes to use canOpenURL.",
      },
    ],
  },
  {
    id: "messaging",
    label: "Messages & Mail",
    color: "#34d399",
    subtle: "#34d39918",
    border: "#34d39933",
    schemes: [
      {
        scheme: "sms:",
        example: "sms:+15551234567",
        description:
          "Opens the Messages app with a new compose window addressed to the given number. Multiple recipients can be comma-separated.",
      },
      {
        scheme: "mailto:",
        example: "mailto:user@example.com?subject=Hello&body=Hi+there",
        description:
          "Opens the default mail client with a pre-filled compose window. Supports subject, body, cc, and bcc as URL query parameters.",
      },
    ],
  },
  {
    id: "maps",
    label: "Maps",
    color: "#2dd4bf",
    subtle: "#2dd4bf18",
    border: "#2dd4bf33",
    schemes: [
      {
        scheme: "maps://?q=",
        example: "maps://?q=coffee+near+me",
        description:
          "Opens Apple Maps with a search query. Use q= for a text search centered on the user's current location.",
      },
      {
        scheme: "maps://?ll=",
        example: "maps://?ll=37.7749,-122.4194&q=San+Francisco",
        description:
          "Drops a pin at specific coordinates. Combine ll=lat,lng with q= to show a custom label at that location.",
      },
      {
        scheme: "maps://?saddr=",
        example: "maps://?saddr=Current+Location&daddr=1+Infinite+Loop,Cupertino",
        description:
          "Gets turn-by-turn directions. saddr= is the origin, daddr= is the destination. Both accept plain addresses or lat,lng pairs.",
      },
    ],
  },
  {
    id: "appstore",
    label: "App Store",
    color: "#fb923c",
    subtle: "#fb923c18",
    border: "#fb923c33",
    schemes: [
      {
        scheme: "itms-apps:",
        example: "itms-apps://itunes.apple.com/app/id123456789",
        description:
          "Opens the App Store app directly to a specific app page. Replace the numeric ID with the App ID from App Store Connect.",
      },
      {
        scheme: "itms-apps: (write-review)",
        example: "itms-apps://itunes.apple.com/app/id123456789?action=write-review",
        description:
          "Navigates to the app page and automatically prompts the user to write a review. Use as a fallback to SKStoreReviewController.",
      },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    color: "#fbbf24",
    subtle: "#fbbf2418",
    border: "#fbbf2433",
    schemes: [
      {
        scheme: "app-settings:",
        example: "app-settings:",
        description:
          "Opens your app's own page in the system Settings app. This is the URL that UIApplicationOpenSettingsURLString resolves to. Available iOS 8+.",
      },
      {
        scheme: "App-prefs:root=",
        example: "App-prefs:root=WIFI",
        description:
          "Deep-links into a specific system Settings section. Common roots: WIFI, Bluetooth, LOCATION_SERVICES, NOTIFICATIONS_ID, General, Privacy.",
        note: "Undocumented — Apple may rename or remove these paths between iOS updates.",
      },
    ],
  },
  {
    id: "system",
    label: "System Apps",
    color: "#c084fc",
    subtle: "#c084fc18",
    border: "#c084fc33",
    schemes: [
      {
        scheme: "shortcuts://",
        example: "shortcuts://run-shortcut?name=My+Shortcut",
        description:
          "Opens the Shortcuts app. Use run-shortcut?name= to run a shortcut by name, or open-shortcut?name= to view it without running.",
      },
      {
        scheme: "calshow:",
        example: "calshow://",
        description:
          "Opens the Calendar app. Pass a time interval (seconds since Jan 1, 2001 — NSDate's reference date) to navigate to a specific date.",
      },
    ],
  },
];
