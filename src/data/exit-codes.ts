export interface ExitCode {
  code: string;
  name: string;
  description: string;
  notes?: string;
}

export interface ExitCodeGroup {
  id: string;
  label: string;
  color: string;
  subtle: string;
  border: string;
  codes: ExitCode[];
}

export const EXIT_CODE_GROUPS: ExitCodeGroup[] = [
  {
    id: "success",
    label: "Success",
    color: "#34d399",
    subtle: "#34d39918",
    border: "#34d39933",
    codes: [
      {
        code: "0",
        name: "Success",
        description: "The command completed successfully with no errors.",
      },
    ],
  },
  {
    id: "general",
    label: "General Errors",
    color: "#f87171",
    subtle: "#f8717118",
    border: "#f8717133",
    codes: [
      {
        code: "1",
        name: "General error",
        description: "Catchall for general errors. Often used by programs to signal any non-specific failure.",
        notes: "Meaning varies by program.",
      },
      {
        code: "2",
        name: "Misuse of shell builtin",
        description: "Incorrect usage of a shell builtin command or invalid arguments passed to one.",
        notes: "Defined by Bash.",
      },
    ],
  },
  {
    id: "shell",
    label: "Shell Errors",
    color: "#fbbf24",
    subtle: "#fbbf2418",
    border: "#fbbf2433",
    codes: [
      {
        code: "126",
        name: "Command not executable",
        description: "The command was found but could not be executed — typically a missing execute permission.",
        notes: "Permission denied.",
      },
      {
        code: "127",
        name: "Command not found",
        description: "The command could not be found in PATH. Usually a typo or a missing installation.",
        notes: "\"command not found\" error.",
      },
      {
        code: "128",
        name: "Invalid exit argument",
        description: "A script called exit with an invalid argument (non-integer, or out of 0–255 range).",
      },
    ],
  },
  {
    id: "signal",
    label: "Signal Offsets (128+N)",
    color: "#c084fc",
    subtle: "#c084fc18",
    border: "#c084fc33",
    codes: [
      {
        code: "129",
        name: "SIGHUP (128+1)",
        description: "Process received SIGHUP — hangup detected on controlling terminal, or controlling process died.",
      },
      {
        code: "130",
        name: "SIGINT (128+2)",
        description: "Process interrupted by Ctrl+C in the terminal.",
      },
      {
        code: "131",
        name: "SIGQUIT (128+3)",
        description: "Process received SIGQUIT (Ctrl+\\). Typically produces a core dump.",
      },
      {
        code: "134",
        name: "SIGABRT (128+6)",
        description: "Process aborted — usually triggered by a failed assertion (assert()) in C/C++ code.",
      },
      {
        code: "137",
        name: "SIGKILL (128+9)",
        description: "Process was killed unconditionally. Cannot be caught or ignored. Often caused by the OOM killer.",
      },
      {
        code: "139",
        name: "SIGSEGV (128+11)",
        description: "Segmentation fault — the process accessed memory it was not allowed to access.",
      },
      {
        code: "141",
        name: "SIGPIPE (128+13)",
        description: "Broken pipe — the process tried to write to a pipe or socket with no reader.",
      },
      {
        code: "143",
        name: "SIGTERM (128+15)",
        description: "Process was gracefully terminated via SIGTERM. The default signal sent by kill.",
      },
    ],
  },
];
