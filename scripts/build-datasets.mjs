/**
 * Builds the JSON served under /datasets from the raw sources committed in
 * scripts/datasets/sources/. The sources are kept byte-identical to what was
 * downloaded so every correction below is visible in code review, not hidden
 * in a hand-edited data file.
 *
 *   pnpm datasets:build
 *
 * Output goes to src/data/datasets/{name}.json. The build fails loudly when a
 * source stops looking the way the corrections assume, rather than emitting a
 * quietly wrong file.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = path.join(ROOT, "scripts/datasets/sources");
const OUT = path.join(ROOT, "src/data/datasets");

// ── CSV ──────────────────────────────────────────────────────────────────────

/** RFC 4180 parser. Quoted fields may contain commas, quotes, and newlines. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows;

  return body.map((cells) => {
    if (cells.length !== header.length) {
      throw new Error(
        `CSV row has ${cells.length} cells, header has ${header.length}`,
      );
    }

    return Object.fromEntries(header.map((h, i) => [h, cells[i]]));
  });
}

// ── Cell parsers ─────────────────────────────────────────────────────────────

function fail(row, column, message) {
  throw new Error(`${row.Symbol} ${column}: ${message} (got ${row[column]})`);
}

function str(row, column) {
  const v = row[column].trim();

  return v === "" ? null : v;
}

function num(row, column) {
  const v = str(row, column);

  if (v === null) return null;

  const n = Number(v);

  if (!Number.isFinite(n)) fail(row, column, "not a finite number");

  return n;
}

function int(row, column) {
  const n = num(row, column);

  if (n !== null && !Number.isInteger(n)) fail(row, column, "not an integer");

  return n;
}

/** Strips a fixed prefix the source glued onto identifiers ("CAS1333-74-0"). */
function prefixed(row, column, prefix) {
  const v = str(row, column);

  if (v === null) return null;
  if (!v.startsWith(prefix)) fail(row, column, `missing "${prefix}" prefix`);

  return v.slice(prefix.length);
}

function prefixedInt(row, column, prefix) {
  const v = prefixed(row, column, prefix);

  if (v === null) return null;
  if (!/^\d+$/.test(v)) fail(row, column, "identifier is not numeric");

  return Number(v);
}

// ── Periodic table corrections ───────────────────────────────────────────────

/**
 * IUPAC names adopted after the source was published (112 in 2010, 113–118 in
 * 2016). The source still carries the systematic placeholders, which move to
 * alternate_names so lookups by the old symbol keep a paper trail.
 */
const RENAMED = {
  112: { name: "Copernicium", symbol: "Cn", was: "Ununbium" },
  113: { name: "Nihonium", symbol: "Nh", was: "Ununtrium" },
  114: { name: "Flerovium", symbol: "Fl", was: "Ununquadium" },
  115: { name: "Moscovium", symbol: "Mc", was: "Ununpentium" },
  116: { name: "Livermorium", symbol: "Lv", was: "Ununhexium" },
  117: { name: "Tennessine", symbol: "Ts", was: "Ununseptium" },
  118: { name: "Oganesson", symbol: "Og", was: "Ununoctium" },
};

const NOBLE_CORE = { He: 2, Ne: 10, Ar: 18, Kr: 36, Xe: 54, Rn: 86 };
const SUBSHELL_CAPACITY = { s: 2, p: 6, d: 10, f: 14 };

/**
 * Splits "[He]2s22p3" into its core and subshells. The source concatenates
 * occupancies with the next shell number, so "2s22p3" is read greedily against
 * subshell capacity: an s holds at most 2, so "2s2" ends before the "2p".
 */
