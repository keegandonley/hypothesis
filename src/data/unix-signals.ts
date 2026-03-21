export interface UnixSignal {
  number: number;
  name: string;
  description: string;
  catchable: boolean;
}

export interface SignalGroup {
  action: string;
  label: string;
  color: string;
  subtle: string;
  border: string;
  signals: UnixSignal[];
}

export const SIGNAL_GROUPS: SignalGroup[] = [
  {
    action: "terminate",
    label: "Terminate",
    color: "#f87171",
    subtle: "#f8717118",
    border: "#f8717133",
    signals: [
      {
        number: 1,
        name: "SIGHUP",
        description:
          "Hangup. Sent when the controlling terminal is closed or the session leader exits. Daemons reload config on SIGHUP by convention.",
        catchable: true,
      },
      {
        number: 2,
        name: "SIGINT",
        description:
          "Interrupt. Sent by Ctrl+C. Requests graceful termination of the foreground process.",
        catchable: true,
      },
      {
        number: 13,
        name: "SIGPIPE",
        description:
          "Broken pipe. Sent when a process writes to a pipe or socket with no readers. Default is to terminate silently.",
        catchable: true,
      },
      {
        number: 14,
        name: "SIGALRM",
        description:
          "Alarm clock. Sent when a timer set by alarm(2) or setitimer(2) expires. Used to implement timeouts.",
        catchable: true,
      },
      {
        number: 15,
        name: "SIGTERM",
        description:
          "Terminate. The standard polite shutdown request. Catchable — programs should clean up and exit gracefully.",
        catchable: true,
      },
      {
        number: 10,
        name: "SIGUSR1",
        description:
          "User-defined signal 1. No default meaning — applications define their own behavior (e.g., log rotation, reload).",
        catchable: true,
      },
      {
        number: 12,
        name: "SIGUSR2",
        description:
          "User-defined signal 2. Companion to SIGUSR1 for applications that need two custom signal types.",
        catchable: true,
      },
      {
        number: 26,
        name: "SIGVTALRM",
        description:
          "Virtual timer alarm. Sent when the virtual (user-mode CPU time) timer expires. Used for profiling.",
        catchable: true,
      },
      {
        number: 27,
        name: "SIGPROF",
        description:
          "Profiling timer. Sent when the profiling interval timer expires (counts both user and system time).",
        catchable: true,
      },
      {
        number: 29,
        name: "SIGIO",
        description:
          "Async I/O event. Sent when a file descriptor is ready for I/O, if the process has requested async notification.",
        catchable: true,
      },
      {
        number: 30,
        name: "SIGPWR",
        description:
          "Power failure. Sent by init when the system detects a power failure or battery low condition. Linux-specific.",
        catchable: true,
      },
    ],
  },
  {
    action: "core",
    label: "Core Dump",
    color: "#fb923c",
    subtle: "#fb923c18",
    border: "#fb923c33",
    signals: [
      {
        number: 3,
        name: "SIGQUIT",
        description:
          "Quit. Sent by Ctrl+\\. Like SIGINT but also produces a core dump for post-mortem debugging.",
        catchable: true,
      },
      {
        number: 4,
        name: "SIGILL",
        description:
          "Illegal instruction. Sent when the CPU encounters an invalid or privileged instruction. Usually a bug or corrupted binary.",
        catchable: true,
      },
      {
        number: 5,
        name: "SIGTRAP",
        description:
          "Trace/breakpoint trap. Used by debuggers to intercept execution at breakpoints or after single-step instructions.",
        catchable: true,
      },
      {
        number: 6,
        name: "SIGABRT",
        description:
          "Abort. Sent by abort(3) to terminate abnormally. Triggered by failed assert() calls and detected internal errors.",
        catchable: true,
      },
      {
        number: 7,
        name: "SIGBUS",
        description:
          "Bus error. Sent on memory access alignment errors or accessing memory outside a mapped region (e.g., past end of mmap).",
        catchable: true,
      },
      {
        number: 8,
        name: "SIGFPE",
        description:
          "Floating-point exception. Sent on arithmetic errors: integer divide-by-zero, overflow, invalid operation.",
        catchable: true,
      },
      {
        number: 9,
        name: "SIGKILL",
        description:
          "Kill. Unconditional, immediate termination. Cannot be caught, blocked, or ignored. No cleanup possible.",
        catchable: false,
      },
      {
        number: 11,
        name: "SIGSEGV",
        description:
          "Segmentation fault. Sent on invalid memory access: null pointer dereference, out-of-bounds write, use-after-free.",
        catchable: true,
      },
      {
        number: 24,
        name: "SIGXCPU",
        description:
          "CPU time limit exceeded. Sent when a process exceeds its soft CPU time limit set by setrlimit(RLIMIT_CPU).",
        catchable: true,
      },
      {
        number: 25,
        name: "SIGXFSZ",
        description:
          "File size limit exceeded. Sent when a process tries to grow a file beyond the RLIMIT_FSIZE limit.",
        catchable: true,
      },
      {
        number: 31,
        name: "SIGSYS",
        description:
          "Bad system call. Sent when a process makes an invalid syscall or passes an invalid argument to a syscall.",
        catchable: true,
      },
    ],
  },
  {
    action: "stop",
    label: "Stop",
    color: "#fbbf24",
    subtle: "#fbbf2418",
    border: "#fbbf2433",
    signals: [
      {
        number: 19,
        name: "SIGSTOP",
        description:
          "Stop process. Pauses execution unconditionally. Cannot be caught, blocked, or ignored. Resume with SIGCONT.",
        catchable: false,
      },
      {
        number: 20,
        name: "SIGTSTP",
        description:
          "Terminal stop. Sent by Ctrl+Z. Like SIGSTOP but catchable — programs can do cleanup before stopping.",
        catchable: true,
      },
      {
        number: 21,
        name: "SIGTTIN",
        description:
          "Background read. Sent to a background process that tries to read from the controlling terminal.",
        catchable: true,
      },
      {
        number: 22,
        name: "SIGTTOU",
        description:
          "Background write. Sent to a background process that tries to write to the controlling terminal.",
        catchable: true,
      },
    ],
  },
  {
    action: "continue",
    label: "Continue",
    color: "#34d399",
    subtle: "#34d39918",
    border: "#34d39933",
    signals: [
      {
        number: 18,
        name: "SIGCONT",
        description:
          "Continue. Resumes a stopped process. Sent by the shell when you run fg or bg. Cannot be ignored while stopped.",
        catchable: true,
      },
    ],
  },
  {
    action: "ignore",
    label: "Ignore",
    color: "#60a5fa",
    subtle: "#60a5fa18",
    border: "#60a5fa33",
    signals: [
      {
        number: 17,
        name: "SIGCHLD",
        description:
          "Child state change. Sent to a parent when a child process stops, continues, or terminates. Used by shells to track jobs.",
        catchable: true,
      },
      {
        number: 23,
        name: "SIGURG",
        description:
          "Urgent data. Sent when out-of-band data arrives on a socket (TCP URG flag). Rarely used in practice.",
        catchable: true,
      },
      {
        number: 28,
        name: "SIGWINCH",
        description:
          "Window resize. Sent when the terminal window size changes. TUI apps (vim, tmux) use this to redraw the screen.",
        catchable: true,
      },
    ],
  },
];
