export interface PsqlCommand {
  command: string;
  syntax: string;
  description: string;
}

export interface PsqlCommandGroup {
  id: string;
  label: string;
  badge: string;
  color: string;
  subtle: string;
  border: string;
  commands: PsqlCommand[];
}

export const PSQL_COMMAND_GROUPS: PsqlCommandGroup[] = [
  {
    id: "general",
    label: "General",
    badge: "General",
    color: "#60a5fa",
    subtle: "#60a5fa18",
    border: "#60a5fa33",
    commands: [
      {
        command: "\\copyright",
        syntax: "\\copyright",
        description: "Show PostgreSQL usage and distribution terms.",
      },
      {
        command: "\\crosstabview",
        syntax: "\\crosstabview [colV [colH [colD [sortcolH]]]]",
        description:
          "Execute the current query buffer and display the result as a crosstab grid with column headers from one column and row values from another.",
      },
      {
        command: "\\errverbose",
        syntax: "\\errverbose",
        description:
          "Repeat the most recent server error message at the maximum verbosity, as if VERBOSITY was set to verbose and SHOW_CONTEXT to always.",
      },
      {
        command: "\\g",
        syntax: "\\g [(option=value [...])] [filename | |command]",
        description:
          "Send the current query buffer to the server. Optionally write results to a file or pipe them to a shell command. Per-call \\pset options can be passed in parentheses.",
      },
      {
        command: "\\gdesc",
        syntax: "\\gdesc",
        description:
          "Show the column names and types that the current query would produce, without executing it.",
      },
      {
        command: "\\getenv",
        syntax: "\\getenv psql_var env_var",
        description:
          "Fetch the value of an environment variable into a psql variable.",
      },
      {
        command: "\\gexec",
        syntax: "\\gexec",
        description:
          "Execute the current query, then send each cell of the result back to the server as a query. Useful for dynamic SQL generation.",
      },
      {
        command: "\\gset",
        syntax: "\\gset [prefix]",
        description:
          "Execute the current query and store the result columns into psql variables, optionally prefixed.",
      },
      {
        command: "\\gx",
        syntax: "\\gx [(option=value [...])] [filename | |command]",
        description:
          "Equivalent to \\g but forces expanded output mode for this one query.",
      },
      {
        command: "\\q",
        syntax: "\\q",
        description: "Quit psql. Ctrl+D at an empty prompt does the same.",
      },
      {
        command: "\\watch",
        syntax: "\\watch [[i=]seconds] [c=count] [m=min_rows]",
        description:
          "Re-execute the current query buffer on a fixed interval until interrupted. Optional count limits iterations; min_rows stops when fewer rows are returned.",
      },
    ],
  },
  {
    id: "help",
    label: "Help",
    badge: "Help",
    color: "#a1a1aa",
    subtle: "#a1a1aa18",
    border: "#a1a1aa33",
    commands: [
      {
        command: "\\?",
        syntax: "\\? [commands | options | variables]",
        description:
          "Show help. With no argument, list backslash commands. Use options for command-line flags or variables for psql special variables.",
      },
      {
        command: "\\h",
        syntax: "\\h [NAME]",
        description:
          "Show syntax help for a SQL command. With no argument, lists all SQL commands.",
      },
    ],
  },
  {
    id: "buffer",
    label: "Query Buffer",
    badge: "Query Buffer",
    color: "#34d399",
    subtle: "#34d39918",
    border: "#34d39933",
    commands: [
      {
        command: "\\e",
        syntax: "\\e [FILE] [LINE]",
        description:
          "Open the query buffer (or an external file) in $EDITOR. After editing, the buffer is re-loaded but not executed until you submit it.",
      },
      {
        command: "\\ef",
        syntax: "\\ef [FUNCNAME [LINE]]",
        description:
          "Edit a function definition in $EDITOR. With no name, opens a CREATE FUNCTION template.",
      },
      {
        command: "\\ev",
        syntax: "\\ev [VIEWNAME [LINE]]",
        description:
          "Edit a view definition in $EDITOR. With no name, opens a CREATE VIEW template.",
      },
      {
        command: "\\p",
        syntax: "\\p",
        description: "Print the current contents of the query buffer.",
      },
      {
        command: "\\r",
        syntax: "\\r",
        description: "Reset (clear) the query buffer.",
      },
      {
        command: "\\s",
        syntax: "\\s [FILE]",
        description:
          "Display the command history, or save it to a file. Requires GNU Readline support.",
      },
      {
        command: "\\w",
        syntax: "\\w FILE",
        description: "Write the current query buffer to a file.",
      },
    ],
  },
  {
    id: "io",
    label: "Input / Output",
    badge: "I/O",
    color: "#fbbf24",
    subtle: "#fbbf2418",
    border: "#fbbf2433",
    commands: [
      {
        command: "\\copy",
        syntax:
          "\\copy { table | (query) } { from | to } { filename | stdin | stdout | program 'cmd' } [options]",
        description:
          "Client-side COPY. Streams data between a SQL table and a file (or program) on the client host — works without server filesystem access or superuser privileges.",
      },
      {
        command: "\\echo",
        syntax: "\\echo [-n] [STRING ...]",
        description:
          "Write the given string to standard output. -n suppresses the trailing newline.",
      },
      {
        command: "\\i",
        syntax: "\\i FILE",
        description: "Read and execute SQL commands from a file.",
      },
      {
        command: "\\ir",
        syntax: "\\ir FILE",
        description:
          "Like \\i, but the path is resolved relative to the directory of the currently-running script.",
      },
      {
        command: "\\o",
        syntax: "\\o [FILE | |COMMAND]",
        description:
          "Redirect future query results to a file, a pipe to a shell command, or (with no argument) back to standard output.",
      },
      {
        command: "\\qecho",
        syntax: "\\qecho [-n] [STRING ...]",
        description:
          "Like \\echo, but writes to the current query-output channel (the file set by \\o).",
      },
      {
        command: "\\warn",
        syntax: "\\warn [-n] [STRING ...]",
        description:
          "Like \\echo, but writes to standard error instead of standard output.",
      },
    ],
  },
  {
    id: "conditional",
    label: "Conditional",
    badge: "Conditional",
    color: "#c084fc",
    subtle: "#c084fc18",
    border: "#c084fc33",
    commands: [
      {
        command: "\\if",
        syntax: "\\if EXPRESSION",
        description:
          "Begin a conditional block. The expression is evaluated as a boolean (true/yes/on/1 are true). Commands inside are skipped when the condition is false.",
      },
      {
        command: "\\elif",
        syntax: "\\elif EXPRESSION",
        description:
          "Alternate branch in a conditional block, evaluated only if no earlier branch matched.",
      },
      {
        command: "\\else",
        syntax: "\\else",
        description:
          "Default branch in a conditional block, taken only if no \\if or \\elif branch matched.",
      },
      {
        command: "\\endif",
        syntax: "\\endif",
        description: "End the current conditional block.",
      },
    ],
  },
  {
    id: "info",
    label: "Informational",
    badge: "Informational",
    color: "#2dd4bf",
    subtle: "#2dd4bf18",
    border: "#2dd4bf33",
    commands: [
      {
        command: "\\d",
        syntax: "\\d[S+] [PATTERN]",
        description:
          "Describe a table, view, materialized view, index, sequence, or foreign table. With no pattern, lists all visible relations. S includes system objects; + adds detail.",
      },
      {
        command: "\\da",
        syntax: "\\da[S] [PATTERN]",
        description: "List aggregate functions.",
      },
      {
        command: "\\dA",
        syntax: "\\dA[+] [PATTERN]",
        description:
          "List index access methods (btree, hash, gin, gist, brin, spgist, etc.).",
      },
      {
        command: "\\dAc",
        syntax: "\\dAc[+] [AMPTRN [TYPEPTRN]]",
        description: "List operator classes used by index access methods.",
      },
      {
        command: "\\dAf",
        syntax: "\\dAf[+] [AMPTRN [TYPEPTRN]]",
        description: "List operator families used by index access methods.",
      },
      {
        command: "\\dAo",
        syntax: "\\dAo[+] [AMPTRN [OPFPTRN]]",
        description: "List operators of operator families.",
      },
      {
        command: "\\dAp",
        syntax: "\\dAp[+] [AMPTRN [OPFPTRN]]",
        description: "List support functions of operator families.",
      },
      {
        command: "\\db",
        syntax: "\\db[+] [PATTERN]",
        description: "List tablespaces.",
      },
      {
        command: "\\dc",
        syntax: "\\dc[S+] [PATTERN [PATTERN]]",
        description: "List character set conversions between encodings.",
      },
      {
        command: "\\dconfig",
        syntax: "\\dconfig[+] [PATTERN]",
        description:
          "List server configuration parameters and their current values. Added in PostgreSQL 15.",
      },
      {
        command: "\\dC",
        syntax: "\\dC[+] [PATTERN]",
        description: "List type casts.",
      },
      {
        command: "\\dd",
        syntax: "\\dd[S] [PATTERN]",
        description:
          "Show comments on objects whose descriptions aren't shown elsewhere (rules, triggers, etc.).",
      },
      {
        command: "\\dD",
        syntax: "\\dD[S+] [PATTERN]",
        description: "List domains.",
      },
      {
        command: "\\ddp",
        syntax: "\\ddp [PATTERN]",
        description:
          "List default access-privilege settings configured with ALTER DEFAULT PRIVILEGES.",
      },
      {
        command: "\\dE",
        syntax: "\\dE[S+] [PATTERN]",
        description: "List foreign tables.",
      },
      {
        command: "\\des",
        syntax: "\\des[+] [PATTERN]",
        description: "List foreign servers.",
      },
      {
        command: "\\det",
        syntax: "\\det[+] [PATTERN]",
        description: "List foreign tables (same as \\dE).",
      },
      {
        command: "\\deu",
        syntax: "\\deu[+] [PATTERN]",
        description: "List user mappings to foreign servers.",
      },
      {
        command: "\\dew",
        syntax: "\\dew[+] [PATTERN]",
        description: "List foreign-data wrappers.",
      },
      {
        command: "\\df",
        syntax: "\\df[anptwS+] [FUNCPTRN [TYPEPTRN ...]]",
        description:
          "List functions. Filter by kind with letters: a aggregates, n normal, p procedures, t triggers, w window. + shows source code and metadata.",
      },
      {
        command: "\\dF",
        syntax: "\\dF[+] [PATTERN]",
        description: "List text-search configurations.",
      },
      {
        command: "\\dFd",
        syntax: "\\dFd[+] [PATTERN]",
        description: "List text-search dictionaries.",
      },
      {
        command: "\\dFp",
        syntax: "\\dFp[+] [PATTERN]",
        description: "List text-search parsers.",
      },
      {
        command: "\\dFt",
        syntax: "\\dFt[+] [PATTERN]",
        description: "List text-search templates.",
      },
      {
        command: "\\dg",
        syntax: "\\dg[S+] [PATTERN]",
        description:
          "List database roles (groups). Identical to \\du since PostgreSQL 8.1 unified users and groups.",
      },
      {
        command: "\\di",
        syntax: "\\di[S+] [PATTERN]",
        description: "List indexes.",
      },
      {
        command: "\\dl",
        syntax: "\\dl[+]",
        description: "List large objects. Same as \\lo_list.",
      },
      {
        command: "\\dL",
        syntax: "\\dL[S+] [PATTERN]",
        description: "List procedural languages.",
      },
      {
        command: "\\dm",
        syntax: "\\dm[S+] [PATTERN]",
        description: "List materialized views.",
      },
      {
        command: "\\dn",
        syntax: "\\dn[S+] [PATTERN]",
        description: "List schemas.",
      },
      {
        command: "\\do",
        syntax: "\\do[S+] [OPPTRN [TYPEPTRN [TYPEPTRN]]]",
        description: "List operators with their operand and result types.",
      },
      {
        command: "\\dO",
        syntax: "\\dO[S+] [PATTERN]",
        description: "List collations.",
      },
      {
        command: "\\dp",
        syntax: "\\dp[S] [PATTERN]",
        description:
          "List access privileges on tables, views, and sequences. \\z is an alias.",
      },
      {
        command: "\\dP",
        syntax: "\\dP[itn+] [PATTERN]",
        description:
          "List partitioned tables and indexes. Letters: i indexes only, t tables only, n nested partitions.",
      },
      {
        command: "\\drds",
        syntax: "\\drds [ROLEPTRN [DBPTRN]]",
        description:
          "List per-database role settings (ALTER ROLE ... IN DATABASE).",
      },
      {
        command: "\\drg",
        syntax: "\\drg[S] [PATTERN]",
        description:
          "List role memberships, showing which roles are granted to which. Added in PostgreSQL 16.",
      },
      {
        command: "\\dRp",
        syntax: "\\dRp[+] [PATTERN]",
        description: "List logical replication publications.",
      },
      {
        command: "\\dRs",
        syntax: "\\dRs[+] [PATTERN]",
        description: "List logical replication subscriptions.",
      },
      {
        command: "\\ds",
        syntax: "\\ds[S+] [PATTERN]",
        description: "List sequences.",
      },
      {
        command: "\\dt",
        syntax: "\\dt[S+] [PATTERN]",
        description: "List tables.",
      },
      {
        command: "\\dT",
        syntax: "\\dT[S+] [PATTERN]",
        description: "List data types.",
      },
      {
        command: "\\du",
        syntax: "\\du[S+] [PATTERN]",
        description: "List database roles (users). Same as \\dg.",
      },
      {
        command: "\\dv",
        syntax: "\\dv[S+] [PATTERN]",
        description: "List views.",
      },
      {
        command: "\\dx",
        syntax: "\\dx[+] [PATTERN]",
        description:
          "List installed extensions. + shows the objects each extension owns.",
      },
      {
        command: "\\dX",
        syntax: "\\dX [PATTERN]",
        description: "List extended statistics objects (CREATE STATISTICS).",
      },
      {
        command: "\\dy",
        syntax: "\\dy[+] [PATTERN]",
        description: "List event triggers.",
      },
      {
        command: "\\l",
        syntax: "\\l[+] [PATTERN]",
        description:
          "List databases on the server, with encoding, collation, and access privileges.",
      },
      {
        command: "\\sf",
        syntax: "\\sf[+] FUNCNAME",
        description:
          "Show the definition of a function (a re-creatable CREATE FUNCTION statement). + adds line numbers.",
      },
      {
        command: "\\sv",
        syntax: "\\sv[+] VIEWNAME",
        description: "Show the definition of a view.",
      },
      {
        command: "\\z",
        syntax: "\\z[S] [PATTERN]",
        description: "List access privileges. Equivalent to \\dp.",
      },
    ],
  },
  {
    id: "format",
    label: "Formatting",
    badge: "Formatting",
    color: "#fb923c",
    subtle: "#fb923c18",
    border: "#fb923c33",
    commands: [
      {
        command: "\\a",
        syntax: "\\a",
        description: "Toggle between aligned and unaligned output mode.",
      },
      {
        command: "\\C",
        syntax: "\\C [STRING]",
        description:
          "Set the table caption (title), or unset it with no argument.",
      },
      {
        command: "\\f",
        syntax: "\\f [STRING]",
        description:
          "Set the field separator for unaligned output (default is |).",
      },
      {
        command: "\\H",
        syntax: "\\H",
        description: "Toggle HTML table output mode.",
      },
      {
        command: "\\pset",
        syntax: "\\pset [NAME [VALUE]]",
        description:
          "Set table-printing options. Common names: border, columns, expanded, fieldsep, footer, format (aligned, asciidoc, csv, html, latex, troff-ms, unaligned, wrapped), linestyle, null, numericlocale, pager, recordsep, tableattr, title, tuples_only.",
      },
      {
        command: "\\t",
        syntax: "\\t [on|off]",
        description:
          "Toggle tuples-only mode — suppresses column headers, footers, and the row-count line.",
      },
      {
        command: "\\T",
        syntax: "\\T [STRING]",
        description: "Set attributes inserted into the HTML <table> tag.",
      },
      {
        command: "\\x",
        syntax: "\\x [on|off|auto]",
        description:
          "Toggle expanded output, where each column is shown on its own line. auto picks expanded only when the row is too wide for the terminal.",
      },
    ],
  },
  {
    id: "connection",
    label: "Connection",
    badge: "Connection",
    color: "#f87171",
    subtle: "#f8717118",
    border: "#f8717133",
    commands: [
      {
        command: "\\c",
        syntax: "\\c[onnect] [DBNAME [USER [HOST [PORT]]]] | conninfo",
        description:
          "Connect to a new database. Use - to keep the current value for any field. With no arguments, prints the current connection info.",
      },
      {
        command: "\\conninfo",
        syntax: "\\conninfo",
        description:
          "Show the current connection's database, user, host, port, and SSL status.",
      },
      {
        command: "\\encoding",
        syntax: "\\encoding [ENCODING]",
        description: "Show or set the client character encoding.",
      },
      {
        command: "\\password",
        syntax: "\\password [USERNAME]",
        description:
          "Change a role's password. The new password is prompted for and hashed client-side before being sent, so it never appears in plaintext on the wire or in server logs.",
      },
    ],
  },
  {
    id: "largeobjects",
    label: "Large Objects",
    badge: "Large Objects",
    color: "#a78bfa",
    subtle: "#a78bfa18",
    border: "#a78bfa33",
    commands: [
      {
        command: "\\lo_export",
        syntax: "\\lo_export LOBOID FILE",
        description:
          "Write a large object's contents to a file on the client host.",
      },
      {
        command: "\\lo_import",
        syntax: "\\lo_import FILE [COMMENT]",
        description:
          "Read a file on the client host into a new large object. Returns the assigned OID.",
      },
      {
        command: "\\lo_list",
        syntax: "\\lo_list[+]",
        description: "List large objects (same as \\dl).",
      },
      {
        command: "\\lo_unlink",
        syntax: "\\lo_unlink LOBOID",
        description: "Delete a large object.",
      },
    ],
  },
  {
    id: "variables",
    label: "Variables",
    badge: "Variables",
    color: "#22d3ee",
    subtle: "#22d3ee18",
    border: "#22d3ee33",
    commands: [
      {
        command: "\\prompt",
        syntax: "\\prompt [TEXT] NAME",
        description:
          "Prompt the user for input and store it in a psql variable.",
      },
      {
        command: "\\set",
        syntax: "\\set [NAME [VALUE]]",
        description:
          "Set a psql variable. With no arguments, list all variables. Many special variables (AUTOCOMMIT, ON_ERROR_STOP, ECHO, VERBOSITY, etc.) change psql behavior.",
      },
      {
        command: "\\unset",
        syntax: "\\unset NAME",
        description: "Unset (delete) a psql variable.",
      },
      {
        command: "\\bind",
        syntax: "\\bind [PARAMETER ...]",
        description:
          "Set positional parameters ($1, $2, …) for the next query, which will be executed via the extended-query protocol. Added in PostgreSQL 16.",
      },
      {
        command: "\\bind_named",
        syntax: "\\bind_named STATEMENT_NAME [PARAMETER ...]",
        description:
          "Bind parameters and execute a previously-prepared statement by name. Added in PostgreSQL 17.",
      },
    ],
  },
  {
    id: "os",
    label: "OS / Misc",
    badge: "OS / Misc",
    color: "#94a3b8",
    subtle: "#94a3b818",
    border: "#94a3b833",
    commands: [
      {
        command: "\\!",
        syntax: "\\! [COMMAND]",
        description:
          "Run a shell command (or open an interactive subshell with no argument). The current working directory is whatever psql's is.",
      },
      {
        command: "\\cd",
        syntax: "\\cd [DIRECTORY]",
        description:
          "Change psql's working directory. With no argument, changes to the user's home directory.",
      },
      {
        command: "\\setenv",
        syntax: "\\setenv NAME [VALUE]",
        description:
          "Set an environment variable in psql's environment, or unset it with no value.",
      },
      {
        command: "\\timing",
        syntax: "\\timing [on|off]",
        description:
          "Toggle whether the duration of each SQL command is reported after the result.",
      },
    ],
  },
];
