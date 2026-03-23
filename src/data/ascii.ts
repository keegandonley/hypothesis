export type AsciiCategory = "control" | "symbol" | "digit" | "upper" | "lower";

export interface AsciiChar {
  code: number;
  hex: string;
  oct: string;
  abbr: string;
  name: string;
  category: AsciiCategory;
  ctrl?: string;
}

export interface AsciiGroup {
  id: AsciiCategory;
  label: string;
  range: string;
  color: string;
  subtle: string;
  border: string;
  chars: AsciiChar[];
}

const CONTROL_CHARS: AsciiChar[] = [
  { code: 0,   hex: "00", oct: "000", abbr: "NUL", name: "Null",                        category: "control", ctrl: "^@" },
  { code: 1,   hex: "01", oct: "001", abbr: "SOH", name: "Start of Heading",             category: "control", ctrl: "^A" },
  { code: 2,   hex: "02", oct: "002", abbr: "STX", name: "Start of Text",                category: "control", ctrl: "^B" },
  { code: 3,   hex: "03", oct: "003", abbr: "ETX", name: "End of Text",                  category: "control", ctrl: "^C" },
  { code: 4,   hex: "04", oct: "004", abbr: "EOT", name: "End of Transmission",          category: "control", ctrl: "^D" },
  { code: 5,   hex: "05", oct: "005", abbr: "ENQ", name: "Enquiry",                      category: "control", ctrl: "^E" },
  { code: 6,   hex: "06", oct: "006", abbr: "ACK", name: "Acknowledge",                  category: "control", ctrl: "^F" },
  { code: 7,   hex: "07", oct: "007", abbr: "BEL", name: "Bell",                         category: "control", ctrl: "^G" },
  { code: 8,   hex: "08", oct: "010", abbr: "BS",  name: "Backspace",                    category: "control", ctrl: "^H" },
  { code: 9,   hex: "09", oct: "011", abbr: "HT",  name: "Horizontal Tab",               category: "control", ctrl: "^I" },
  { code: 10,  hex: "0A", oct: "012", abbr: "LF",  name: "Line Feed",                    category: "control", ctrl: "^J" },
  { code: 11,  hex: "0B", oct: "013", abbr: "VT",  name: "Vertical Tab",                 category: "control", ctrl: "^K" },
  { code: 12,  hex: "0C", oct: "014", abbr: "FF",  name: "Form Feed",                    category: "control", ctrl: "^L" },
  { code: 13,  hex: "0D", oct: "015", abbr: "CR",  name: "Carriage Return",              category: "control", ctrl: "^M" },
  { code: 14,  hex: "0E", oct: "016", abbr: "SO",  name: "Shift Out",                    category: "control", ctrl: "^N" },
  { code: 15,  hex: "0F", oct: "017", abbr: "SI",  name: "Shift In",                     category: "control", ctrl: "^O" },
  { code: 16,  hex: "10", oct: "020", abbr: "DLE", name: "Data Link Escape",             category: "control", ctrl: "^P" },
  { code: 17,  hex: "11", oct: "021", abbr: "DC1", name: "Device Control 1 (XON)",       category: "control", ctrl: "^Q" },
  { code: 18,  hex: "12", oct: "022", abbr: "DC2", name: "Device Control 2",             category: "control", ctrl: "^R" },
  { code: 19,  hex: "13", oct: "023", abbr: "DC3", name: "Device Control 3 (XOFF)",      category: "control", ctrl: "^S" },
  { code: 20,  hex: "14", oct: "024", abbr: "DC4", name: "Device Control 4",             category: "control", ctrl: "^T" },
  { code: 21,  hex: "15", oct: "025", abbr: "NAK", name: "Negative Acknowledge",         category: "control", ctrl: "^U" },
  { code: 22,  hex: "16", oct: "026", abbr: "SYN", name: "Synchronous Idle",             category: "control", ctrl: "^V" },
  { code: 23,  hex: "17", oct: "027", abbr: "ETB", name: "End of Transmission Block",    category: "control", ctrl: "^W" },
  { code: 24,  hex: "18", oct: "030", abbr: "CAN", name: "Cancel",                       category: "control", ctrl: "^X" },
  { code: 25,  hex: "19", oct: "031", abbr: "EM",  name: "End of Medium",                category: "control", ctrl: "^Y" },
  { code: 26,  hex: "1A", oct: "032", abbr: "SUB", name: "Substitute",                   category: "control", ctrl: "^Z" },
  { code: 27,  hex: "1B", oct: "033", abbr: "ESC", name: "Escape",                       category: "control", ctrl: "^[" },
  { code: 28,  hex: "1C", oct: "034", abbr: "FS",  name: "File Separator",               category: "control", ctrl: "^\\" },
  { code: 29,  hex: "1D", oct: "035", abbr: "GS",  name: "Group Separator",              category: "control", ctrl: "^]" },
  { code: 30,  hex: "1E", oct: "036", abbr: "RS",  name: "Record Separator",             category: "control", ctrl: "^^" },
  { code: 31,  hex: "1F", oct: "037", abbr: "US",  name: "Unit Separator",               category: "control", ctrl: "^_" },
  { code: 127, hex: "7F", oct: "177", abbr: "DEL", name: "Delete",                       category: "control", ctrl: "^?" },
];

