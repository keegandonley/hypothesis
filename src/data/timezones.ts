export type TzGroup =
  | "americas"
  | "europe-africa"
  | "asia"
  | "pacific"
  | "utc";

export interface TimezoneEntry {
  iana: string;
  abbrs: string[];
  cities: string[];
  group: TzGroup;
}

export const TZ_GROUPS: {
  id: TzGroup;
  label: string;
  color: string;
  subtle: string;
  border: string;
}[] = [
  {
    id: "americas",
    label: "Americas",
    color: "#60a5fa",
    subtle: "#60a5fa18",
    border: "#60a5fa33",
  },
  {
    id: "europe-africa",
    label: "Europe / Africa",
    color: "#34d399",
    subtle: "#34d39918",
    border: "#34d39933",
  },
  {
    id: "asia",
    label: "Asia",
    color: "#fbbf24",
    subtle: "#fbbf2418",
    border: "#fbbf2433",
  },
  {
    id: "pacific",
    label: "Pacific",
    color: "#c084fc",
    subtle: "#c084fc18",
    border: "#c084fc33",
  },
  {
    id: "utc",
    label: "UTC",
    color: "#2dd4bf",
    subtle: "#2dd4bf18",
    border: "#2dd4bf33",
  },
];

export const TIMEZONES: TimezoneEntry[] = [
  // UTC
  {
    iana: "UTC",
    abbrs: ["UTC"],
    cities: ["Reykjavik", "Monrovia"],
    group: "utc",
  },

  // Americas
  {
    iana: "America/St_Johns",
    abbrs: ["NST", "NDT"],
    cities: ["St. John's"],
    group: "americas",
  },
  {
    iana: "America/Halifax",
    abbrs: ["AST", "ADT"],
    cities: ["Halifax", "Moncton"],
    group: "americas",
  },
  {
    iana: "America/New_York",
    abbrs: ["EST", "EDT"],
    cities: ["New York", "Toronto", "Miami", "Atlanta"],
    group: "americas",
  },
  {
    iana: "America/Chicago",
    abbrs: ["CST", "CDT"],
    cities: ["Chicago", "Houston", "Dallas", "Winnipeg"],
    group: "americas",
  },
  {
    iana: "America/Denver",
    abbrs: ["MST", "MDT"],
    cities: ["Denver", "Calgary", "Salt Lake City"],
    group: "americas",
  },
  {
    iana: "America/Phoenix",
    abbrs: ["MST"],
    cities: ["Phoenix", "Tucson"],
    group: "americas",
  },
  {
    iana: "America/Los_Angeles",
    abbrs: ["PST", "PDT"],
    cities: ["Los Angeles", "San Francisco", "Seattle", "Vancouver"],
    group: "americas",
  },
  {
    iana: "America/Anchorage",
    abbrs: ["AKST", "AKDT"],
    cities: ["Anchorage", "Juneau"],
    group: "americas",
  },
  {
    iana: "Pacific/Honolulu",
    abbrs: ["HST"],
    cities: ["Honolulu", "Kahului"],
    group: "americas",
  },
  {
    iana: "America/Sao_Paulo",
    abbrs: ["BRT", "BRST"],
    cities: ["São Paulo", "Rio de Janeiro", "Brasília"],
    group: "americas",
  },
  {
    iana: "America/Argentina/Buenos_Aires",
    abbrs: ["ART"],
    cities: ["Buenos Aires", "Córdoba"],
    group: "americas",
  },
  {
    iana: "America/Santiago",
    abbrs: ["CLT", "CLST"],
    cities: ["Santiago"],
    group: "americas",
  },
  {
    iana: "America/Lima",
    abbrs: ["PET"],
    cities: ["Lima", "Bogotá", "Quito"],
    group: "americas",
  },
  {
    iana: "America/Caracas",
    abbrs: ["VET"],
    cities: ["Caracas"],
    group: "americas",
  },
  {
    iana: "America/Mexico_City",
    abbrs: ["CST", "CDT"],
    cities: ["Mexico City", "Guadalajara", "Monterrey"],
    group: "americas",
  },

  // Europe / Africa
  {
    iana: "Europe/London",
    abbrs: ["GMT", "BST"],
    cities: ["London", "Dublin", "Lisbon"],
    group: "europe-africa",
  },
  {
    iana: "Europe/Paris",
    abbrs: ["CET", "CEST"],
    cities: ["Paris", "Berlin", "Madrid", "Rome", "Amsterdam"],
    group: "europe-africa",
  },
  {
    iana: "Europe/Helsinki",
    abbrs: ["EET", "EEST"],
    cities: ["Helsinki", "Kyiv", "Tallinn", "Riga", "Vilnius"],
    group: "europe-africa",
  },
  {
    iana: "Europe/Istanbul",
    abbrs: ["TRT"],
    cities: ["Istanbul", "Ankara"],
    group: "europe-africa",
  },
  {
    iana: "Europe/Moscow",
    abbrs: ["MSK"],
    cities: ["Moscow", "St. Petersburg", "Minsk"],
    group: "europe-africa",
  },
  {
    iana: "Europe/Samara",
    abbrs: ["SAMT"],
    cities: ["Samara", "Ulyanovsk"],
    group: "europe-africa",
  },
  {
    iana: "Asia/Yekaterinburg",
    abbrs: ["YEKT"],
    cities: ["Yekaterinburg"],
    group: "europe-africa",
  },
  {
    iana: "Africa/Lagos",
    abbrs: ["WAT"],
    cities: ["Lagos", "Kinshasa", "Luanda"],
    group: "europe-africa",
  },
  {
    iana: "Africa/Cairo",
    abbrs: ["EET"],
    cities: ["Cairo", "Tripoli"],
    group: "europe-africa",
  },
  {
    iana: "Africa/Nairobi",
    abbrs: ["EAT"],
    cities: ["Nairobi", "Addis Ababa", "Kampala"],
    group: "europe-africa",
  },
  {
    iana: "Africa/Johannesburg",
    abbrs: ["SAST"],
    cities: ["Johannesburg", "Cape Town", "Harare"],
    group: "europe-africa",
  },
  {
    iana: "Asia/Dubai",
    abbrs: ["GST"],
    cities: ["Dubai", "Abu Dhabi", "Muscat"],
    group: "europe-africa",
  },
  {
    iana: "Asia/Tehran",
    abbrs: ["IRST", "IRDT"],
    cities: ["Tehran", "Mashhad"],
    group: "europe-africa",
  },
  {
    iana: "Asia/Kabul",
    abbrs: ["AFT"],
    cities: ["Kabul"],
    group: "europe-africa",
  },

  // Asia
  {
    iana: "Asia/Karachi",
    abbrs: ["PKT"],
    cities: ["Karachi", "Lahore", "Islamabad"],
    group: "asia",
  },
  {
    iana: "Asia/Kolkata",
    abbrs: ["IST"],
    cities: ["Mumbai", "Delhi", "Bangalore", "Kolkata"],
    group: "asia",
  },
  {
    iana: "Asia/Kathmandu",
    abbrs: ["NPT"],
    cities: ["Kathmandu"],
    group: "asia",
  },
  {
    iana: "Asia/Dhaka",
    abbrs: ["BST"],
    cities: ["Dhaka", "Almaty"],
    group: "asia",
  },
  {
    iana: "Asia/Yangon",
    abbrs: ["MMT"],
    cities: ["Yangon"],
    group: "asia",
  },
  {
    iana: "Asia/Bangkok",
    abbrs: ["ICT"],
    cities: ["Bangkok", "Ho Chi Minh City", "Jakarta"],
    group: "asia",
  },
  {
    iana: "Asia/Singapore",
    abbrs: ["SGT"],
    cities: ["Singapore", "Kuala Lumpur", "Manila", "Perth"],
    group: "asia",
  },
  {
    iana: "Asia/Shanghai",
    abbrs: ["CST"],
    cities: ["Shanghai", "Beijing", "Chongqing", "Taipei"],
    group: "asia",
  },
  {
    iana: "Asia/Tokyo",
    abbrs: ["JST"],
    cities: ["Tokyo", "Osaka", "Seoul", "Pyongyang"],
    group: "asia",
  },
  {
    iana: "Asia/Hong_Kong",
    abbrs: ["HKT"],
    cities: ["Hong Kong"],
    group: "asia",
  },
  {
    iana: "Asia/Novosibirsk",
    abbrs: ["NOVT"],
    cities: ["Novosibirsk"],
    group: "asia",
  },
  {
    iana: "Asia/Krasnoyarsk",
    abbrs: ["KRAT"],
    cities: ["Krasnoyarsk"],
    group: "asia",
  },
  {
    iana: "Asia/Irkutsk",
    abbrs: ["IRKT"],
    cities: ["Irkutsk"],
    group: "asia",
  },
  {
    iana: "Asia/Yakutsk",
    abbrs: ["YAKT"],
    cities: ["Yakutsk"],
    group: "asia",
  },
  {
    iana: "Asia/Vladivostok",
    abbrs: ["VLAT"],
    cities: ["Vladivostok"],
    group: "asia",
  },
  {
    iana: "Asia/Magadan",
    abbrs: ["MAGT"],
    cities: ["Magadan"],
    group: "asia",
  },
  {
    iana: "Asia/Kamchatka",
    abbrs: ["PETT"],
    cities: ["Petropavlovsk-Kamchatsky"],
    group: "asia",
  },

  // Pacific
  {
    iana: "Pacific/Auckland",
    abbrs: ["NZST", "NZDT"],
    cities: ["Auckland", "Wellington"],
    group: "pacific",
  },
  {
    iana: "Pacific/Fiji",
    abbrs: ["FJT"],
    cities: ["Suva"],
    group: "pacific",
  },
  {
    iana: "Pacific/Guam",
    abbrs: ["ChST"],
    cities: ["Guam", "Saipan"],
    group: "pacific",
  },
  {
    iana: "Pacific/Port_Moresby",
    abbrs: ["PGT"],
    cities: ["Port Moresby"],
    group: "pacific",
  },
  {
    iana: "Australia/Sydney",
    abbrs: ["AEST", "AEDT"],
    cities: ["Sydney", "Melbourne", "Canberra"],
    group: "pacific",
  },
  {
    iana: "Australia/Brisbane",
    abbrs: ["AEST"],
    cities: ["Brisbane"],
    group: "pacific",
  },
  {
    iana: "Australia/Adelaide",
    abbrs: ["ACST", "ACDT"],
    cities: ["Adelaide"],
    group: "pacific",
  },
  {
    iana: "Australia/Darwin",
    abbrs: ["ACST"],
    cities: ["Darwin"],
    group: "pacific",
  },
  {
    iana: "Australia/Perth",
    abbrs: ["AWST"],
    cities: ["Perth"],
    group: "pacific",
  },
  {
    iana: "Pacific/Tongatapu",
    abbrs: ["TOT"],
    cities: ["Nuku'alofa"],
    group: "pacific",
  },
  {
    iana: "Pacific/Apia",
    abbrs: ["WST"],
    cities: ["Apia"],
    group: "pacific",
  },
  {
    iana: "Pacific/Pago_Pago",
    abbrs: ["SST"],
    cities: ["Pago Pago"],
    group: "pacific",
  },
];
