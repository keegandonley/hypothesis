export interface IoniconEntry {
  name: string;
  category: string;
}

export interface IoniconCategory {
  label: string;
  color: string;
  subtle: string;
  border: string;
  icons: string[];
}

// All base icon names (filled variant). Each also has -outline and -sharp variants.
// Source: @expo/vector-icons Ionicons from @ionic/ionicons v7
const RAW: Record<string, string[]> = {
  "Navigation & Arrows": [
    "arrow-back", "arrow-back-circle", "arrow-forward", "arrow-forward-circle",
    "arrow-down", "arrow-down-circle", "arrow-up", "arrow-up-circle",
    "arrow-down-left-box", "arrow-down-right-box", "arrow-up-left-box", "arrow-up-right-box",
    "arrow-redo", "arrow-redo-circle", "arrow-undo", "arrow-undo-circle",
    "caret-back", "caret-back-circle", "caret-forward", "caret-forward-circle",
    "caret-down", "caret-down-circle", "caret-up", "caret-up-circle",
    "chevron-back", "chevron-back-circle", "chevron-forward", "chevron-forward-circle",
    "chevron-collapse", "chevron-down", "chevron-down-circle",
    "chevron-expand", "chevron-up", "chevron-up-circle",
    "return-down-back", "return-down-forward", "return-up-back", "return-up-forward",
    "swap-horizontal", "swap-vertical",
    "navigate", "navigate-circle", "compass", "locate", "location", "pin", "trail-sign",
    "enter", "exit", "log-in", "log-out", "open", "move", "resize", "expand", "contract",
  ],

  "Interface & Controls": [
    "add", "add-circle", "remove", "remove-circle",
    "checkmark", "checkmark-circle", "checkmark-done", "checkmark-done-circle",
    "close", "close-circle",
    "ellipsis-horizontal", "ellipsis-horizontal-circle",
    "ellipsis-vertical", "ellipsis-vertical-circle",
    "menu", "options", "reorder-two", "reorder-three", "reorder-four",
    "search", "search-circle", "filter", "filter-circle", "funnel",
    "settings", "cog", "toggle",
    "refresh", "refresh-circle", "reload", "reload-circle", "sync", "sync-circle",
    "copy", "clipboard", "duplicate", "save",
    "share", "share-social", "download", "cloud-download", "upload", "cloud-upload",
    "scan", "scan-circle", "qr-code",
    "eye", "eye-off",
    "lock-closed", "lock-open", "key", "keypad", "finger-print",
    "checkbox", "radio", "radio-button-off", "radio-button-on",
    "alert", "alert-circle", "warning", "information", "information-circle",
    "help", "help-buoy", "help-circle",
    "ban", "infinite", "invert-mode",
    "backspace", "attach",
    "send", "paper-plane",
    "create", "pencil", "cut", "crop",
    "color-fill", "color-filter", "color-palette", "color-wand", "eyedrop",
    "contrast", "aperture",
    "stopwatch", "timer", "alarm", "time", "hourglass", "today",
    "push",
  ],

  "Communication": [
    "mail", "mail-open", "mail-unread",
    "chatbox", "chatbox-ellipses", "chatbubble", "chatbubble-ellipses", "chatbubbles",
    "notifications", "notifications-circle", "notifications-off", "notifications-off-circle",
    "call", "megaphone",
    "at", "at-circle",
    "link", "unlink",
  ],

  "People & Social": [
    "people", "people-circle", "person", "person-add", "person-circle", "person-remove",
    "man", "woman", "male", "female", "male-female", "transgender", "body",
    "accessibility", "happy", "sad",
    "hand-left", "hand-right",
    "thumbs-up", "thumbs-down",
  ],

  "Media & Playback": [
    "play", "play-circle", "play-back", "play-back-circle",
    "play-forward", "play-forward-circle",
    "play-skip-back", "play-skip-back-circle",
    "play-skip-forward", "play-skip-forward-circle",
    "pause", "pause-circle", "stop", "stop-circle",
    "recording", "mic", "mic-circle", "mic-off", "mic-off-circle",
    "volume-high", "volume-low", "volume-medium", "volume-mute", "volume-off",
    "musical-note", "musical-notes",
    "film", "disc", "videocam", "videocam-off",
    "camera", "camera-reverse", "image", "images", "albums",
    "headset", "radio", "tv",
    "shuffle", "repeat",
  ],

  "Files & Documents": [
    "document", "document-attach", "document-lock", "document-text",
    "documents", "folder", "folder-open",
    "archive", "file-tray", "file-tray-full", "file-tray-stacked",
    "clipboard", "library", "reader", "journal",
    "book", "bookmark", "bookmarks", "newspaper",
    "receipt", "ticket", "id-card",
    "code", "code-download", "code-slash", "code-working",
    "easel", "prism",
    "text",
  ],

  "Devices & Hardware": [
    "phone-portrait", "phone-landscape", "tablet-portrait", "tablet-landscape",
    "laptop", "desktop", "server", "hardware-chip",
    "battery-charging", "battery-dead", "battery-full", "battery-half",
    "bluetooth", "wifi", "cellular", "power",
    "watch", "tv",
    "print", "flashlight", "game-controller",
  ],

  "Commerce & Shopping": [
    "cart", "bag", "bag-add", "bag-check", "bag-handle", "bag-remove",
    "basket", "wallet", "cash", "card",
    "pricetag", "pricetags", "barcode",
    "storefront", "gift", "briefcase", "business",
  ],

  "Nature & Weather": [
    "sunny", "cloudy", "cloudy-night", "rainy", "snow",
    "thunderstorm", "partly-sunny", "moon",
    "cloud", "cloud-circle", "cloud-done", "cloud-offline",
    "flash", "flash-off",
    "leaf", "flower", "rose", "bonfire", "flame",
    "earth", "globe", "planet",
    "water", "fish", "paw", "egg", "thermometer",
    "nuclear",
  ],

  "Food & Drink": [
    "fast-food", "restaurant", "pizza", "ice-cream", "nutrition",
    "cafe", "beer", "wine", "pint",
  ],

  "Sports & Activities": [
    "american-football", "football", "basketball", "baseball", "tennisball",
    "bowling-ball", "golf", "fitness", "barbell",
    "bicycle", "walk", "footsteps",
    "boat", "car", "car-sport", "bus", "subway", "train", "airplane", "rocket",
    "trophy", "medal", "podium", "ribbon",
  ],

  "Health & Medical": [
    "medical", "medkit", "bandage", "pulse", "heartrate",
    "heart", "heart-circle", "heart-dislike", "heart-dislike-circle", "heart-half",
    "skull", "ear", "beaker", "flask", "scale", "eyedrop",
  ],

  "Tools & Technology": [
    "hammer", "build", "construct",
    "bug", "terminal",
    "git-branch", "git-commit", "git-compare", "git-merge", "git-network", "git-pull-request",
    "calculator", "magnet", "telescope", "binoculars",
    "bulb", "speedometer", "analytics", "bar-chart", "pie-chart", "stats-chart",
    "trending-down", "trending-up",
    "brush", "cube",
  ],

  "Layout & Data": [
    "home", "apps", "grid", "list", "list-circle",
    "layers", "browsers", "extension-puzzle",
    "calendar", "calendar-clear", "calendar-number",
    "map", "globe",
    "bookmark", "bookmarks",
  ],

  "Misc & Symbols": [
    "square", "triangle", "ellipse", "diamond", "shapes",
    "sparkles", "infinite",
    "star", "star-half", "flag",
    "shield", "shield-checkmark", "shield-half",
    "trash", "trash-bin",
    "umbrella", "balloon", "dice",
    "glasses", "shirt", "bed",
    "school", "ribbon", "ticket",
    "compass", "telescope",
    "ionicons",
  ],
};

