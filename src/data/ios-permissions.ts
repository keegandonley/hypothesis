export interface PermissionKey {
  key: string;
  description: string;
  introduced: string;
  deprecated?: boolean;
  deprecatedNote?: string;
}

export interface PermissionGroup {
  id: string;
  label: string;
  color: string;
  subtle: string;
  border: string;
  keys: PermissionKey[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "location",
    label: "Location",
    color: "#60a5fa",
    subtle: "#60a5fa18",
    border: "#60a5fa33",
    keys: [
      {
        key: "NSLocationWhenInUseUsageDescription",
        description:
          "Required for location access while the app is in the foreground. The string is displayed in the system permission alert.",
        introduced: "iOS 8",
      },
      {
        key: "NSLocationAlwaysAndWhenInUseUsageDescription",
        description:
          "Required for always-on location access including background. Must also include NSLocationWhenInUseUsageDescription.",
        introduced: "iOS 11",
      },
      {
        key: "NSLocationAlwaysUsageDescription",
        description:
          "Legacy key for always-on location. Superseded by NSLocationAlwaysAndWhenInUseUsageDescription. Keep for iOS 10 compatibility.",
        introduced: "iOS 6",
        deprecated: true,
        deprecatedNote: "Use NSLocationAlwaysAndWhenInUseUsageDescription",
      },
      {
        key: "NSLocationTemporaryUsageDescriptionDictionary",
        description:
          "A dictionary of purpose keys mapped to usage strings for requesting temporary full-accuracy upgrades via requestTemporaryFullAccuracyAuthorization.",
        introduced: "iOS 14",
      },
    ],
  },
  {
    id: "camera",
    label: "Camera & Photos",
    color: "#f87171",
    subtle: "#f8717118",
    border: "#f8717133",
    keys: [
      {
        key: "NSCameraUsageDescription",
        description:
          "Required for any camera access. Without this key, accessing the camera crashes the app immediately.",
        introduced: "iOS 7",
      },
      {
        key: "NSPhotoLibraryUsageDescription",
        description:
          "Required for read access to the photo library. In iOS 14+ users can grant access to selected photos only.",
        introduced: "iOS 6",
      },
      {
        key: "NSPhotoLibraryAddUsageDescription",
        description:
          "Required for write-only access — saving photos or videos to the library without reading existing content.",
        introduced: "iOS 11",
      },
    ],
  },
  {
    id: "microphone",
    label: "Microphone & Speech",
    color: "#fb923c",
    subtle: "#fb923c18",
    border: "#fb923c33",
    keys: [
      {
        key: "NSMicrophoneUsageDescription",
        description:
          "Required for any microphone access — recording audio, voice input, or real-time audio processing. Missing key crashes the app.",
        introduced: "iOS 7",
      },
      {
        key: "NSSpeechRecognitionUsageDescription",
        description:
          "Required when using SFSpeechRecognizer for speech-to-text. Audio may be sent to Apple servers unless on-device recognition is used (iOS 13+).",
        introduced: "iOS 10",
      },
    ],
  },
  {
    id: "contacts",
    label: "Contacts & Calendar",
    color: "#34d399",
    subtle: "#34d39918",
    border: "#34d39933",
    keys: [
      {
        key: "NSContactsUsageDescription",
        description:
          "Required for reading or writing contacts via the Contacts framework.",
        introduced: "iOS 6",
      },
      {
        key: "NSCalendarsFullAccessUsageDescription",
        description:
          "Required for full read and write access to calendars and events. Use this in iOS 17+ instead of NSCalendarsUsageDescription.",
        introduced: "iOS 17",
      },
      {
        key: "NSCalendarsWriteOnlyAccessUsageDescription",
        description:
          "Required for creating events without reading existing calendar data. iOS 17+.",
        introduced: "iOS 17",
      },
      {
        key: "NSCalendarsUsageDescription",
        description:
          "Legacy key for calendar read/write access. Superseded in iOS 17.",
        introduced: "iOS 6",
        deprecated: true,
        deprecatedNote: "Use NSCalendarsFullAccessUsageDescription",
      },
      {
        key: "NSRemindersFullAccessUsageDescription",
        description:
          "Required for full access to reminders — reading, creating, and completing. Use this in iOS 17+ instead of NSRemindersUsageDescription.",
        introduced: "iOS 17",
      },
      {
        key: "NSRemindersUsageDescription",
        description: "Legacy key for Reminders access. Superseded in iOS 17.",
        introduced: "iOS 6",
        deprecated: true,
        deprecatedNote: "Use NSRemindersFullAccessUsageDescription",
      },
    ],
  },
  {
    id: "health",
    label: "Health & Motion",
    color: "#c084fc",
    subtle: "#c084fc18",
    border: "#c084fc33",
    keys: [
      {
        key: "NSHealthShareUsageDescription",
        description:
          "Required for reading health data from HealthKit. Shown in the HealthKit permissions sheet, not the standard system alert.",
        introduced: "iOS 8",
      },
      {
        key: "NSHealthUpdateUsageDescription",
        description:
          "Required for writing health data to HealthKit. Combine with NSHealthShareUsageDescription if also reading.",
        introduced: "iOS 8",
      },
      {
        key: "NSHealthClinicalHealthRecordsShareUsageDescription",
        description:
          "Required for accessing clinical health records (FHIR data) from supported healthcare institutions.",
        introduced: "iOS 12",
      },
      {
        key: "NSMotionUsageDescription",
        description:
          "Required for motion and fitness data from the accelerometer, gyroscope, and step counter via CMMotionManager or CMPedometer.",
        introduced: "iOS 7",
      },
    ],
  },
  {
    id: "connectivity",
    label: "Bluetooth & Network",
    color: "#2dd4bf",
    subtle: "#2dd4bf18",
    border: "#2dd4bf33",
    keys: [
      {
        key: "NSBluetoothAlwaysUsageDescription",
        description:
          "Required for any Bluetooth access in iOS 13+. Covers both central and peripheral roles. Apps also targeting iOS 12 need NSBluetoothPeripheralUsageDescription.",
        introduced: "iOS 13",
      },
      {
        key: "NSBluetoothPeripheralUsageDescription",
        description:
          "Legacy Bluetooth key for iOS 6–12. In iOS 13+ use NSBluetoothAlwaysUsageDescription.",
        introduced: "iOS 6",
        deprecated: true,
        deprecatedNote: "Use NSBluetoothAlwaysUsageDescription",
      },
      {
        key: "NSLocalNetworkUsageDescription",
        description:
          "Required before the app can browse or connect to devices on the local network via Bonjour, mDNS, or custom TCP/UDP sockets.",
        introduced: "iOS 14",
      },
      {
        key: "NSNearbyInteractionUsageDescription",
        description:
          "Required for the Nearby Interaction framework — measuring distance and direction to other U1/UWB-equipped devices.",
        introduced: "iOS 14",
      },
    ],
  },
  {
    id: "identity",
    label: "Identity & Privacy",
    color: "#fbbf24",
    subtle: "#fbbf2418",
    border: "#fbbf2433",
    keys: [
      {
        key: "NSFaceIDUsageDescription",
        description:
          "Required when using Face ID via the LocalAuthentication framework. Missing this key crashes the app on Face ID devices.",
        introduced: "iOS 11",
      },
      {
        key: "NSUserTrackingUsageDescription",
        description:
          "Required for App Tracking Transparency (ATT). Shown before requesting IDFA access or cross-app tracking. Mandatory for App Store submission if tracking is used.",
        introduced: "iOS 14",
      },
    ],
  },
  {
    id: "media",
    label: "Media & Home",
    color: "#f472b6",
    subtle: "#f472b618",
    border: "#f472b633",
    keys: [
      {
        key: "NSAppleMusicUsageDescription",
        description:
          "Required for accessing the user's Apple Music library and media player queue via the MediaPlayer framework.",
        introduced: "iOS 9.3",
      },
      {
        key: "NSHomeKitUsageDescription",
        description:
          "Required for communicating with HomeKit-enabled accessories via the HomeKit framework.",
        introduced: "iOS 8",
      },
      {
        key: "NSSiriUsageDescription",
        description:
          "Required when integrating with Siri via the Intents framework (SiriKit). Shown when the user first enables your app's Siri integration.",
        introduced: "iOS 10",
      },
      {
        key: "NSVideoSubscriberAccountUsageDescription",
        description:
          "Required for authenticating with a TV provider (TV Everywhere / MVPD) via the VideoSubscriberAccount framework.",
        introduced: "iOS 10",
      },
    ],
  },
];
