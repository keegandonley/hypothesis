import periodicTableRecords from "@/data/datasets/periodic_table.json";

/**
 * Sample datasets served as JSON under /datasets/{name}. Records are generated
 * by scripts/build-datasets.mjs from raw sources committed alongside it; this
 * module only describes them.
 */

export type FieldType =
  | "integer"
  | "number"
  | "string"
  | "boolean"
  | "string[]";

export interface DatasetField {
  name: string;
  type: FieldType;
  /** Whether any record may carry null for this field. */
  nullable: boolean;
  /** Unit of numeric values, or null when dimensionless / not applicable. */
  unit: string | null;
  description: string;
}

export interface DatasetSource {
  title: string;
  author: string;
  url: string;
  /** Where the data was actually downloaded from, when it differs from url. */
  via?: string;
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
  source: DatasetSource;
  license: DatasetLicense;
  /** Field each record is addressed by in /datasets/{name}/{key}. */
  primaryKey: string;
  /** Human-readable description of what {key} accepts. */
  lookupDescription: string;
  fields: DatasetField[];
  /** Changes made relative to the source, so consumers can audit them. */
  corrections: string[];
  records: DatasetRecord[];
  lookup: (key: string) => DatasetRecord | undefined;
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
  f("name", "string", null, "IUPAC element name (American spelling).", false),
  f(
    "alternate_names",
    "string[]",
    null,
    "Other names: Latin roots, British spellings, and the systematic placeholder names elements 112–118 carried before being named.",
    false,
  ),
  f(
    "atomic_weight",
    "number",
    "u",
    "Standard atomic weight. For elements with no stable isotope, the mass number of a long-lived isotope.",
  ),
  f("period", "integer", null, "Period (row) in the periodic table.", false),
  f(
    "group",
    "integer",
    null,
    "IUPAC group, 1–18. Null for the f-block elements outside group 3.",
  ),
  f("block", "string", null, "Electron block: s, p, d, or f.", false),
  f(
    "grid_row",
    "integer",
    null,
    "Row in the conventional 18-column layout. Lanthanides sit on row 9 and actinides on row 10; row 8 is the gap above them.",
    false,
  ),
  f(
    "grid_column",
    "integer",
    null,
    "Column in the conventional 18-column layout, 1–18.",
    false,
  ),
  f(
    "electron_configuration",
    "string",
    null,
    'Ground-state electron configuration, noble-gas core in brackets, e.g. "[Ar] 3d6 4s2".',
    false,
  ),
  f(
    "term_symbol",
    "string",
    null,
    'Ground-state term symbol, e.g. "2S1/2".',
    false,
  ),
  f("valence", "integer", null, "Typical valence."),
  f("phase", "string", null, "Phase at STP: Solid, Liquid, or Gas."),
  f("color", "string", null, "Color of the pure element."),
  f("gas_phase", "string", null, "Monoatomic or Diatomic, for gases."),
  f(
    "radioactive",
    "boolean",
    null,
    "Whether the element has no stable isotope.",
    false,
  ),
  f(
    "half_life",
    "number",
    "s",
    "Half-life of the longest-lived isotope. Null for stable elements.",
  ),
  f(
    "lifetime",
    "number",
    "s",
    "Mean lifetime of the longest-lived isotope. Null for stable elements.",
  ),
  f("decay_mode", "string", null, "Primary decay mode, e.g. AlphaEmission."),

  f("melting_point", "number", "K", "Melting point."),
  f("boiling_point", "number", "K", "Boiling point."),
  f("critical_pressure", "number", "Pa", "Critical pressure."),
  f("critical_temperature", "number", "K", "Critical temperature."),
  f("heat_of_fusion", "number", "kJ/mol", "Enthalpy of fusion."),
  f("heat_of_vaporization", "number", "kJ/mol", "Enthalpy of vaporization."),
  f("heat_of_combustion", "number", "kJ/mol", "Enthalpy of combustion."),
  f("specific_heat", "number", "J/(kg·K)", "Specific heat capacity."),
  f(
    "adiabatic_index",
    "number",
    null,
    "Heat capacity ratio (Cp/Cv), for gases.",
  ),
  f("thermal_conductivity", "number", "W/(m·K)", "Thermal conductivity."),
  f("thermal_expansion", "number", "1/K", "Linear thermal expansion."),
  f("neel_point", "number", "K", "Néel temperature."),
  f("curie_point", "number", "K", "Curie temperature."),
  f(
    "superconducting_point",
    "number",
    "K",
    "Superconducting transition temperature.",
  ),

  f("density", "number", "kg/m³", "Density at STP."),
  f("density_liquid", "number", "kg/m³", "Density at the melting point."),
  f("molar_volume", "number", "m³/mol", "Molar volume."),
  f("mohs_hardness", "number", null, "Mohs hardness, 1–10 scale."),
  f("brinell_hardness", "number", "Pa", "Brinell hardness."),
  f("vickers_hardness", "number", "Pa", "Vickers hardness."),
  f("bulk_modulus", "number", "Pa", "Bulk modulus."),
  f("shear_modulus", "number", "Pa", "Shear modulus."),
  f("young_modulus", "number", "Pa", "Young's modulus."),
  f("poisson_ratio", "number", null, "Poisson's ratio."),
  f("refractive_index", "number", null, "Refractive index."),
  f("speed_of_sound", "number", "m/s", "Speed of sound."),