const CATEGORY_STYLES: Record<string, { color: string; subtle: string; border: string }> = {
  "Navigation & Arrows":  { color: "#60a5fa", subtle: "#60a5fa14", border: "#60a5fa30" },
  "Interface & Controls": { color: "#34d399", subtle: "#34d39914", border: "#34d39930" },
  "Communication":        { color: "#2dd4bf", subtle: "#2dd4bf14", border: "#2dd4bf30" },
  "People & Social":      { color: "#f472b6", subtle: "#f472b614", border: "#f472b630" },
  "Media & Playback":     { color: "#a78bfa", subtle: "#a78bfa14", border: "#a78bfa30" },
  "Files & Documents":    { color: "#fbbf24", subtle: "#fbbf2414", border: "#fbbf2430" },
  "Devices & Hardware":   { color: "#94a3b8", subtle: "#94a3b814", border: "#94a3b830" },
  "Commerce & Shopping":  { color: "#fb923c", subtle: "#fb923c14", border: "#fb923c30" },
  "Nature & Weather":     { color: "#4ade80", subtle: "#4ade8014", border: "#4ade8030" },
  "Food & Drink":         { color: "#f97316", subtle: "#f9731614", border: "#f9731630" },
  "Sports & Activities":  { color: "#facc15", subtle: "#facc1514", border: "#facc1530" },
  "Health & Medical":     { color: "#f87171", subtle: "#f8717114", border: "#f8717130" },
  "Tools & Technology":   { color: "#38bdf8", subtle: "#38bdf814", border: "#38bdf830" },
  "Layout & Data":        { color: "#818cf8", subtle: "#818cf814", border: "#818cf830" },
  "Misc & Symbols":       { color: "#a1a1aa", subtle: "#a1a1aa14", border: "#a1a1aa30" },
  "Logos & Brands":       { color: "#e2e8f0", subtle: "#e2e8f014", border: "#e2e8f030" },
};

