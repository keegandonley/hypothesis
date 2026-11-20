import periodicTableBuild from "@/data/datasets/periodic_table.json";

/**
 * Sample datasets served as JSON under /datasets/{name}. Records are generated
 * by scripts/build-datasets.mjs from source snapshots committed alongside it;
 * this module only describes them.
 */

export type FieldType =
  | "integer"
  | "number"
  | "string"
  | "boolean"
  | "string[]"
  | "integer[]";

export interface DatasetField {
  name: string;
  type: FieldType;
  /** Whether any record may carry null for this field. */
  nullable: boolean;
  /** Unit of numeric values, or null when dimensionless / not applicable. */
  unit: string | null;
  description: string;
}

/** Where the data came from. Provenance only; the license is our own. */
export interface DatasetSource {
  name: string;
  url: string | null;
  /** The upstream's license, which is what allows us to relicense. */
  license: string | null;
  retrieved_at: string | null;
}

export interface DatasetLicense {
  name: string;
  url: string;
  /**
   * Ready-to-paste credit line satisfying the license. Returned in every
   * response body so consumers (including agents that never read headers)
   * always have it alongside the data.
   */
  attribution: string;
}

export type DatasetRecord = Record<string, unknown>;

export interface Dataset {
  name: string;
  title: string;
  description: string;
  license: DatasetLicense;
  source: DatasetSource;
  /** Field each record is addressed by in /datasets/{name}/{key}. */
  primaryKey: string;
  /** Human-readable description of what {key} accepts. */
  lookupDescription: string;
  fields: DatasetField[];
  /** How values were selected and validated, so consumers can judge them. */
  notes: string[];
  records: DatasetRecord[];
  lookup: (key: string) => DatasetRecord | undefined;
}

/**
 * hypothesis.sh is named explicitly rather than via useBranding(): it is the
 * licensor, which doesn't change with the domain a request arrived on.
 */
const LICENSOR = "hypothesis.sh";

function ccBy(title: string, name: string): DatasetLicense {
  return {
    name: "CC BY 4.0",
    url: "https://creativecommons.org/licenses/by/4.0/",
    attribution: `${title} by ${LICENSOR} (https://${LICENSOR}/datasets/${name}), licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).`,
  };
}

// ── Periodic table ───────────────────────────────────────────────────────────

const f = (
  name: string,
  type: FieldType,
  unit: string | null,
  description: string,
  nullable = true,
): DatasetField => ({ name, type, nullable, unit, description });

const PERIODIC_TABLE_FIELDS: DatasetField[] = [
  f("atomic_number", "integer", null, "Number of protons.", false),
  f("symbol", "string", null, "IUPAC chemical symbol.", false),
  f(
    "name",
    "string",
    null,
    "IUPAC element name (IUPAC spellings: Aluminium, Caesium, Sulfur).",
    false,
  ),
  f("period", "integer", null, "Period (row), 1–7.", false),
  f(
    "group",
    "integer",
    null,
    "IUPAC group, 1–18. Null for the f-block (La–Yb, Ac–No), per the IUPAC 2021 layout with Lu and Lr in group 3.",
  ),
  f("block", "string", null, "Electron block: s, p, d, or f.", false),
  f(
    "grid_row",
    "integer",
    null,
    "Row in the conventional 18-column layout. The f-block sits on rows 9 (La–Yb) and 10 (Ac–No); row 8 is the gap above them.",
    false,
  ),
  f(
    "grid_column",
    "integer",
    null,
    "Column in the 18-column layout. For the f-block rows, 3–16.",
    false,
  ),
  f(
    "atomic_weight",
    "number",
    "u",
    "Standard atomic weight. For elements with no stable isotope, the mass of a long-lived isotope.",
    false,
  ),
  f(
    "electron_configuration",
    "string",
    null,
    'Ground-state configuration: largest noble-gas core, then subshells by n and l, e.g. "[Ar] 3d6 4s2". Predicted for superheavy elements.',
    false,
  ),
  f(
    "oxidation_states",
    "integer[]",
    null,
    "All known oxidation states, ascending.",
    false,
  ),
  f(
    "common_oxidation_states",
    "integer[]",
    null,
    "The most common oxidation states, ascending.",
    false,
  ),
  f(
    "standard_state",
    "string",
    null,
    "solid, liquid, or gas at 25 °C and 1 atm, derived from the melting and boiling points.",
  ),
  f(
    "crystal_system",
    "string",
    null,
    "Crystal system of the solid: cubic, hexagonal, trigonal, tetragonal, orthorhombic, or monoclinic.",
  ),
  f("melting_point", "number", "K", "Melting point."),
  f("boiling_point", "number", "K", "Boiling point."),
  f(
    "density",
    "number",
    "kg/m³",
    "Measured density in the standard state. Equal to g/L, so gases read naturally.",
  ),
  f("specific_heat", "number", "J/(kg·K)", "Specific heat capacity."),
  f("thermal_conductivity", "number", "W/(m·K)", "Thermal conductivity."),
  f("electrical_conductivity", "number", "S/m", "Electrical conductivity."),
  f("speed_of_sound", "number", "m/s", "Speed of sound."),
  f("electronegativity", "number", null, "Pauling electronegativity."),
  f("ionization_energy", "number", "eV", "First ionization energy."),
  f("atomic_radius", "number", "pm", "Atomic radius."),
  f("covalent_radius", "number", "pm", "Covalent radius."),
  f("mohs_hardness", "number", null, "Mohs hardness, 0–10 scale."),
  f(
    "discovery_year",
    "integer",
    null,
    "Year of discovery. Negative is BCE, and approximate for elements known since antiquity.",
  ),
  f(
    "discovered_by",
    "string[]",
    null,
    "Credited discoverers. Empty when unknown or ancient.",
    false,
  ),
  f("cas_number", "string", null, "CAS Registry Number."),
  f("pubchem_cid", "integer", null, "PubChem compound ID."),
  f("ec_number", "string", null, "EC (EINECS) number."),
  f(
    "wikidata_id",
    "string",
    null,
    "Wikidata item the record was built from.",
    false,
  ),
];

