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
  url: string;
  /** The upstream's license, which is what allows us to relicense. */
  license: string;
  retrieved_at: string;
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

// ── Registry ─────────────────────────────────────────────────────────────────

export const DATASETS: Dataset[] = [PERIODIC_TABLE];

export function getDataset(name: string): Dataset | undefined {
  return DATASETS.find((d) => d.name === name);
}
