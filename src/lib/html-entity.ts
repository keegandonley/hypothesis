export type EncodeMode = "all" | "special" | "non-ascii";

export const htmlEntities: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
  "¡": "&iexcl;",
  "¢": "&cent;",
  "£": "&pound;",
  "¤": "&curren;",
  "¥": "&yen;",
  "¦": "&brvbar;",
  "§": "&sect;",
  "¨": "&uml;",
  "©": "&copy;",
  ª: "&ordf;",
  "«": "&laquo;",
  "¬": "&not;",
  "®": "&reg;",
  "¯": "&macr;",
  "°": "&deg;",
  "±": "&plusmn;",
  "²": "&sup2;",
  "³": "&sup3;",
  "´": "&acute;",
  µ: "&micro;",
  "¶": "&para;",
  "·": "&middot;",
  "¸": "&cedil;",
  "¹": "&sup1;",
  º: "&ordm;",
  "»": "&raquo;",
  "¼": "&frac14;",
  "½": "&frac12;",
  "¾": "&frac34;",
  "¿": "&iquest;",
  À: "&Agrave;",
  Á: "&Aacute;",
  Â: "&Acirc;",
  Ã: "&Atilde;",
  Ä: "&Auml;",
  Å: "&Aring;",
  Æ: "&AElig;",
  Ç: "&Ccedil;",
  È: "&Egrave;",
  É: "&Eacute;",
  Ê: "&Ecirc;",
  Ë: "&Euml;",
  Ì: "&Igrave;",
  Í: "&Iacute;",
  Î: "&Icirc;",
  Ï: "&Iuml;",
  Ð: "&ETH;",
  Ñ: "&Ntilde;",
  Ò: "&Ograve;",
  Ó: "&Oacute;",
  Ô: "&Ocirc;",
  Õ: "&Otilde;",
  Ö: "&Ouml;",
  "×": "&times;",
  Ø: "&Oslash;",
  Ù: "&Ugrave;",
  Ú: "&Uacute;",
  Û: "&Ucirc;",
  Ü: "&Uuml;",
  Ý: "&Yacute;",
  Þ: "&THORN;",
  ß: "&szlig;",
  à: "&agrave;",
  á: "&aacute;",
  â: "&acirc;",
  ã: "&atilde;",
  ä: "&auml;",
  å: "&aring;",
  æ: "&aelig;",
  ç: "&ccedil;",
  è: "&egrave;",
  é: "&eacute;",
  ê: "&ecirc;",
  ë: "&euml;",
  ì: "&igrave;",
  í: "&iacute;",
  î: "&icirc;",
  ï: "&iuml;",
  ð: "&eth;",
  ñ: "&ntilde;",
  ò: "&ograve;",
  ó: "&oacute;",
  ô: "&ocirc;",
  õ: "&otilde;",
  ö: "&ouml;",
  "÷": "&divide;",
  ø: "&oslash;",
  ù: "&ugrave;",
  ú: "&uacute;",
  û: "&ucirc;",
  ü: "&uuml;",
  ý: "&yacute;",
  þ: "&thorn;",
  ÿ: "&yuml;",
  "€": "&euro;",
  "−": "&minus;",
  "™": "&trade;",
  "←": "&larr;",
  "↑": "&uarr;",
  "→": "&rarr;",
  "↓": "&darr;",
  "↔": "&harr;",
  "∀": "&forall;",
  "∂": "&part;",
  "∃": "&exist;",
  "∅": "&empty;",
  "∇": "&nabla;",
  "∈": "&isin;",
  "∉": "&notin;",
  "∋": "&ni;",
  "∏": "&prod;",
  "∑": "&sum;",
  "√": "&radic;",
  "∞": "&infin;",
  "∠": "&ang;",
  "∧": "&and;",
  "∨": "&or;",
  "∩": "&cap;",
  "∪": "&cup;",
  "∫": "&int;",
  "∴": "&there4;",
  "∼": "&sim;",
  "≅": "&cong;",
  "≈": "&asymp;",
  "≠": "&ne;",
  "≡": "&equiv;",
  "≤": "&le;",
  "≥": "&ge;",
  "⊂": "&sub;",
  "⊃": "&sup;",
  "⊄": "&nsub;",
  "⊆": "&sube;",
  "⊇": "&supe;",
  "⊕": "&oplus;",
  "⊗": "&otimes;",
  "⊥": "&perp;",
  "⋅": "&sdot;",
  " ": "&nbsp;",
};

export const reverseEntities: Record<string, string> = {};

for (const [char, entity] of Object.entries(htmlEntities)) {
  reverseEntities[entity] = char;
}

export function encodeHtmlEntities(text: string, mode: EncodeMode): string {
  if (!text) return "";

  if (mode === "special") {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  } else if (mode === "non-ascii") {
    return text.replace(/[^\x00-\x7F]/g, (char) => {
      return htmlEntities[char] || `&#${char.charCodeAt(0)};`;
    });
  } else {
    return text
      .replace(/[&<>"']/g, (char) => htmlEntities[char] || char)
      .replace(/[^\x00-\x7F]/g, (char) => {
        return htmlEntities[char] || `&#${char.charCodeAt(0)};`;
      });
  }
}

export function decodeHtmlEntities(text: string): string {
  if (!text) return "";

  return (
    text
      .replace(/&[a-zA-Z]+;/g, (entity) => reverseEntities[entity] || entity)
      .replace(/&#(\d+);/g, (_, num: string) =>
        String.fromCharCode(parseInt(num, 10)),
      )
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
        String.fromCharCode(parseInt(hex, 16)),
      )
  );
}
