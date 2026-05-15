export interface MacosShortcut {
  command: string;
  syntax: string;
  description: string;
}

export interface MacosShortcutGroup {
  id: string;
  label: string;
  badge: string;
  color: string;
  subtle: string;
  border: string;
  commands: MacosShortcut[];
}

export const MACOS_SHORTCUT_GROUPS: MacosShortcutGroup[] = [
  {
    id: "finder",
    label: "Finder",
    badge: "Finder",
    color: "#60a5fa",
    subtle: "#60a5fa18",
    border: "#60a5fa33",
    commands: [
      {
        command: "⌘ ⇧ .",
        syntax: "Toggle hidden files",
        description:
          "Show or hide dotfiles and dotted directories in Finder windows and any open/save dialog. Toggles instantly without restarting Finder.",
      },
      {
        command: "⌘ ⇧ G",
        syntax: "Go to folder",
        description:
          "Open a path-entry sheet to jump to any folder. Accepts ~, /, environment-style paths, and offers tab completion.",
      },
      {
        command: "⌘ ⌥ V",
        syntax: "Move item here",
        description:
          "After ⌘C on a file, paste with ⌘⌥V instead of ⌘V to move (cut-and-paste) rather than duplicate. Mirrors what most file managers call cut/paste.",
      },
      {
        command: "⌘ ⌥ I",
        syntax: "Show Inspector",
        description:
          "Open the unified Inspector that updates live as the selection changes — unlike ⌘I, which spawns a separate window per item.",
      },
      {
        command: "⌘ Y",
        syntax: "Quick Look",
        description:
          "Preview the selected file in a floating window — same as pressing Space. Works for most file types via Quick Look generators.",
      },
      {
        command: "⌘ ⌥ Y",
        syntax: "Quick Look slideshow",
        description:
          "Start a full-screen slideshow of all selected items — useful for browsing a folder of images or PDFs without opening each one.",
      },
      {
        command: "⌘ ↑",
        syntax: "Open enclosing folder",
        description:
          "Navigate up one level to the parent folder in the current Finder window.",
      },
      {
        command: "⌘ ⇧ ⌫",
        syntax: "Empty Trash",
        description:
          "Empty the Trash with a confirmation dialog. Add ⌥ (⌘⌥⇧⌫) to skip the confirmation.",
      },
      {
        command: "⌘ ⇧ P",
        syntax: "Toggle path bar",
        description:
          "Show or hide the path bar at the bottom of the Finder window. Drag any segment to navigate, or ⌃-click for a path popup.",
      },
      {
        command: "⌘ /",
        syntax: "Toggle status bar",
        description:
          "Show or hide the status bar with item count and free disk space.",
      },
      {
        command: "⌘ J",
        syntax: "Show view options",
        description:
          "Open the per-folder view options panel: icon size, grid spacing, sort key, and whether to show hidden columns in list view.",
      },
    ],
  },
  {
    id: "screenshots",
    label: "Screenshots",
    badge: "Screenshots",
    color: "#fb923c",
    subtle: "#fb923c18",
    border: "#fb923c33",
    commands: [
      {
        command: "⌘ ⇧ 3",
        syntax: "Capture full screen",
        description:
          "Save a PNG of the entire display(s) to the desktop (or wherever the screenshot toolbar is configured to save).",
      },
      {
        command: "⌘ ⇧ 4",
        syntax: "Capture region",
        description:
          "Drag a crosshair to select a rectangle, release to save. Hold ⇧ to lock one axis, ⌥ to resize from center, ␣ to drag the selection.",
      },
      {
        command: "⌘ ⇧ 4 then ␣",
        syntax: "Capture window",
        description:
          "Press Space after ⌘⇧4 to switch to a camera cursor, then click any window to capture it with its drop shadow. ⌥-click to omit the shadow.",
      },
      {
        command: "⌘ ⇧ 5",
        syntax: "Screenshot toolbar",
        description:
          "Open the screenshot/screen-recording control bar with options for timer, save location, click visibility, and selected microphone.",
      },
      {
        command: "⌃ ⌘ ⇧ 3",
        syntax: "Copy full screen",
        description:
          "Add ⌃ to any screenshot shortcut to copy directly to the clipboard instead of writing a file to disk.",
      },
      {
        command: "⌃ ⌘ ⇧ 4",
        syntax: "Copy region",
        description:
          "Region selection that goes straight to the clipboard — handy for pasting into chat or a document without cleaning up files.",
      },
      {
        command: "⌘ ⇧ 6",
        syntax: "Capture Touch Bar",
        description:
          "On Macs with a Touch Bar, save an image of its current contents. No-op on other models.",
      },
    ],
  },
  {
    id: "spotlight",
    label: "Spotlight & input",
    badge: "Spotlight",
    color: "#c084fc",
    subtle: "#c084fc18",
    border: "#c084fc33",
    commands: [
      {
        command: "⌘ ␣",
        syntax: "Open Spotlight",
        description:
          "Open the Spotlight search bar. Type to search files, apps, definitions, calculations, conversions, and web suggestions.",
      },
      {
        command: "⌃ ⌘ ␣",
        syntax: "Character Viewer",
        description:
          "Open the Character Viewer (emoji and symbol picker) at the cursor. Searchable by name; recent picks appear at the top.",
      },
      {
        command: "⌥ ⌘ ␣",
        syntax: "Finder search",
        description:
          "Open a new Finder window pre-focused in Spotlight search mode — like ⌘⌥F from within Finder.",
      },
      {
        command: "⌃ ⌘ D",
        syntax: "Look up word",
        description:
          "Hover or select a word and press ⌃⌘D to pop up the system dictionary, thesaurus, and Wikipedia preview.",
      },
      {
        command: "fn fn",
        syntax: "Start dictation",
        description:
          "Press the fn (or 🌐 globe) key twice to start system dictation in any text field. Press fn again or click anywhere to stop.",
      },
    ],
  },
  {
    id: "windows",
    label: "Windows & spaces",
    badge: "Windows",
    color: "#22d3ee",
    subtle: "#22d3ee18",
    border: "#22d3ee33",
    commands: [
      {
        command: "⌘ M",
        syntax: "Minimize window",
        description:
          "Minimize the front window to the Dock. Add ⌥ (⌥⌘M) to minimize all windows of the front app.",
      },
      {
        command: "⌘ H",
        syntax: "Hide app",
        description:
          "Hide every window of the front app — faster than minimizing each. ⌥⌘H hides all other apps and leaves the front one visible.",
      },
      {
        command: "⌘ W",
        syntax: "Close window",
        description:
          "Close the front window. ⌥⌘W closes every window of the front app without quitting it.",
      },
      {
        command: "⌘ ⇥",
        syntax: "App switcher",
        description:
          "Hold ⌘ and tap ⇥ to cycle forward through running apps; ⌘⇧⇥ to cycle backward. Release ⌘ to switch.",
      },
      {
        command: "⌘ `",
        syntax: "Cycle windows of app",
        description:
          "Cycle between open windows of the current app (the backtick lives just above ⇥ on US layouts). ⌘⇧` reverses direction.",
      },
      {
        command: "⌃ ↑",
        syntax: "Mission Control",
        description:
          "Show every open window arranged across the screen, with Spaces along the top.",
      },
      {
        command: "⌃ ↓",
        syntax: "App Exposé",
        description:
          "Show every window of the current app side by side, with recently used files of that app along the bottom.",
      },
      {
        command: "⌃ ← / ⌃ →",
        syntax: "Switch Space",
        description:
          "Move one Space (or full-screen app) to the left or right.",
      },
      {
        command: "⌃ ⌘ F",
        syntax: "Toggle full screen",
        description:
          "Enter or exit full-screen mode for the front window — equivalent to clicking the green traffic-light button.",
      },
      {
        command: "F11 (fn F11)",
        syntax: "Show desktop",
        description:
          "Slide all windows off-screen to reveal the desktop; press again to restore. On laptops you usually need fn+F11 unless function keys are set as standard.",
      },
    ],
  },
  {
    id: "text",
    label: "Text editing",
    badge: "Text",
    color: "#34d399",
    subtle: "#34d39918",
    border: "#34d39933",
    commands: [
      {
        command: "⌃ A",
        syntax: "Beginning of line",
        description:
          "Move the cursor to the start of the current line. Works in nearly any macOS text field — these emacs bindings are baked into Cocoa.",
      },
      {
        command: "⌃ E",
        syntax: "End of line",
        description: "Move the cursor to the end of the current line.",
      },
      {
        command: "⌃ K",
        syntax: "Kill to end of line",
        description:
          "Delete from the cursor to the end of the line, copying the killed text into a system kill-ring.",
      },
      {
        command: "⌃ Y",
        syntax: "Yank killed text",
        description:
          "Paste the most recently killed text from ⌃K. Independent of the regular clipboard.",
      },
      {
        command: "⌃ T",
        syntax: "Transpose characters",
        description:
          "Swap the two characters on either side of the cursor — fixes typos like \"hte\" → \"the\" without selecting anything.",
      },
      {
        command: "⌃ D",
        syntax: "Forward delete",
        description:
          "Delete the character to the right of the cursor, like the Delete key on a full-size keyboard.",
      },
      {
        command: "⌃ O",
        syntax: "Open line",
        description:
          "Insert a newline after the cursor without moving the cursor — splits the current line in two while staying put.",
      },
      {
        command: "⌥ ⌫",
        syntax: "Delete previous word",
        description:
          "Delete the word to the left of the cursor in one stroke instead of one character at a time.",
      },
      {
        command: "fn ⌥ ⌫",
        syntax: "Delete next word",
        description:
          "Forward-delete by word — useful when the cursor sits before a typo'd word and you want to retype it.",
      },
      {
        command: "⌘ ⌫",
        syntax: "Delete to start of line",
        description:
          "Delete from the cursor to the beginning of the current line.",
      },
      {
        command: "⌥ ← / ⌥ →",
        syntax: "Move by word",
        description:
          "Move the cursor one word at a time. Add ⇧ to extend the selection word-by-word.",
      },
      {
        command: "⌘ ← / ⌘ →",
        syntax: "Move to line edge",
        description:
          "Move the cursor to the visual beginning/end of the line. Add ⇧ to select to that point.",
      },
      {
        command: "⌥ ↑ / ⌥ ↓",
        syntax: "Move by paragraph",
        description: "Move to the start of the previous or next paragraph.",
      },
      {
        command: "⌘ ; ",
        syntax: "Find next misspelled word",
        description:
          "Jump to the next misspelled word in the current document and show suggestions.",
      },
    ],
  },
  {
    id: "dock-focus",
    label: "Dock & focus",
    badge: "Dock",
    color: "#fbbf24",
    subtle: "#fbbf2418",
    border: "#fbbf2433",
    commands: [
      {
        command: "⌘ ⌥ D",
        syntax: "Toggle Dock",
        description:
          "Show or hide the Dock — useful for reclaiming a few pixels in full-screen-ish workflows without changing the auto-hide setting.",
      },
      {
        command: "⌥ click on Dock icon",
        syntax: "Switch and hide others",
        description:
          "Activate the clicked app and hide every other app at once.",
      },
      {
        command: "⌘ click on Dock icon",
        syntax: "Reveal in Finder",
        description:
          "Open a Finder window with the app's bundle (or document) selected.",
      },
      {
        command: "⌃ F2",
        syntax: "Focus menu bar",
        description:
          "Move keyboard focus to the menu bar. Use arrow keys to navigate, ⏎ to open, type to filter.",
      },
      {
        command: "⌃ F3",
        syntax: "Focus Dock",
        description:
          "Move keyboard focus to the Dock so you can launch apps without the trackpad.",
      },
      {
        command: "⌃ F4",
        syntax: "Cycle windows",
        description:
          "Move focus to the next window across all apps. ⌃⇧F4 cycles in reverse.",
      },
      {
        command: "⌃ F8",
        syntax: "Focus status menus",
        description:
          "Move focus to the right side of the menu bar (Wi-Fi, battery, Bluetooth, etc.).",
      },
    ],
  },
  {
    id: "accessibility",
    label: "Accessibility & display",
    badge: "Display",
    color: "#a78bfa",
    subtle: "#a78bfa18",
    border: "#a78bfa33",
    commands: [
      {
        command: "⌥ ⌘ 8",
        syntax: "Toggle zoom",
        description:
          "Turn the screen zoom feature on or off. Must be enabled once in System Settings → Accessibility → Zoom.",
      },
      {
        command: "⌥ ⌘ =",
        syntax: "Zoom in",
        description:
          "Zoom in incrementally when zoom is enabled. Hold to zoom continuously.",
      },
      {
        command: "⌥ ⌘ -",
        syntax: "Zoom out",
        description: "Zoom out incrementally when zoom is enabled.",
      },
      {
        command: "⌃ ⌥ ⌘ 8",
        syntax: "Invert colors",
        description:
          "Toggle classic invert colors on the entire display — different from Smart Invert in iOS; this affects everything including images.",
      },
      {
        command: "⌘ F5",
        syntax: "Toggle VoiceOver",
        description:
          "Turn macOS's built-in screen reader on or off. ⌘F5 again to dismiss.",
      },
      {
        command: "⌥ ⌘ F5",
        syntax: "Accessibility shortcuts",
        description:
          "Open a panel that toggles common accessibility features (zoom, VoiceOver, Sticky Keys, etc.) without diving into System Settings.",
      },
      {
        command: "⌥ ⇧ Brightness",
        syntax: "Fine brightness step",
        description:
          "Adjust display brightness in ¼-bar increments instead of the standard full-bar steps.",
      },
      {
        command: "⌥ ⇧ Volume",
        syntax: "Fine volume step",
        description:
          "Adjust system volume in ¼-bar increments instead of the standard full-bar steps. Same trick works on most function-row sliders.",
      },
      {
        command: "⇧ Volume",
        syntax: "Silent volume change",
        description:
          "Hold ⇧ while changing volume to suppress the click feedback sound.",
      },
    ],
  },
  {
    id: "power",
    label: "Power & sleep",
    badge: "Power",
    color: "#f87171",
    subtle: "#f8717118",
    border: "#f8717133",
    commands: [
      {
        command: "⌃ ⌘ Q",
        syntax: "Lock screen",
        description:
          "Lock the screen immediately and require the login password to return. The fastest way to step away from the keyboard.",
      },
      {
        command: "⌃ Power",
        syntax: "Sleep/Restart/Shut Down dialog",
        description:
          "Show the dialog with Restart, Sleep, and Shut Down buttons. Press R/S/⏎ for Restart, Esc to cancel.",
      },
      {
        command: "⌥ ⌘ Power",
        syntax: "Sleep Mac",
        description:
          "Put the entire Mac to sleep without prompting. On Macs with an eject key, ⌥⌘⏏ does the same.",
      },
      {
        command: "⌃ ⇧ Power",
        syntax: "Sleep displays",
        description:
          "Put just the displays to sleep while keeping the system running — useful for long downloads or builds.",
      },
      {
        command: "⌃ ⌘ Power",
        syntax: "Force restart",
        description:
          "Force the Mac to restart immediately without prompting open apps to save. Use only when something is wedged.",
      },
      {
        command: "⌃ ⌥ ⌘ Power",
        syntax: "Quit and shut down",
        description:
          "Quit all apps (giving them a chance to save) and shut down. Skips the confirmation dialog.",
      },
      {
        command: "⌘ ⌥ ⎋",
        syntax: "Force Quit dialog",
        description:
          "Open the Force Quit Applications window — the friendlier version of kill -9 for hung apps.",
      },
    ],
  },
  {
    id: "boot",
    label: "Startup",
    badge: "Startup",
    color: "#a1a1aa",
    subtle: "#a1a1aa18",
    border: "#a1a1aa33",
    commands: [
      {
        command: "Hold Power (Apple Silicon)",
        syntax: "Startup Options",
        description:
          "On Apple Silicon Macs, press and hold the power button at boot until \"Loading startup options\" appears. From here you can pick a startup disk, enter Recovery, or open Options.",
      },
      {
        command: "Hold ⌥ at boot (Intel)",
        syntax: "Startup Manager",
        description:
          "Choose a startup disk at boot — useful for booting a different macOS install, an external SSD, or Windows via Boot Camp.",
      },
      {
        command: "⌘ R at boot (Intel)",
        syntax: "Recovery",
        description:
          "Boot into macOS Recovery for Disk Utility, Reinstall macOS, Terminal, and Startup Security Utility.",
      },
      {
        command: "⌥ ⌘ R at boot (Intel)",
        syntax: "Internet Recovery",
        description:
          "Recovery booted from Apple's servers — used when the local Recovery partition is missing or to reinstall the macOS that originally shipped.",
      },
      {
        command: "⇧ at boot (Intel)",
        syntax: "Safe Mode",
        description:
          "Boot Safe Mode: fsck the startup disk, load only required kernel extensions, and skip login items. (On Apple Silicon, hold Power then ⇧-click Continue.)",
      },
      {
        command: "⌘ ⌥ P R at boot (Intel)",
        syntax: "Reset NVRAM",
        description:
          "Hold all four keys at boot until the Mac chimes a second time to reset NVRAM/PRAM (display, sound, time zone, startup disk).",
      },
      {
        command: "T at boot (Intel)",
        syntax: "Target Disk Mode",
        description:
          "Boot into Target Disk Mode so the Mac shows up as an external drive over Thunderbolt/USB-C. (On Apple Silicon use Share Disk from Startup Options instead.)",
      },
    ],
  },
];