const SYMBOL_CHARS: AsciiChar[] = [
  { code: 32,  hex: "20", oct: "040", abbr: "SP",  name: "Space",                        category: "symbol" },
  { code: 33,  hex: "21", oct: "041", abbr: "!",   name: "Exclamation Mark",             category: "symbol" },
  { code: 34,  hex: "22", oct: "042", abbr: '"',   name: "Quotation Mark",               category: "symbol" },
  { code: 35,  hex: "23", oct: "043", abbr: "#",   name: "Number Sign",                  category: "symbol" },
  { code: 36,  hex: "24", oct: "044", abbr: "$",   name: "Dollar Sign",                  category: "symbol" },
  { code: 37,  hex: "25", oct: "045", abbr: "%",   name: "Percent Sign",                 category: "symbol" },
  { code: 38,  hex: "26", oct: "046", abbr: "&",   name: "Ampersand",                    category: "symbol" },
  { code: 39,  hex: "27", oct: "047", abbr: "'",   name: "Apostrophe",                   category: "symbol" },
  { code: 40,  hex: "28", oct: "050", abbr: "(",   name: "Left Parenthesis",             category: "symbol" },
  { code: 41,  hex: "29", oct: "051", abbr: ")",   name: "Right Parenthesis",            category: "symbol" },
  { code: 42,  hex: "2A", oct: "052", abbr: "*",   name: "Asterisk",                     category: "symbol" },
  { code: 43,  hex: "2B", oct: "053", abbr: "+",   name: "Plus Sign",                    category: "symbol" },
  { code: 44,  hex: "2C", oct: "054", abbr: ",",   name: "Comma",                        category: "symbol" },
  { code: 45,  hex: "2D", oct: "055", abbr: "-",   name: "Hyphen-Minus",                 category: "symbol" },
  { code: 46,  hex: "2E", oct: "056", abbr: ".",   name: "Full Stop",                    category: "symbol" },
  { code: 47,  hex: "2F", oct: "057", abbr: "/",   name: "Solidus",                      category: "symbol" },
  { code: 58,  hex: "3A", oct: "072", abbr: ":",   name: "Colon",                        category: "symbol" },
  { code: 59,  hex: "3B", oct: "073", abbr: ";",   name: "Semicolon",                    category: "symbol" },
  { code: 60,  hex: "3C", oct: "074", abbr: "<",   name: "Less-Than Sign",               category: "symbol" },
  { code: 61,  hex: "3D", oct: "075", abbr: "=",   name: "Equals Sign",                  category: "symbol" },
  { code: 62,  hex: "3E", oct: "076", abbr: ">",   name: "Greater-Than Sign",            category: "symbol" },
  { code: 63,  hex: "3F", oct: "077", abbr: "?",   name: "Question Mark",                category: "symbol" },
  { code: 64,  hex: "40", oct: "100", abbr: "@",   name: "Commercial At",                category: "symbol" },
  { code: 91,  hex: "5B", oct: "133", abbr: "[",   name: "Left Square Bracket",          category: "symbol" },
  { code: 92,  hex: "5C", oct: "134", abbr: "\\",  name: "Reverse Solidus",              category: "symbol" },
  { code: 93,  hex: "5D", oct: "135", abbr: "]",   name: "Right Square Bracket",         category: "symbol" },
  { code: 94,  hex: "5E", oct: "136", abbr: "^",   name: "Circumflex Accent",            category: "symbol" },
  { code: 95,  hex: "5F", oct: "137", abbr: "_",   name: "Low Line",                     category: "symbol" },
  { code: 96,  hex: "60", oct: "140", abbr: "`",   name: "Grave Accent",                 category: "symbol" },
  { code: 123, hex: "7B", oct: "173", abbr: "{",   name: "Left Curly Bracket",           category: "symbol" },
  { code: 124, hex: "7C", oct: "174", abbr: "|",   name: "Vertical Line",                category: "symbol" },
  { code: 125, hex: "7D", oct: "175", abbr: "}",   name: "Right Curly Bracket",          category: "symbol" },
  { code: 126, hex: "7E", oct: "176", abbr: "~",   name: "Tilde",                        category: "symbol" },
];