const periodicTable = periodicTableBuild.records as DatasetRecord[];

/** Common spellings that differ from the IUPAC names used in `name`. */
const PERIODIC_TABLE_ALIASES: Record<string, number> = {
  aluminum: 13,
  sulphur: 16,
  cesium: 55,
};

const periodicTableIndex = new Map<string, DatasetRecord>();

for (const element of periodicTable) {
  for (const key of [element.atomic_number, element.symbol, element.name]) {
    periodicTableIndex.set(String(key).toLowerCase(), element);
  }
}

for (const [alias, z] of Object.entries(PERIODIC_TABLE_ALIASES)) {
  periodicTableIndex.set(alias, periodicTable[z - 1]);
}

const PERIODIC_TABLE: Dataset = {
  name: "periodic_table",
  title: "Periodic table of elements",
  description:
    "All 118 elements: identity and table layout, electron configuration, oxidation states, thermal, electrical, and atomic properties, discovery, and registry identifiers.",
  license: ccBy("Periodic table of elements", "periodic_table"),
  source: {
    name: "Wikidata",
    url: "https://www.wikidata.org",
    license: "CC0 1.0",
    retrieved_at: periodicTableBuild.retrieved_at,
  },
  primaryKey: "atomic_number",
  lookupDescription:
    "atomic number, symbol, or name, case-insensitive (26, fe, iron)",
  fields: PERIODIC_TABLE_FIELDS,
  notes: [
    "Period, group, block, and grid position are derived from the atomic number.",
    "Where Wikidata gives several values, a preferred-rank value wins; otherwise the value most entries agree on (within 1%), and null when there is no majority.",
    "Values computed by density functional theory are excluded, so densities and other properties are measured values.",
    "Values outside physically plausible bounds, or that differ from an independent reference beyond a set tolerance, are excluded as null rather than served.",
    "null always means unknown or excluded, never zero.",
  ],
  records: periodicTable,
  lookup: (key) => periodicTableIndex.get(key.toLowerCase()),
};

// ── FIT activities ───────────────────────────────────────────────────────────

/**
 * Activity recordings served unmodified from public/datasets/fit_activities/.
 * file_size is checked against the files by the tests.
 */
const fitActivities: DatasetRecord[] = [
  {
    id: "fort-worth-trek-100-texas-2025-09-20",
    title: "Fort Worth - Trek 100 Texas 2025-09-20 0721",
    file_size: 1210900,
  },
  {
    id: "friday-ski-2026-01-16",
    title: "Friday Ski 2026-01-16 1027",
    file_size: 313964,
  },
  {
    id: "halfway-house-morses-mill-2026-06-21",
    title: "Halfway House - Morses Mill 2026-06-21 1220",
    file_size: 447844,
  },
  {
    id: "old-west-austin-deep-eddy-2026-05-03",
    title: "Old West Austin - Deep Eddy 2026-05-03 1155",
    file_size: 96936,
  },
].map(({ id, title, file_size }) => ({
  id,
  title,
  file_url: `/datasets/fit_activities/${id}.fit`,
  file_size,
}));