  f("electronegativity", "number", null, "Pauling electronegativity."),
  f("electron_affinity", "number", "kJ/mol", "Electron affinity."),
  f("atomic_radius", "number", "m", "Atomic radius."),
  f("covalent_radius", "number", "m", "Covalent radius."),
  f("van_der_waals_radius", "number", "m", "Van der Waals radius."),

  f(
    "electrical_type",
    "string",
    null,
    "Conductor, Semiconductor, or Insulator.",
  ),
  f("electrical_conductivity", "number", "S/m", "Electrical conductivity."),
  f("resistivity", "number", "Ω·m", "Electrical resistivity."),
  f(
    "magnetic_type",
    "string",
    null,
    "Diamagnetic, Paramagnetic, Ferromagnetic, or Antiferromagnetic.",
  ),
  f(
    "mass_magnetic_susceptibility",
    "number",
    "m³/kg",
    "Mass magnetic susceptibility.",
  ),
  f(
    "molar_magnetic_susceptibility",
    "number",
    "m³/mol",
    "Molar magnetic susceptibility.",
  ),
  f(
    "volume_magnetic_susceptibility",
    "number",
    null,
    "Volume magnetic susceptibility (SI, dimensionless).",
  ),

  f(
    "space_group_name",
    "string",
    null,
    'Crystal space group, Hermann–Mauguin notation with "-" for an overbar, e.g. "Fm-3m".',
  ),
  f("space_group_number", "integer", null, "Crystal space group number."),

  f("percent_in_universe", "number", "%", "Abundance in the universe."),
  f("percent_in_sun", "number", "%", "Abundance in the Sun."),
  f("percent_in_meteorites", "number", "%", "Abundance in meteorites."),
  f("percent_in_earths_crust", "number", "%", "Abundance in Earth's crust."),
  f("percent_in_oceans", "number", "%", "Abundance in the oceans."),
  f("percent_in_humans", "number", "%", "Abundance in the human body."),

  f(
    "neutron_cross_section",
    "number",
    "b",
    "Thermal neutron capture cross section, in barns.",
  ),
  f(
    "neutron_mass_absorption",
    "number",
    null,
    "Neutron mass absorption coefficient. The source does not state a unit.",
  ),

  f("autoignition_point", "number", "K", "Autoignition temperature."),
  f("flashpoint", "number", "K", "Flash point."),
  f("nfpa_fire_rating", "integer", null, "NFPA 704 flammability, 0–4."),
  f("nfpa_health_rating", "integer", null, "NFPA 704 health hazard, 0–4."),
  f("nfpa_reactivity_rating", "integer", null, "NFPA 704 instability, 0–4."),
  f("dot_hazard_class", "string", null, 'US DOT hazard class, e.g. "4.3".'),
  f("dot_numbers", "string", null, "UN/NA number used for DOT shipping."),

  f("cas_number", "string", null, "CAS Registry Number.", false),
  f("pubchem_cid", "integer", null, "PubChem compound ID."),
  f("eu_number", "string", null, "EC (EINECS) number."),
  f("gmelin_number", "integer", null, "Gmelin database number."),
  f("nsc_number", "integer", null, "NCI National Service Center number."),
  f("rtecs_number", "string", null, "RTECS number."),
];

const periodicTable = periodicTableRecords as DatasetRecord[];

const periodicTableIndex = new Map<string, DatasetRecord>();

for (const element of periodicTable) {
  const keys = [
    String(element.atomic_number),
    element.symbol as string,
    element.name as string,
    ...(element.alternate_names as string[]),
  ];

  for (const key of keys) {
    periodicTableIndex.set(key.toLowerCase(), element);
  }
}

const PERIODIC_TABLE: Dataset = {
  name: "periodic_table",
  title: "Periodic table of elements",
  description:
    "All 118 elements with identity, layout, thermal, mechanical, atomic, electromagnetic, abundance, nuclear, and safety properties.",
  source: {
    title: "Properties of the elements",
    author: "Taha Ahmed",
    url: "https://doi.org/10.6084/m9.figshare.1295585.v1",
    via: "https://www.kaggle.com/datasets/mexwell/periodic-table-of-elements",
  },
  license: {
    name: "CC BY 4.0",
    url: "https://creativecommons.org/licenses/by/4.0/",
    attribution:
      '"Properties of the elements" by Taha Ahmed (https://doi.org/10.6084/m9.figshare.1295585.v1), licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Modified: misaligned values corrected, element names updated, units and formatting cleaned.',
  },
  primaryKey: "atomic_number",
  lookupDescription:
    "atomic number, symbol, or name, case-insensitive (26, fe, iron)",
  fields: PERIODIC_TABLE_FIELDS,
  corrections: [
    "Electron configuration, specific heat, and RTECS number were attached to the wrong elements in the source; they are restored to the correct rows.",
    "Elements 112–118 use their IUPAC names and symbols (Copernicium through Oganesson) instead of the systematic placeholders; the old names are kept in alternate_names.",
    "Mohs hardness is divided by 10^6; the source stored it as if it were in pascals.",
    "Melting and boiling points use the source's exact Kelvin columns instead of the copies that had been round-tripped through Celsius.",
    "Space groups use '-' for an overbar instead of the source's underscore-and-newline.",
    "Identifier prefixes (CAS, CID, EU, Gmelin, NSC, RTECS) are stripped.",
  ],
  records: periodicTable,
  lookup: (key) => periodicTableIndex.get(key.toLowerCase()),
};

// ── Registry ─────────────────────────────────────────────────────────────────

export const DATASETS: Dataset[] = [PERIODIC_TABLE];

export function getDataset(name: string): Dataset | undefined {
  return DATASETS.find((d) => d.name === name);
}