const DIGIT_CHARS: AsciiChar[] = [
  { code: 48, hex: "30", oct: "060", abbr: "0", name: "Digit Zero",  category: "digit" },
  { code: 49, hex: "31", oct: "061", abbr: "1", name: "Digit One",   category: "digit" },
  { code: 50, hex: "32", oct: "062", abbr: "2", name: "Digit Two",   category: "digit" },
  { code: 51, hex: "33", oct: "063", abbr: "3", name: "Digit Three", category: "digit" },
  { code: 52, hex: "34", oct: "064", abbr: "4", name: "Digit Four",  category: "digit" },
  { code: 53, hex: "35", oct: "065", abbr: "5", name: "Digit Five",  category: "digit" },
  { code: 54, hex: "36", oct: "066", abbr: "6", name: "Digit Six",   category: "digit" },
  { code: 55, hex: "37", oct: "067", abbr: "7", name: "Digit Seven", category: "digit" },
  { code: 56, hex: "38", oct: "070", abbr: "8", name: "Digit Eight", category: "digit" },
  { code: 57, hex: "39", oct: "071", abbr: "9", name: "Digit Nine",  category: "digit" },
];

const UPPER_CHARS: AsciiChar[] = [
  { code: 65,  hex: "41", oct: "101", abbr: "A", name: "Latin Capital Letter A", category: "upper" },
  { code: 66,  hex: "42", oct: "102", abbr: "B", name: "Latin Capital Letter B", category: "upper" },
  { code: 67,  hex: "43", oct: "103", abbr: "C", name: "Latin Capital Letter C", category: "upper" },
  { code: 68,  hex: "44", oct: "104", abbr: "D", name: "Latin Capital Letter D", category: "upper" },
  { code: 69,  hex: "45", oct: "105", abbr: "E", name: "Latin Capital Letter E", category: "upper" },
  { code: 70,  hex: "46", oct: "106", abbr: "F", name: "Latin Capital Letter F", category: "upper" },
  { code: 71,  hex: "47", oct: "107", abbr: "G", name: "Latin Capital Letter G", category: "upper" },
  { code: 72,  hex: "48", oct: "110", abbr: "H", name: "Latin Capital Letter H", category: "upper" },
  { code: 73,  hex: "49", oct: "111", abbr: "I", name: "Latin Capital Letter I", category: "upper" },
  { code: 74,  hex: "4A", oct: "112", abbr: "J", name: "Latin Capital Letter J", category: "upper" },
  { code: 75,  hex: "4B", oct: "113", abbr: "K", name: "Latin Capital Letter K", category: "upper" },
  { code: 76,  hex: "4C", oct: "114", abbr: "L", name: "Latin Capital Letter L", category: "upper" },
  { code: 77,  hex: "4D", oct: "115", abbr: "M", name: "Latin Capital Letter M", category: "upper" },
  { code: 78,  hex: "4E", oct: "116", abbr: "N", name: "Latin Capital Letter N", category: "upper" },
  { code: 79,  hex: "4F", oct: "117", abbr: "O", name: "Latin Capital Letter O", category: "upper" },
  { code: 80,  hex: "50", oct: "120", abbr: "P", name: "Latin Capital Letter P", category: "upper" },
  { code: 81,  hex: "51", oct: "121", abbr: "Q", name: "Latin Capital Letter Q", category: "upper" },
  { code: 82,  hex: "52", oct: "122", abbr: "R", name: "Latin Capital Letter R", category: "upper" },
  { code: 83,  hex: "53", oct: "123", abbr: "S", name: "Latin Capital Letter S", category: "upper" },
  { code: 84,  hex: "54", oct: "124", abbr: "T", name: "Latin Capital Letter T", category: "upper" },
  { code: 85,  hex: "55", oct: "125", abbr: "U", name: "Latin Capital Letter U", category: "upper" },
  { code: 86,  hex: "56", oct: "126", abbr: "V", name: "Latin Capital Letter V", category: "upper" },
  { code: 87,  hex: "57", oct: "127", abbr: "W", name: "Latin Capital Letter W", category: "upper" },
  { code: 88,  hex: "58", oct: "130", abbr: "X", name: "Latin Capital Letter X", category: "upper" },
  { code: 89,  hex: "59", oct: "131", abbr: "Y", name: "Latin Capital Letter Y", category: "upper" },
  { code: 90,  hex: "5A", oct: "132", abbr: "Z", name: "Latin Capital Letter Z", category: "upper" },
];

