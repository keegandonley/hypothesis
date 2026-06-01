export const MAX_CODEPOINTS = 512;

export const NAMED_ENTITIES: Record<number, string> = {
  34: "&quot;",
  38: "&amp;",
  39: "&apos;",
  60: "&lt;",
  62: "&gt;",
  160: "&nbsp;",
  161: "&iexcl;",
  162: "&cent;",
  163: "&pound;",
  169: "&copy;",
  174: "&reg;",
  176: "&deg;",
  215: "&times;",
  247: "&divide;",
};

export function toUtf8Hex(cp: number): string {
  return Array.from(new TextEncoder().encode(String.fromCodePoint(cp)))
    .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
}

export function toUtf16Hex(char: string): string {
  return Array.from({ length: char.length }, (_, i) => char.charCodeAt(i))
    .map((u) => u.toString(16).padStart(4, "0").toUpperCase())
    .join(" ");
}

export function getCategory(char: string): string {
  if (/\p{Lu}/u.test(char)) return "Letter, Uppercase (Lu)";
  if (/\p{Ll}/u.test(char)) return "Letter, Lowercase (Ll)";
  if (/\p{Lt}/u.test(char)) return "Letter, Titlecase (Lt)";
  if (/\p{Lm}/u.test(char)) return "Letter, Modifier (Lm)";
  if (/\p{Lo}/u.test(char)) return "Letter, Other (Lo)";
  if (/\p{Mn}/u.test(char)) return "Mark, Nonspacing (Mn)";
  if (/\p{Mc}/u.test(char)) return "Mark, Spacing (Mc)";
  if (/\p{Me}/u.test(char)) return "Mark, Enclosing (Me)";
  if (/\p{Nd}/u.test(char)) return "Number, Decimal (Nd)";
  if (/\p{Nl}/u.test(char)) return "Number, Letter (Nl)";
  if (/\p{No}/u.test(char)) return "Number, Other (No)";
  if (/\p{Pc}/u.test(char)) return "Punctuation, Connector (Pc)";
  if (/\p{Pd}/u.test(char)) return "Punctuation, Dash (Pd)";
  if (/\p{Ps}/u.test(char)) return "Punctuation, Open (Ps)";
  if (/\p{Pe}/u.test(char)) return "Punctuation, Close (Pe)";
  if (/\p{Pi}/u.test(char)) return "Punctuation, Initial (Pi)";
  if (/\p{Pf}/u.test(char)) return "Punctuation, Final (Pf)";
  if (/\p{Po}/u.test(char)) return "Punctuation, Other (Po)";
  if (/\p{Sm}/u.test(char)) return "Symbol, Math (Sm)";
  if (/\p{Sc}/u.test(char)) return "Symbol, Currency (Sc)";
  if (/\p{Sk}/u.test(char)) return "Symbol, Modifier (Sk)";
  if (/\p{So}/u.test(char)) return "Symbol, Other (So)";
  if (/\p{Zs}/u.test(char)) return "Separator, Space (Zs)";
  if (/\p{Zl}/u.test(char)) return "Separator, Line (Zl)";
  if (/\p{Zp}/u.test(char)) return "Separator, Paragraph (Zp)";
  if (/\p{Cc}/u.test(char)) return "Other, Control (Cc)";
  if (/\p{Cf}/u.test(char)) return "Other, Format (Cf)";
  if (/\p{Cs}/u.test(char)) return "Other, Surrogate (Cs)";
  if (/\p{Co}/u.test(char)) return "Other, Private Use (Co)";

  return "Other, Unassigned (Cn)";
}

export function getScript(char: string): string {
  if (/\p{Emoji}/u.test(char)) return "Emoji";
  if (/\p{Script=Latin}/u.test(char)) return "Latin";
  if (/\p{Script=Greek}/u.test(char)) return "Greek";
  if (/\p{Script=Cyrillic}/u.test(char)) return "Cyrillic";
  if (/\p{Script=Han}/u.test(char)) return "Han";
  if (/\p{Script=Hiragana}/u.test(char)) return "Hiragana";
  if (/\p{Script=Katakana}/u.test(char)) return "Katakana";
  if (/\p{Script=Arabic}/u.test(char)) return "Arabic";
  if (/\p{Script=Hebrew}/u.test(char)) return "Hebrew";
  if (/\p{Script=Devanagari}/u.test(char)) return "Devanagari";
  if (/\p{Script=Bengali}/u.test(char)) return "Bengali";
  if (/\p{Script=Thai}/u.test(char)) return "Thai";
  if (/\p{Script=Hangul}/u.test(char)) return "Hangul";
  if (/\p{Script=Georgian}/u.test(char)) return "Georgian";
  if (/\p{Script=Armenian}/u.test(char)) return "Armenian";
  if (/\p{Script=Ethiopic}/u.test(char)) return "Ethiopic";
  if (/\p{Script=Common}/u.test(char)) return "Common";

  return "Unknown";
}

export function getHtmlEntity(cp: number): string {
  if (cp in NAMED_ENTITIES) return NAMED_ENTITIES[cp];

  return `&#x${cp.toString(16).toUpperCase()};`;
}

export function getDisplayChar(char: string, cp: number): string {
  if (cp < 32 || (cp >= 127 && cp < 160)) return "␣";
  if (cp === 32) return "·";

  return char;
}

export interface CharInfo {
  char: string;
  cp: number;
  codePoint: string;
  decimal: string;
  utf8: string;
  utf16: string;
  category: string;
  script: string;
  htmlEntity: string;
  display: string;
}

export function analyzeText(text: string): { chars: CharInfo[]; truncated: boolean } {
  const codePoints = [...text];
  const truncated = codePoints.length > MAX_CODEPOINTS;
  const slice = truncated ? codePoints.slice(0, MAX_CODEPOINTS) : codePoints;

  const chars: CharInfo[] = slice.map((char) => {
    const cp = char.codePointAt(0)!;

    return {
      char,
      cp,
      codePoint: `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`,
      decimal: cp.toString(10),
      utf8: toUtf8Hex(cp),
      utf16: toUtf16Hex(char),
      category: getCategory(char),
      script: getScript(char),
      htmlEntity: getHtmlEntity(cp),
      display: getDisplayChar(char, cp),
    };
  });

  return { chars, truncated };
}