function parseConfiguration(config) {
  const match = /^(?:\[(\w+)\])?(.*)$/.exec(config);
  const core = match[1] ?? null;
  const subshells = [];
  let rest = match[2];

  if (core !== null && !(core in NOBLE_CORE)) {
    throw new Error(`Unknown core [${core}] in ${config}`);
  }

  while (rest.length > 0) {
    const head = /^(\d)([spdf])/.exec(rest);

    if (!head) throw new Error(`Unparseable configuration ${config}`);

    const [, n, l] = head;
    const digits = /^\d+/.exec(rest.slice(2))?.[0] ?? "";
    // Prefer the longest occupancy that fits the subshell and leaves the
    // remainder starting at a new subshell (or the end).
    let count = null;

    for (let len = Math.min(digits.length, 2); len >= 1; len--) {
      const candidate = Number(digits.slice(0, len));
      const after = rest.slice(2 + len);

      if (
        candidate >= 1 &&
        candidate <= SUBSHELL_CAPACITY[l] &&
        (after === "" || /^\d[spdf]/.test(after))
      ) {
        count = len;
        break;
      }
    }

    if (count === null) throw new Error(`Unparseable configuration ${config}`);

    subshells.push(`${n}${l}${digits.slice(0, count)}`);
    rest = rest.slice(2 + count);
  }

  const electrons =
    (core ? NOBLE_CORE[core] : 0) +
    subshells.reduce((sum, s) => sum + Number(s.slice(2)), 0);

  return {
    electrons,
    formatted: [core ? `[${core}]` : null, ...subshells]
      .filter(Boolean)
      .join(" "),
  };
}

/**
 * Three upstream columns are scrambled: their values are correct but attached
 * to the wrong rows by an interleaved reshape bug in the 2015 export (Helium
 * carries Promethium's electron configuration, Lithium carries Beryllium's
 * specific heat and RTECS number). All three share one permutation, and every
 * other column is aligned — verified against PubChem and known reference
 * values when this dataset was added.
 */
const SCRAMBLED_COLUMNS = [
  "Electron_Configuration",
  "Specific_Heat",
  "RTECS_Number",
];

/**
 * Recovers the permutation from the configurations themselves: a neutral
 * atom's electron count equals its atomic number, so counting the electrons in
 * the configuration on row i names the element row i's scrambled values belong
 * to. The bijection check makes it self-verifying — if the source is ever fixed
 * this degrades to the identity, and if it breaks differently it throws.
 */
function unscramble(rows) {
  const target = rows.map(
    (row) => parseConfiguration(row.Electron_Configuration).electrons,
  );
  const seen = new Set(target);

  for (let z = 1; z <= rows.length; z++) {
    if (!seen.has(z)) throw new Error(`No configuration has ${z} electrons`);
  }

  const fixed = rows.map((row) => ({ ...row }));

  rows.forEach((row, i) => {
    for (const column of SCRAMBLED_COLUMNS) {
      fixed[target[i] - 1][column] = row[column];
    }
  });

  // Anchors: well-known values that only land here when the permutation is
  // applied to the right columns.
  const anchors = [
    [2, "Specific_Heat", "5193.1"],
    [26, "Specific_Heat", "449"],
    [3, "RTECS_Number", "RTECSOJ5540000"],
    [79, "RTECS_Number", "RTECSMD5070000"],
    [6, "Electron_Configuration", "[He]2s22p2"],
  ];

  for (const [z, column, expected] of anchors) {
    if (fixed[z - 1][column] !== expected) {
      throw new Error(
        `Unscramble anchor failed: element ${z} ${column} is ` +
          `${fixed[z - 1][column]}, expected ${expected}`,
      );
    }
  }

  return fixed;
}

/**
 * Space groups use Mathematica's overbar notation, which the export rendered
 * as an underscore plus a line break ("Fm_\n3m"). Hermann–Mauguin plain text
 * writes the bar as a minus: "Fm-3m".
 */
function spaceGroup(row) {
  const v = str(row, "Space_Group_Name");

  return v === null ? null : v.replace(/_\s*\n\s*/g, "-");
}