const FIT_ACTIVITIES: Dataset = {
  name: "fit_activities",
  title: "FIT activity recordings",
  description:
    "Real activity recordings in Garmin's FIT format: a road ride, a ski day, a hike, and a run.",
  license: ccBy("FIT activity recordings", "fit_activities"),
  source: {
    name: "Recorded by hypothesis.sh",
    url: null,
    license: null,
    retrieved_at: null,
  },
  primaryKey: "id",
  lookupDescription: "file id (friday-ski-2026-01-16)",
  fields: [
    f("id", "string", null, "Identifier; the file is {id}.fit.", false),
    f("title", "string", null, "Original recording name.", false),
    f("file_url", "string", null, "Download path of the .fit file.", false),
    f("file_size", "integer", "bytes", "Size of the .fit file.", false),
  ],
  notes: ["Files are served exactly as recorded."],
  records: fitActivities,
  lookup: (key) => fitActivities.find((r) => r.id === key.toLowerCase()),
};

// ── Space images ─────────────────────────────────────────────────────────────

/**
 * Generated images served unmodified from public/datasets/space_images/.
 * file_size, width, and height are checked against the files by the tests.
 */
const spaceImages: DatasetRecord[] = [
  {
    id: "gas-giant-warship",
    title: "Gas giant warship",
    description:
      "A dark armored warship in front of an orange, storm-banded ringed gas giant, with a small moon at top right.",
    file_size: 2595367,
  },
  {
    id: "night-side-liner",
    title: "Night side liner",
    description:
      "A sleek white liner over the night side of an Earth-like planet with city lights.",
    file_size: 2377841,
  },
  {
    id: "hurricane-freighter",
    title: "Hurricane freighter",
    description:
      "A container freighter over a blue ocean planet with hurricanes, with the sun on the horizon.",
    file_size: 2713210,
  },
  {
    id: "mars-refinery-ship",
    title: "Mars refinery ship",
    description:
      "A copper refinery ship with tanks and pipes over red canyons and a dust storm.",
    file_size: 2918103,
  },
  {
    id: "ring-station",
    title: "Ring station",
    description: "A ring-shaped station beside a dark planet with a blue rim.",
    file_size: 1829864,
  },
  {
    id: "moon-fleet",
    title: "Moon fleet",
    description:
      "A fleet of dark warships near a cratered moon, with a ring station at top right.",
    file_size: 1883314,
  },
  {
    id: "ice-world-station",
    title: "Ice world station",
    description:
      "A cross-shaped station over a frozen planet with a green aurora.",
    file_size: 3071453,
  },
].map(({ id, title, description, file_size }) => ({
  id,
  title,
  description,
  file_url: `/datasets/space_images/${id}.png`,
  file_size,
  width: 1672,
  height: 941,
}));

const SPACE_IMAGES: Dataset = {
  name: "space_images",
  title: "Space images",
  description:
    "Generated sci-fi images of ships and stations in orbit, as 1672×941 PNGs.",
  license: ccBy("Space images", "space_images"),
  source: {
    name: "Generated for hypothesis.sh",
    url: null,
    license: null,
    retrieved_at: null,
  },
  primaryKey: "id",
  lookupDescription: "file id (moon-fleet)",
  fields: [
    f("id", "string", null, "Identifier; the file is {id}.png.", false),
    f("title", "string", null, "Short title.", false),
    f("description", "string", null, "What the image shows.", false),
    f("file_url", "string", null, "Path of the .png file.", false),
    f("file_size", "integer", "bytes", "Size of the .png file.", false),
    f("width", "integer", "px", "Image width.", false),
    f("height", "integer", "px", "Image height.", false),
  ],
  notes: ["Files are served unmodified."],
  records: spaceImages,
  lookup: (key) => spaceImages.find((r) => r.id === key.toLowerCase()),
};

// ── Registry ─────────────────────────────────────────────────────────────────

export const DATASETS: Dataset[] = [
  PERIODIC_TABLE,
  FIT_ACTIVITIES,
  SPACE_IMAGES,
];

export function getDataset(name: string): Dataset | undefined {
  return DATASETS.find((d) => d.name === name);
}
