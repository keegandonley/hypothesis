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

const REFERENCE_DATA: Record<string, unknown> = {
  "css-selectors": CSS_SELECTOR_GROUPS,
  "dns-record-types": DNS_GROUPS,
  "exit-codes": EXIT_CODE_GROUPS,
  "http-status-codes": { STATUS_CODES, STATUS_CLASSES },
  "mime-types": MIME_CATEGORIES,
  "unix-signals": SIGNAL_GROUPS,
  "http-headers": HEADER_CATEGORIES,
  "ascii": ASCII_GROUPS,
  "unicode-blocks": UNICODE_BLOCK_GROUPS,
  "port-numbers": PORT_GROUPS,
  "regex-syntax": REGEX_GROUPS,
  "timezones": { TIMEZONES, TZ_GROUPS },
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") return res.status(405).end();

  const { slug } = req.query;
  if (typeof slug !== "string" || !(slug in REFERENCE_DATA)) {
    return res.status(404).json({ error: "Reference not found" });
  }

  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  res.json(REFERENCE_DATA[slug]);
}
