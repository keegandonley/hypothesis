export interface TmuxCommand {
  command: string;
  syntax: string;
  description: string;
}

export interface TmuxCommandGroup {
  id: string;
  label: string;
  badge: string;
  color: string;
  subtle: string;
  border: string;
  commands: TmuxCommand[];
}

export const TMUX_GROUPS: TmuxCommandGroup[] = [
  {
    id: "sessions-key",
    label: "Sessions",
    badge: "Sessions",
    color: "#60a5fa",
    subtle: "#60a5fa18",
    border: "#60a5fa33",
    commands: [
      {
        command: "C-b d",
        syntax: "detach-client",
        description:
          "Detach the current client from its session. The session keeps running in the background; reattach later with `tmux attach`.",
      },
      {
        command: "C-b D",
        syntax: "choose-client",
        description:
          "Open an interactive picker of all clients attached to the server, then detach the chosen one.",
      },
      {
        command: "C-b s",
        syntax: "choose-tree -Zs",
        description:
          "Open an interactive tree of all sessions (with their windows expanded) to switch to. -Z zooms the picker pane.",
      },
      {
        command: "C-b $",
        syntax: 'command-prompt -I "#S" "rename-session -- \'%%\'"',
        description:
          "Prompt for a new name for the current session, pre-filled with the existing name.",
      },
      {
        command: "C-b (",
        syntax: "switch-client -p",
        description: "Switch the attached client to the previous session.",
      },
      {
        command: "C-b )",
        syntax: "switch-client -n",
        description: "Switch the attached client to the next session.",
      },
      {
        command: "C-b L",
        syntax: "switch-client -l",
        description:
          "Switch the attached client to the last (most recently used) session.",
      },
      {
        command: "C-b C-z",
        syntax: "suspend-client",
        description:
          "Suspend the tmux client itself (sends SIGTSTP). Resume with `fg` in the parent shell.",
      },
    ],
  },
  {
    id: "windows-key",
    label: "Windows",
    badge: "Windows",
    color: "#34d399",
    subtle: "#34d39918",
    border: "#34d39933",
    commands: [
      {
        command: "C-b c",
        syntax: "new-window",
        description:
          "Create a new window in the current session, with the user's default shell.",
      },
      {
        command: "C-b ,",
        syntax: 'command-prompt -I "#W" "rename-window -- \'%%\'"',
        description:
          "Prompt for a new name for the current window, pre-filled with the existing name.",
      },
      {
        command: "C-b &",
        syntax: 'confirm-before -p "kill-window #W? (y/n)" kill-window',
        description:
          "Kill the current window (and every pane in it) after a y/n confirmation.",
      },
      {
        command: "C-b w",
        syntax: "choose-tree -Zw",
        description:
          "Open an interactive tree of windows across all sessions to switch to.",
      },
      {
        command: "C-b f",
        syntax: "command-prompt \"find-window -Z -- '%%'\"",
        description:
          "Prompt for a string, then jump to the window whose name, title, or visible content contains it.",
      },
      {
        command: "C-b n",
        syntax: "next-window",
        description: "Move to the next window in the session.",
      },
      {
        command: "C-b p",
        syntax: "previous-window",
        description: "Move to the previous window in the session.",
      },
      {
        command: "C-b l",
        syntax: "last-window",
        description: "Toggle back to the most recently active window.",
      },
      {
        command: "C-b 0 … 9",
        syntax: "select-window -t :=N",
        description: "Jump directly to window N (by index).",
      },
      {
        command: "C-b '",
        syntax: "command-prompt -p index \"select-window -t ':%%'\"",
        description:
          "Prompt for a window index (useful when you have more than 10 windows).",
      },
      {
        command: "C-b .",
        syntax: "command-prompt \"move-window -t '%%'\"",
        description:
          "Prompt for a new index and move the current window to it.",
      },
      {
        command: "C-b M-n",
        syntax: "next-window -a",
        description:
          "Move to the next window with activity (bell, content, or silence flagged).",
      },
      {
        command: "C-b M-p",
        syntax: "previous-window -a",
        description: "Move to the previous window with activity.",
      },
      {
        command: "C-b i",
        syntax: "display-message",
        description:
          "Show a short info message in the status line — by default, details about the current window.",
      },
    ],
  },
  {
    id: "panes-key",
    label: "Panes",
    badge: "Panes",
    color: "#fbbf24",
    subtle: "#fbbf2418",
    border: "#fbbf2433",
    commands: [
      {
        command: "C-b %",
        syntax: "split-window -h",
        description:
          "Split the current pane horizontally — the new pane opens to the right.",
      },
      {
        command: 'C-b "',
        syntax: "split-window",
        description:
          "Split the current pane vertically — the new pane opens below.",
      },
      {
        command: "C-b ↑ ↓ ← →",
        syntax: "select-pane -U/-D/-L/-R",
        description:
          "Move focus to the pane in the given direction relative to the current one.",
      },
      {
        command: "C-b o",
        syntax: "select-pane -t :.+",
        description: "Cycle focus to the next pane in the current window.",
      },
      {
        command: "C-b ;",
        syntax: "last-pane",
        description: "Toggle back to the most recently active pane.",
      },
      {
        command: "C-b q",
        syntax: "display-panes",
        description:
          "Briefly overlay each pane with its number — press the number to jump to that pane.",
      },
      {
        command: "C-b x",
        syntax: 'confirm-before -p "kill-pane #P? (y/n)" kill-pane',
        description: "Kill the current pane after a y/n confirmation.",
      },
      {
        command: "C-b z",
        syntax: "resize-pane -Z",
        description:
          "Toggle zoom: temporarily expand the current pane to fill the entire window. Press again to restore.",
      },
      {
        command: "C-b !",
        syntax: "break-pane",
        description:
          "Move the current pane out of its window into a new window of its own.",
      },
      {
        command: "C-b {",
        syntax: "swap-pane -U",
        description:
          "Swap the current pane with the previous one in the window's pane list.",
      },
      {
        command: "C-b }",
        syntax: "swap-pane -D",
        description:
          "Swap the current pane with the next one in the window's pane list.",
      },
      {
        command: "C-b C-o",
        syntax: "rotate-window",
        description:
          "Rotate every pane in the current window forward through its positions.",
      },
      {
        command: "C-b M-o",
        syntax: "rotate-window -D",
        description: "Rotate every pane in the current window backward.",
      },
      {
        command: "C-b m",
        syntax: "select-pane -m",
        description:
          "Mark the current pane (sets it as the target for commands like `join-pane`).",
      },
      {
        command: "C-b M",
        syntax: "select-pane -M",
        description: "Clear the marked pane.",
      },
      {
        command: "C-b t",
        syntax: "clock-mode",
        description:
          "Show a large clock in the current pane until any key is pressed.",
      },
    ],
  },
  {
    id: "layout-key",
    label: "Layouts & resize",
    badge: "Layouts",
    color: "#fb923c",
    subtle: "#fb923c18",
    border: "#fb923c33",
    commands: [
      {
        command: "C-b Space",
        syntax: "next-layout",
        description:
          "Cycle the current window through the five preset layouts (even-horizontal, even-vertical, main-horizontal, main-vertical, tiled).",
      },
      {
        command: "C-b M-1",
        syntax: "select-layout even-horizontal",
        description:
          "Apply the even-horizontal layout (panes stacked side-by-side).",
      },
      {
        command: "C-b M-2",
        syntax: "select-layout even-vertical",
        description:
          "Apply the even-vertical layout (panes stacked top-to-bottom).",
      },
      {
        command: "C-b M-3",
        syntax: "select-layout main-horizontal",
        description:
          "Apply main-horizontal: one large pane on top, smaller panes below.",
      },
      {
        command: "C-b M-4",
        syntax: "select-layout main-vertical",
        description:
          "Apply main-vertical: one large pane on the left, smaller panes on the right.",
      },
      {
        command: "C-b M-5",
        syntax: "select-layout tiled",
        description: "Apply the tiled layout (panes arranged in a grid).",
      },
      {
        command: "C-b E",
        syntax: "select-layout -E",
        description:
          "Spread the current pane and its neighbors evenly within their parent split.",
      },
      {
        command: "C-b M-↑",
        syntax: "resize-pane -U 5",
        description: "Resize the current pane upward by 5 lines.",
      },
      {
        command: "C-b M-↓",
        syntax: "resize-pane -D 5",
        description: "Resize the current pane downward by 5 lines.",
      },
      {
        command: "C-b M-←",
        syntax: "resize-pane -L 5",
        description: "Resize the current pane leftward by 5 columns.",
      },
      {
        command: "C-b M-→",
        syntax: "resize-pane -R 5",
        description: "Resize the current pane rightward by 5 columns.",
      },
      {
        command: "C-b C-↑",
        syntax: "resize-pane -U",
        description:
          "Resize the current pane upward by 1 line. Repeatable while the prefix repeat-timer is active.",
      },
      {
        command: "C-b C-↓",
        syntax: "resize-pane -D",
        description: "Resize the current pane downward by 1 line (repeatable).",
      },
      {
        command: "C-b C-←",
        syntax: "resize-pane -L",
        description:
          "Resize the current pane leftward by 1 column (repeatable).",
      },
      {
        command: "C-b C-→",
        syntax: "resize-pane -R",
        description:
          "Resize the current pane rightward by 1 column (repeatable).",
      },
    ],
  },
  {
    id: "copy-key",
    label: "Copy & paste",
    badge: "Copy",
    color: "#c084fc",
    subtle: "#c084fc18",
    border: "#c084fc33",
    commands: [
      {
        command: "C-b [",
        syntax: "copy-mode",
        description:
          "Enter copy mode — scroll the pane's history and select text to copy.",
      },
      {
        command: "C-b PgUp",
        syntax: "copy-mode -u",
        description: "Enter copy mode and immediately scroll up one page.",
      },
      {
        command: "C-b ]",
        syntax: "paste-buffer",
        description: "Paste the contents of the most recent paste buffer.",
      },
      {
        command: "C-b #",
        syntax: "list-buffers",
        description: "List every paste buffer currently held by the server.",
      },
      {
        command: "C-b =",
        syntax: "choose-buffer -Z",
        description: "Open an interactive picker of paste buffers.",
      },
      {
        command: "C-b -",
        syntax: "delete-buffer",
        description: "Delete the most recent paste buffer.",
      },
      {
        command: "Space (in copy mode)",
        syntax: "send -X begin-selection",
        description:
          "emacs mode: start a selection at the cursor. vi mode users press `v` instead.",
      },
      {
        command: "Enter (in copy mode)",
        syntax: "send -X copy-selection-and-cancel",
        description:
          "emacs mode: copy the active selection to the buffer and leave copy mode. vi mode users press `y`.",
      },
      {
        command: "v (vi copy mode)",
        syntax: "send -X begin-selection",
        description: "vi copy mode: start a selection at the cursor.",
      },
      {
        command: "V (vi copy mode)",
        syntax: "send -X select-line",
        description: "vi copy mode: extend the selection to whole lines.",
      },
      {
        command: "y (vi copy mode)",
        syntax: "send -X copy-selection-and-cancel",
        description: "vi copy mode: copy the selection and leave copy mode.",
      },
      {
        command: "q (in copy mode)",
        syntax: "send -X cancel",
        description: "Leave copy mode without copying.",
      },
      {
        command: "/ (in copy mode)",
        syntax: "send -X search-forward",
        description: "Search forward through the pane history.",
      },
      {
        command: "? (in copy mode)",
        syntax: "send -X search-backward",
        description: "Search backward through the pane history.",
      },
      {
        command: "n (in copy mode)",
        syntax: "send -X search-again",
        description: "Repeat the previous search in the same direction.",
      },
      {
        command: "N (in copy mode)",
        syntax: "send -X search-reverse",
        description: "Repeat the previous search in the opposite direction.",
      },
    ],
  },
  {
    id: "misc-key",
    label: "Misc",
    badge: "Misc",
    color: "#a1a1aa",
    subtle: "#a1a1aa18",
    border: "#a1a1aa33",
    commands: [
      {
        command: "C-b ?",
        syntax: "list-keys",
        description:
          "List every key binding tmux knows about, in a scrollable pane.",
      },
      {
        command: "C-b :",
        syntax: "command-prompt",
        description:
          "Open the command prompt at the bottom of the screen for one-off tmux commands.",
      },
      {
        command: "C-b r",
        syntax: "refresh-client",
        description:
          "Force-refresh the current client (redraw the screen and re-evaluate the status line).",
      },
      {
        command: "C-b ~",
        syntax: "show-messages",
        description: "Show the most recent status-line messages.",
      },
      {
        command: "C-b C-b",
        syntax: "send-prefix",
        description:
          "Send a literal C-b through to the running program — needed when an app inside tmux uses the same key.",
      },
    ],
  },
  {
    id: "cli",
    label: "CLI subcommands",
    badge: "CLI",
    color: "#22d3ee",
    subtle: "#22d3ee18",
    border: "#22d3ee33",
    commands: [
      {
        command: "tmux",
        syntax:
          "tmux [-2CDluvV] [-c shell-command] [-f file] [-L socket-name] [-S socket-path] [-T features] [command [flags]]",
        description:
          "Run tmux. With no command, starts a new server (if needed) and creates a new session.",
      },
      {
        command: "tmux new",
        syntax:
          "tmux new-session [-AdDEPX] [-c start-directory] [-F format] [-n window-name] [-s session-name] [-x width] [-y height] [shell-command]",
        description:
          "Create a new session. -d starts detached; -A attaches to an existing session of the same name (or creates it); -s names the session.",
      },
      {
        command: "tmux attach",
        syntax:
          "tmux attach-session [-dErx] [-c working-directory] [-f flags] [-t target-session]",
        description:
          "Attach to an existing session. -d detaches every other client first; -t selects a specific session by name.",
      },
      {
        command: "tmux ls",
        syntax: "tmux list-sessions [-F format] [-f filter]",
        description: "List every session on the server, one per line.",
      },
      {
        command: "tmux kill-session",
        syntax: "tmux kill-session [-aC] [-t target-session]",
        description:
          "Destroy a session and every window inside it. -a kills all sessions except the target.",
      },
      {
        command: "tmux kill-server",
        syntax: "tmux kill-server",
        description:
          "Shut down the tmux server entirely — every session, window, and pane is destroyed.",
      },
      {
        command: "tmux has-session",
        syntax: "tmux has-session [-t target-session]",
        description:
          "Exit 0 if the session exists, non-zero otherwise. Useful in scripts as a guard before attach/new.",
      },
      {
        command: "tmux switch-client",
        syntax:
          "tmux switch-client [-ElnprZ] [-c target-client] [-t target-session] [-T key-table]",
        description:
          "Switch the given client to a different session (or session/window/pane).",
      },
      {
        command: "tmux detach",
        syntax:
          "tmux detach-client [-aP] [-E shell-command] [-s target-session] [-t target-client]",
        description:
          "Detach a client from its session (the session keeps running).",
      },
      {
        command: "tmux new-window",
        syntax:
          "tmux new-window [-abdkPS] [-c start-directory] [-e env] [-F format] [-n window-name] [-t target-window] [shell-command]",
        description:
          "Create a new window in the target session. -a inserts after the current window; -d creates without switching.",
      },
      {
        command: "tmux kill-window",
        syntax: "tmux kill-window [-a] [-t target-window]",
        description:
          "Kill a window and every pane in it. -a kills all windows except the target.",
      },
      {
        command: "tmux rename-window",
        syntax: "tmux rename-window [-t target-window] new-name",
        description: "Rename a window.",
      },
      {
        command: "tmux split-window",
        syntax:
          "tmux split-window [-bdfhIvPZ] [-c start-directory] [-e env] [-l size] [-t target-pane] [shell-command]",
        description:
          "Split a pane into two. -h for horizontal (side-by-side), -v for vertical (top-bottom). -l sets the new pane's size.",
      },
      {
        command: "tmux select-pane",
        syntax: "tmux select-pane [-DdegLlMmRUZ] [-T title] [-t target-pane]",
        description:
          "Activate a different pane. -L/-R/-U/-D move by direction; -t targets a specific pane.",
      },
      {
        command: "tmux resize-pane",
        syntax:
          "tmux resize-pane [-DLMRTUZ] [-t target-pane] [-x width] [-y height] [adjustment]",
        description:
          "Resize a pane. Direction flags (-D/-L/-R/-U) plus an optional adjustment; -Z toggles zoom.",
      },
      {
        command: "tmux kill-pane",
        syntax: "tmux kill-pane [-a] [-t target-pane]",
        description:
          "Kill a pane. -a kills every pane in the window except the target.",
      },
      {
        command: "tmux send-keys",
        syntax:
          "tmux send-keys [-FHKlMRX] [-N repeat-count] [-t target-pane] key ...",
        description:
          "Send one or more keys to a pane as if typed. -l sends them literally (no key-name lookup).",
      },
      {
        command: "tmux capture-pane",
        syntax:
          "tmux capture-pane [-aepPqCJN] [-b buffer-name] [-E end-line] [-S start-line] [-t target-pane]",
        description:
          "Capture a pane's contents into a buffer. -p prints to stdout; -S/-E pick a history range.",
      },
      {
        command: "tmux pipe-pane",
        syntax: "tmux pipe-pane [-IOo] [-t target-pane] [shell-command]",
        description:
          "Pipe a pane's output to a shell command for live logging. Calling again with no command stops piping.",
      },
      {
        command: "tmux display-message",
        syntax:
          "tmux display-message [-aIlNpv] [-c target-client] [-d delay] [-t target-pane] [message]",
        description:
          "Show a status-line message (or print one with -p). Format placeholders like #{session_name} are expanded.",
      },
      {
        command: "tmux list-keys",
        syntax: "tmux list-keys [-1aN] [-P prefix-string] [-T key-table] [key]",
        description:
          "List every key binding, optionally filtered by key-table.",
      },
      {
        command: "tmux list-commands",
        syntax: "tmux list-commands [-F format] [command]",
        description: "List every tmux command (or describe a single one).",
      },
      {
        command: "tmux list-windows",
        syntax:
          "tmux list-windows [-aF format] [-f filter] [-t target-session]",
        description: "List windows in a session (-a for every session).",
      },
      {
        command: "tmux list-panes",
        syntax: "tmux list-panes [-as] [-F format] [-f filter] [-t target]",
        description:
          "List panes in a window, session (-s), or every session (-a).",
      },
      {
        command: "tmux set-option",
        syntax: "tmux set-option [-aFgopqsuUw] [-t target-pane] option [value]",
        description:
          "Set a tmux option. -g for server-global, -w for window-level, -p for pane-level. -u unsets.",
      },
      {
        command: "tmux show-options",
        syntax: "tmux show-options [-AgHpqsvw] [-t target-pane] [option]",
        description:
          "Show one or all options. Pairs with set-option's -g/-w/-p scopes.",
      },
      {
        command: "tmux bind-key",
        syntax:
          "tmux bind-key [-nr] [-N note] [-T key-table] key command [arguments]",
        description:
          "Bind a key to a tmux command. -n binds without the prefix; -r marks the binding as repeatable.",
      },
      {
        command: "tmux unbind-key",
        syntax: "tmux unbind-key [-anq] [-T key-table] key",
        description:
          "Remove a key binding. -a removes every binding in the table.",
      },
      {
        command: "tmux source-file",
        syntax: "tmux source-file [-Fnqv] path ...",
        description:
          "Execute the commands in a file — typically used to reload ~/.tmux.conf after editing.",
      },
      {
        command: "tmux choose-tree",
        syntax:
          "tmux choose-tree [-GNrswZ] [-F format] [-f filter] [-K key-format] [-O sort-order] [-t target-pane] [template]",
        description:
          "Open the interactive session/window picker in a pane (the same one that C-b s and C-b w use).",
      },
      {
        command: "tmux start-server",
        syntax: "tmux start-server",
        description:
          "Start the tmux server without creating any sessions. Useful in scripts that will then attach.",
      },
    ],
  },
];