/** "7/5" → 1.4. Only gases carry a value. */
function fraction(row, column) {
  const v = str(row, column);

  if (v === null) return null;

  const m = /^(\d+)\/(\d+)$/.exec(v);

  if (!m) fail(row, column, "not a fraction");

  return Number(m[1]) / Number(m[2]);
}

/** HalfLife/Lifetime use "Inf" for stable elements. */
function duration(row, column) {
  const v = str(row, column);

  if (v === "Inf") return null;

  return num(row, column);
}

/** Graph.Period puts the f-block on half-rows (8.5, 9.5) under the table. */
function gridRow(row) {
  const v = num(row, "Graph.Period");

  if (v === 8.5) return 9;
  if (v === 9.5) return 10;
  if (!Number.isInteger(v) || v < 1 || v > 7) {
    fail(row, "Graph.Period", "unexpected layout row");
  }

  return v;
}

function buildPeriodicTable() {
  const raw = parseCsv(
    fs.readFileSync(path.join(SOURCES, "periodic_table.csv"), "utf-8"),
  );

  if (raw.length !== 118) throw new Error(`Expected 118 rows, ${raw.length}`);

  raw.forEach((row, i) => {
    if (Number(row.Atomic_Number) !== i + 1) {
      throw new Error(`Row ${i + 1} is atomic number ${row.Atomic_Number}`);
    }
  });

  return unscramble(raw).map((row) => {
    const z = int(row, "Atomic_Number");
    const renamed = RENAMED[z];
    const halfLife = duration(row, "HalfLife");
    const alternateNames = [
      ...(str(row, "Alternate_Names")?.split(/\s*,\s*/) ?? []),
      ...(renamed ? [renamed.was] : []),
    ];

    if (renamed && row.Name !== renamed.was) {
      fail(row, "Name", `expected placeholder ${renamed.was}`);
    }

    const mohs = num(row, "Mohs_Hardness");

    return {
      atomic_number: z,
      symbol: renamed?.symbol ?? str(row, "Symbol"),
      name: renamed?.name ?? str(row, "Name"),
      alternate_names: alternateNames,
      atomic_weight: num(row, "Atomic_Weight"),
      period: int(row, "Period"),
      group: int(row, "Group"),
      block: str(row, "Block"),
      grid_row: gridRow(row),
      grid_column: int(row, "Graph.Group"),
      electron_configuration: parseConfiguration(row.Electron_Configuration)
        .formatted,
      term_symbol: str(row, "Quantum_Numbers"),
      valence: int(row, "Valence"),
      phase: str(row, "Phase"),
      color: str(row, "Color"),
      gas_phase: str(row, "Gas_phase"),
      radioactive: halfLife !== null,
      half_life: halfLife,
      lifetime: duration(row, "Lifetime"),
      decay_mode: str(row, "Decay_Mode"),

      // Melting_Point/Boiling_Point are the same Kelvin values round-tripped
      // through Celsius (1560 → 1560.15, 4.22 → 4.21999999999997); the
      // Absolute_ columns are the clean originals.
      melting_point: num(row, "Absolute_Melting_Point"),
      boiling_point: num(row, "Absolute_Boiling_Point"),
      critical_pressure: num(row, "Critical_Pressure"),
      critical_temperature: num(row, "Critical_Temperature"),
      heat_of_fusion: num(row, "Heat_of_Fusion"),
      heat_of_vaporization: num(row, "Heat_of_Vaporization"),
      heat_of_combustion: num(row, "Heat_of_Combustion"),
      specific_heat: num(row, "Specific_Heat"),
      adiabatic_index: fraction(row, "Adiabatic_Index"),
      thermal_conductivity: num(row, "Thermal_Conductivity"),
      thermal_expansion: num(row, "Thermal_Expansion"),
      neel_point: num(row, "Neel_Point"),
      curie_point: num(row, "Curie_Point"),
      superconducting_point: num(row, "Superconducting_Point"),

      density: num(row, "Density"),
      density_liquid: num(row, "Density_Liquid"),
      molar_volume: num(row, "Molar_Volume"),
      // Mohs is a dimensionless 1–10 scale; the export scaled it by 10^6 as if
      // it were in pascals (Lithium 6e+05 → 0.6, Tungsten 7.5e+06 → 7.5).
      mohs_hardness: mohs === null ? null : mohs / 1e6,
      brinell_hardness: num(row, "Brinell_Hardness"),
      vickers_hardness: num(row, "Vickers_Hardness"),
      bulk_modulus: num(row, "Bulk_Modulus"),
      shear_modulus: num(row, "Shear_Modulus"),
      young_modulus: num(row, "Young_Modulus"),
      poisson_ratio: num(row, "Poisson_Ratio"),
      refractive_index: num(row, "Refractive_Index"),
      speed_of_sound: num(row, "Speed_of_Sound"),

      electronegativity: num(row, "Electronegativity"),
      electron_affinity: num(row, "ElectronAffinity"),
      atomic_radius: num(row, "Atomic_Radius"),
      covalent_radius: num(row, "Covalent_Radius"),
      van_der_waals_radius: num(row, "Van_der_Waals_Radius"),

      electrical_type: str(row, "Electrical_Type"),
      electrical_conductivity: num(row, "Electrical_Conductivity"),
      resistivity: num(row, "Resistivity"),
      magnetic_type: str(row, "Magnetic_Type"),
      mass_magnetic_susceptibility: num(row, "Mass_Magnetic_Susceptibility"),
      molar_magnetic_susceptibility: num(row, "Molar_Magnetic_Susceptibility"),
      volume_magnetic_susceptibility: num(
        row,
        "Volume_Magnetic_Susceptibility",
      ),

      space_group_name: spaceGroup(row),
      space_group_number: int(row, "Space_Group_Number"),

      percent_in_universe: num(row, "Percent_in_Universe"),
      percent_in_sun: num(row, "Percent_in_Sun"),
      percent_in_meteorites: num(row, "Percent_in_Meteorites"),
      percent_in_earths_crust: num(row, "Percent_in_Earths_Crust"),
      percent_in_oceans: num(row, "Percent_in_Oceans"),
      percent_in_humans: num(row, "Percent_in_Humans"),

      neutron_cross_section: num(row, "Neutron_Cross_Section"),
      neutron_mass_absorption: num(row, "Neutron_Mass_Absorption"),

      autoignition_point: num(row, "Autoignition_Point"),
      flashpoint: num(row, "Flashpoint"),
      nfpa_fire_rating: int(row, "NFPA_Fire_Rating"),
      nfpa_health_rating: int(row, "NFPA_Health_Rating"),
      nfpa_reactivity_rating: int(row, "NFPA_Reactivity_Rating"),
      dot_hazard_class: str(row, "DOT_Hazard_Class"),
      dot_numbers: str(row, "DOT_Numbers"),

      cas_number: prefixed(row, "CAS_Number", "CAS"),
      pubchem_cid: prefixedInt(row, "CID_Number", "CID"),
      eu_number: prefixed(row, "EU_Number", "EU"),
      gmelin_number: prefixedInt(row, "Gmelin_Number", "Gmelin"),
      nsc_number: prefixedInt(row, "NSC_Number", "NSC"),
      rtecs_number: prefixed(row, "RTECS_Number", "RTECS"),
    };
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

const BUILDERS = {
  periodic_table: buildPeriodicTable,
};

fs.mkdirSync(OUT, { recursive: true });

for (const [name, build] of Object.entries(BUILDERS)) {
  const records = build();
  const file = path.join(OUT, `${name}.json`);

  fs.writeFileSync(file, `${JSON.stringify(records, null, 2)}\n`);
  console.log(
    `${name}: ${records.length} records → ${path.relative(ROOT, file)}`,
  );
}