const LOWER_CHARS: AsciiChar[] = [
  { code: 97,  hex: "61", oct: "141", abbr: "a", name: "Latin Small Letter A", category: "lower" },
  { code: 98,  hex: "62", oct: "142", abbr: "b", name: "Latin Small Letter B", category: "lower" },
  { code: 99,  hex: "63", oct: "143", abbr: "c", name: "Latin Small Letter C", category: "lower" },
  { code: 100, hex: "64", oct: "144", abbr: "d", name: "Latin Small Letter D", category: "lower" },
  { code: 101, hex: "65", oct: "145", abbr: "e", name: "Latin Small Letter E", category: "lower" },
  { code: 102, hex: "66", oct: "146", abbr: "f", name: "Latin Small Letter F", category: "lower" },
  { code: 103, hex: "67", oct: "147", abbr: "g", name: "Latin Small Letter G", category: "lower" },
  { code: 104, hex: "68", oct: "150", abbr: "h", name: "Latin Small Letter H", category: "lower" },
  { code: 105, hex: "69", oct: "151", abbr: "i", name: "Latin Small Letter I", category: "lower" },
  { code: 106, hex: "6A", oct: "152", abbr: "j", name: "Latin Small Letter J", category: "lower" },
  { code: 107, hex: "6B", oct: "153", abbr: "k", name: "Latin Small Letter K", category: "lower" },
  { code: 108, hex: "6C", oct: "154", abbr: "l", name: "Latin Small Letter L", category: "lower" },
  { code: 109, hex: "6D", oct: "155", abbr: "m", name: "Latin Small Letter M", category: "lower" },
  { code: 110, hex: "6E", oct: "156", abbr: "n", name: "Latin Small Letter N", category: "lower" },
  { code: 111, hex: "6F", oct: "157", abbr: "o", name: "Latin Small Letter O", category: "lower" },
  { code: 112, hex: "70", oct: "160", abbr: "p", name: "Latin Small Letter P", category: "lower" },
  { code: 113, hex: "71", oct: "161", abbr: "q", name: "Latin Small Letter Q", category: "lower" },
  { code: 114, hex: "72", oct: "162", abbr: "r", name: "Latin Small Letter R", category: "lower" },
  { code: 115, hex: "73", oct: "163", abbr: "s", name: "Latin Small Letter S", category: "lower" },
  { code: 116, hex: "74", oct: "164", abbr: "t", name: "Latin Small Letter T", category: "lower" },
  { code: 117, hex: "75", oct: "165", abbr: "u", name: "Latin Small Letter U", category: "lower" },
  { code: 118, hex: "76", oct: "166", abbr: "v", name: "Latin Small Letter V", category: "lower" },
  { code: 119, hex: "77", oct: "167", abbr: "w", name: "Latin Small Letter W", category: "lower" },
  { code: 120, hex: "78", oct: "170", abbr: "x", name: "Latin Small Letter X", category: "lower" },
  { code: 121, hex: "79", oct: "171", abbr: "y", name: "Latin Small Letter Y", category: "lower" },
  { code: 122, hex: "7A", oct: "172", abbr: "z", name: "Latin Small Letter Z", category: "lower" },
];

export const ASCII_GROUPS: AsciiGroup[] = [
  {
    id: "control",
    label: "Control Characters",
    range: "0–31, 127",
    color: "#60a5fa",
    subtle: "#60a5fa18",
    border: "#60a5fa33",
    chars: CONTROL_CHARS,
  },
  {
    id: "symbol",
    label: "Symbols & Punctuation",
    range: "32–47, 58–64, 91–96, 123–126",
    color: "#fbbf24",
    subtle: "#fbbf2418",
    border: "#fbbf2433",
    chars: SYMBOL_CHARS,
  },
  {
    id: "digit",
    label: "Digits",
    range: "48–57",
    color: "#34d399",
    subtle: "#34d39918",
    border: "#34d39933",
    chars: DIGIT_CHARS,
  },
  {
    id: "upper",
    label: "Uppercase",
    range: "65–90",
    color: "#c084fc",
    subtle: "#c084fc18",
    border: "#c084fc33",
    chars: UPPER_CHARS,
  },
  {
    id: "lower",
    label: "Lowercase",
    range: "97–122",
    color: "#fb923c",
    subtle: "#fb923c18",
    border: "#fb923c33",
    chars: LOWER_CHARS,
  },
];