// Logo icons (no -outline / -sharp variants)
const LOGOS = [
  "logo-alipay", "logo-amazon", "logo-amplify", "logo-android", "logo-angular",
  "logo-appflow", "logo-apple", "logo-apple-appstore", "logo-apple-ar",
  "logo-behance", "logo-bitbucket", "logo-bitcoin", "logo-buffer", "logo-capacitor",
  "logo-chrome", "logo-closed-captioning", "logo-codepen", "logo-css3",
  "logo-designernews", "logo-deviantart", "logo-discord", "logo-docker",
  "logo-dribbble", "logo-dropbox", "logo-edge", "logo-electron", "logo-euro",
  "logo-facebook", "logo-figma", "logo-firebase", "logo-firefox", "logo-flickr",
  "logo-foursquare", "logo-github", "logo-gitlab", "logo-google",
  "logo-google-playstore", "logo-hackernews", "logo-html5", "logo-instagram",
  "logo-ionic", "logo-ionitron", "logo-javascript", "logo-laravel", "logo-linkedin",
  "logo-markdown", "logo-mastodon", "logo-medium", "logo-microsoft",
  "logo-no-smoking", "logo-nodejs", "logo-npm", "logo-octocat", "logo-paypal",
  "logo-pinterest", "logo-playstation", "logo-pwa", "logo-python", "logo-react",
  "logo-reddit", "logo-rss", "logo-sass", "logo-skype", "logo-slack",
  "logo-snapchat", "logo-soundcloud", "logo-stackoverflow", "logo-steam",
  "logo-stencil", "logo-tableau", "logo-threads", "logo-tiktok", "logo-trapeze",
  "logo-tumblr", "logo-tux", "logo-twitch", "logo-twitter", "logo-usd",
  "logo-venmo", "logo-vercel", "logo-vimeo", "logo-vk", "logo-vue",
  "logo-web-component", "logo-wechat", "logo-whatsapp", "logo-windows",
  "logo-wordpress", "logo-x", "logo-xbox", "logo-xing", "logo-yahoo",
  "logo-yen", "logo-youtube",
];

// Deduplicate: some icons appear in multiple categories above — pick the first
const seen = new Set<string>();
export const IONICON_CATEGORIES: IoniconCategory[] = [
  ...Object.entries(RAW).map(([label, icons]) => {
    const deduped = icons.filter((ic) => {
      if (seen.has(ic)) return false;
      seen.add(ic);
      return true;
    });
    const style = CATEGORY_STYLES[label] ?? { color: "#a1a1aa", subtle: "#a1a1aa14", border: "#a1a1aa30" };
    return { label, ...style, icons: deduped };
  }).filter((c) => c.icons.length > 0),
  {
    label: "Logos & Brands",
    ...CATEGORY_STYLES["Logos & Brands"],
    icons: LOGOS,
  },
];

export const ALL_IONICONS: string[] = [
  ...IONICON_CATEGORIES.flatMap((c) => c.icons),
];

// API-ready format consumed by /api/v1/references/ionicons and the mobile app.
// Each icon string is lifted into a NormalizedItem so the generic renderer can
// display it via field config { primary: "name" }.
export const IONICON_GROUPS = IONICON_CATEGORIES.map((cat) => ({
  id: cat.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  label: cat.label,
  color: cat.color,
  subtle: cat.subtle,
  border: cat.border,
  items: cat.icons.map((name) => {
      const isLogo = cat.label === "Logos & Brands" || name === "ionicons";
      return {
        name,
        outline: isLogo ? undefined : `${name}-outline`,
        sharp: isLogo ? undefined : `${name}-sharp`,
      };
    }),
}));
