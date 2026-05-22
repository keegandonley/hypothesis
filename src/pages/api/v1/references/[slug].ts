import type { NextApiRequest, NextApiResponse } from "next";
import { CSS_SELECTOR_GROUPS } from "@/data/css-selectors";
import { DNS_GROUPS } from "@/data/dns-record-types";
import { EXIT_CODE_GROUPS } from "@/data/exit-codes";
import { STATUS_CODES, STATUS_CLASSES } from "@/data/http-status-codes";
import { MIME_CATEGORIES } from "@/data/mime-types";
import { SIGNAL_GROUPS } from "@/data/unix-signals";
import { HEADER_CATEGORIES } from "@/data/http-headers";
import { ASCII_GROUPS } from "@/data/ascii";
import { UNICODE_BLOCK_GROUPS } from "@/data/unicode-blocks";
import { PORT_GROUPS } from "@/data/port-numbers";
import { REGEX_GROUPS } from "@/data/regex-syntax";
import { TIMEZONES, TZ_GROUPS } from "@/data/timezones";
import { MEDIA_FILE_GROUPS } from "@/data/media-files";
import { URL_SCHEME_GROUPS } from "@/data/ios-url-schemes";
import { PERMISSION_GROUPS } from "@/data/ios-permissions";
import { IONICON_GROUPS } from "@/data/ionicons";
import { PSQL_COMMAND_GROUPS } from "@/data/psql-meta-commands";
import { PG_OPERATOR_GROUPS } from "@/data/postgres-operators";
import { TMUX_GROUPS } from "@/data/tmux";
import { MACOS_SHORTCUT_GROUPS } from "@/data/macos-shortcuts";

const REFERENCE_DATA: Record<string, unknown> = {
  "css-selectors": CSS_SELECTOR_GROUPS,
  "dns-record-types": DNS_GROUPS,
  "exit-codes": EXIT_CODE_GROUPS,
  "http-status-codes": { STATUS_CODES, STATUS_CLASSES },
  "mime-types": MIME_CATEGORIES,
  "unix-signals": SIGNAL_GROUPS,
  "http-headers": HEADER_CATEGORIES,
  ascii: ASCII_GROUPS,
  "unicode-blocks": UNICODE_BLOCK_GROUPS,
  "port-numbers": PORT_GROUPS,
  "regex-syntax": REGEX_GROUPS,
  timezones: { TIMEZONES, TZ_GROUPS },
  "media-files": MEDIA_FILE_GROUPS,
  "ios-url-schemes": URL_SCHEME_GROUPS,
  "ios-permissions": PERMISSION_GROUPS,
  ionicons: IONICON_GROUPS,
  "psql-meta-commands": PSQL_COMMAND_GROUPS,
  "postgres-operators": PG_OPERATOR_GROUPS,
  tmux: TMUX_GROUPS,
  "macos-shortcuts": MACOS_SHORTCUT_GROUPS,
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): void {
  if (req.method !== "GET") {
    res.status(405).end();

    return;
  }

  const { slug } = req.query;

  if (typeof slug !== "string" || !(slug in REFERENCE_DATA)) {
    res.status(404).json({ error: "Reference not found" });

    return;
  }

  res.setHeader(
    "Cache-Control",
    "public, s-maxage=86400, stale-while-revalidate=604800",
  );
  res.json(REFERENCE_DATA[slug]);
}
