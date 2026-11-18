/**
 * Builds the JSON served under /datasets from the snapshots committed in
 * scripts/datasets/sources/ (refresh those with `pnpm datasets:fetch`).
 *
 *   pnpm datasets:build
 *
 * Output goes to src/data/datasets/{name}.json. Every value the build drops or
 * resolves is reported on stdout, and the build fails outright when a source
 * stops looking the way the rules below assume, rather than emitting a quietly
 * wrong file.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = path.join(ROOT, "scripts/datasets/sources");
const OUT = path.join(ROOT, "src/data/datasets");

// ── Periodic table: layout ───────────────────────────────────────────────────

/** Last atomic number of each period. */
const PERIOD_ENDS = [2, 10, 18, 36, 54, 86, 118];

/**
 * Period, group, block, and position in the conventional 18-column layout are
 * fixed by atomic number, so they are derived rather than read from Wikidata.
 * Group 3 follows the IUPAC 2021 recommendation (Sc, Y, Lu, Lr): La–Yb and
 * Ac–No form the f-block, have no group, and sit on grid rows 9 and 10.
 */
function layout(z) {
  const period = PERIOD_ENDS.findIndex((end) => z <= end) + 1;
  const start = period === 1 ? 1 : PERIOD_ENDS[period - 2] + 1;
  const length = PERIOD_ENDS[period - 1] - start + 1;
  const pos = z - start + 1;
  const main = (group, block) => ({
    period,
    group,
    block,
    grid_row: period,
    grid_column: group,
  });

  if (period === 1) return main(pos === 1 ? 1 : 18, "s");
  if (pos <= 2) return main(pos, "s");

  if (length === 8) return main(pos + 10, "p");
  if (length === 18) return main(pos, pos <= 12 ? "d" : "p");

  // 32-element periods: 14 f-block elements after the s-block.
  if (pos <= 16) {
    return {
      period,
      group: null,
      block: "f",
      grid_row: period + 3,
      grid_column: pos,
    };
  }

  const group = pos - 14;

  return main(group, group <= 12 ? "d" : "p");
}

// ── Periodic table: electron configurations ─────────────────────────────────

const NOBLE_GASES = [
  ["He", 2],
  ["Ne", 10],
  ["Ar", 18],
  ["Kr", 36],
  ["Xe", 54],
  ["Rn", 86],
];
const L_ORDER = "spdf";
const SUPERSCRIPTS = "⁰¹²³⁴⁵⁶⁷⁸⁹";

/**
 * Aufbau (Madelung) filling order, which is how noble-gas cores fill: by n + l,
 * then by n (1s 2s 2p 3s 3p 4s 3d 4p …).
 */
const AUFBAU = [];

for (let sum = 1; sum <= 8; sum++) {
  for (let n = 1; n <= sum; n++) {
    const l = sum - n;

    if (l < n && l < 4) AUFBAU.push(`${n}${L_ORDER[l]}`);
  }
}

function capacity(subshell) {
  return 4 * L_ORDER.indexOf(subshell[1]) + 2;
}

/** Full subshell occupancy of a noble gas, e.g. Ne → {1s:2, 2s:2, 2p:6}. */
function nobleCore(electrons) {
  const core = new Map();
  let left = electrons;

  for (const subshell of AUFBAU) {
    if (left === 0) break;

    const take = Math.min(capacity(subshell), left);

    core.set(subshell, take);
    left -= take;
  }

  return core;
}

/**
 * Parses a Wikidata configuration — either full ("1s² 2s² 2p⁶ 3s¹") or with
 * a noble-gas core ("[Ne] 3s¹"), in any subshell order — into occupancies.
 */
function parseConfiguration(raw) {
  // ¹²³ are Latin-1 (U+00B9, U+00B2, U+00B3), not in the U+2070 block, so
  // map by lookup rather than by code point range.
  const text = [...raw]
    .map((c) => (SUPERSCRIPTS.includes(c) ? SUPERSCRIPTS.indexOf(c) : c))
    .join("");
  const occupancy = new Map();

  for (const token of text.trim().split(/\s+/)) {
    const core = /^\[(\w+)\]$/.exec(token);

    if (core) {
      const gas = NOBLE_GASES.find(([symbol]) => symbol === core[1]);

      if (!gas) return null;

      for (const [subshell, count] of nobleCore(gas[1])) {
        occupancy.set(subshell, count);
      }

      continue;
    }

    const m = /^([1-7][spdf])(\d+)$/.exec(token);

    if (!m || occupancy.has(m[1]) || Number(m[2]) > capacity(m[1])) {
      return null;
    }

    occupancy.set(m[1], Number(m[2]));
  }

  return occupancy;
}

/**
 * Canonical form: the largest noble-gas core the configuration contains, then
 * the remaining subshells ordered by n and then l, the way NIST writes them
 * ("[Ar] 3d6 4s2", "[Xe] 4f14 5d10 6s1").
 */
function formatConfiguration(occupancy) {
  const total = [...occupancy.values()].reduce((a, b) => a + b, 0);
  let core = null;

  for (const [symbol, electrons] of NOBLE_GASES) {
    const subshells = nobleCore(electrons);

    // A noble gas is written out in full, not as its own core ("[Ne]").
    if (electrons >= total) break;

    if ([...subshells].every(([s, n]) => occupancy.get(s) === n)) {
      core = { symbol, subshells };
    }
  }

  const rest = [...occupancy]
    .filter(([s]) => !core?.subshells.has(s))
    .sort(
      ([a], [b]) =>
        a[0] - b[0] || L_ORDER.indexOf(a[1]) - L_ORDER.indexOf(b[1]),
    )
    .map(([s, n]) => `${s}${n}`);

  return [...(core ? [`[${core.symbol}]`] : []), ...rest].join(" ");
}

// ── Periodic table: reading Wikidata statements ─────────────────────────────

/** Units the build accepts per kind of quantity, converted to the output unit. */
const TO_KELVIN = {
  Q11579: (v) => v, // kelvin
  Q25267: (v) => v + 273.15, // degree Celsius
  Q42289: (v) => ((v - 32) * 5) / 9 + 273.15, // degree Fahrenheit
};
const UNITS = {
  temperature: TO_KELVIN,
  mass: { Q483261: (v) => v }, // dalton
  density: {
    Q844211: (v) => v, // kg/m³
    Q13147228: (v) => v * 1000, // g/cm³
  },
  energy: {
    Q83327: (v) => v, // electronvolt
    Q752197: (v) => v / 96.48533212, // kJ/mol → eV per atom
  },
  length: { Q192274: (v) => v }, // picometre
  thermalConductivity: { Q1463969: (v) => v }, // W/(m·K)
  electricalConductivity: {
    Q80842107: (v) => v, // siemens per metre
    Q20966435: (v) => v, // ampere per volt metre (identical)
  },
  specificHeat: {
    Q3085309: (v) => v, // J/(kg·K)
    Q69423273: (v) => v, // J/(kg·K) "difference" (identical)
  },
  speed: { Q182429: (v) => v }, // m/s
  dimensionless: { 1: (v) => v },
};

/**
 * Physically plausible bounds per field, in output units. Wikidata has a few
 * entry errors (Oganesson's ionization energy entered as 860100 kJ/mol rather
 * than 860.1, Americium's specific heat in J/(g·K) labelled J/(kg·K)); values
 * outside these bounds are dropped rather than served.
 */
const BOUNDS = {
  atomic_weight: [1, 300],
  melting_point: [0.5, 4500],
  boiling_point: [3, 7000],
  density: [0.05, 25000],
  electronegativity: [0.6, 4], // Pauling: Fr 0.7 … F 3.98
  ionization_energy: [3, 30], // eV: Cs 3.89 … He 24.6
  atomic_radius: [20, 400],
  covalent_radius: [20, 400],
  thermal_conductivity: [1e-3, 3000],
  electrical_conductivity: [1e-12, 1e9],
  specific_heat: [50, 20000],
  speed_of_sound: [100, 20000],
  mohs_hardness: [0.1, 10],
};

/**
 * Determination method for values computed by density functional theory
 * rather than measured. Wikidata's elastic moduli are all DFT (so they aren't
 * served at all), as are many of its densities — 0 K crystal values that
 * disagree with measured bulk densities and give gases solid densities.
 */
const COMPUTED_DFT = "Q1048589";

function isMeasured(statement) {
  return !qualifierItems(statement, "P459").includes(COMPUTED_DFT);
}

/** Allotrope used when Wikidata gives several (the standard reference state). */
const REFERENCE_ALLOTROPE = { 6: "Q5309" }; // carbon → graphite

const PHASE_ITEMS = { Q11438: "solid", Q11435: "liquid", Q11432: "gas" };

const EXCLUSIONS_FILE = path.join(SOURCES, "periodic_table.exclusions.json");

class Report {
  constructor() {
    this.lines = [];
  }

  add(element, field, message) {
    this.lines.push(
      `  ${element.symbol ?? element.atomic_number} ${field}: ${message}`,
    );
  }
}

function statements(element, pid) {
  return (element.claims[pid] ?? []).filter((s) => s.rank !== "deprecated");
}

/** Narrows to preferred-rank statements when there are any, per Wikidata. */
function byRank(list) {
  const preferred = list.filter((s) => s.rank === "preferred");

  return preferred.length > 0 ? preferred : list;
}

function qualifierItems(statement, pid) {
  return (statement.qualifiers?.[pid] ?? []).map((q) => q.item).filter(Boolean);
}

function round(value) {
  return Number(value.toPrecision(10));
}

/**
 * Decimal places kept after unit conversion, so °F → K and kJ/mol → eV don't
 * leak float noise (1220 °F is 933.15 K, not 933.1500000000001).
 */
const DECIMALS = { temperature: 2, energy: 4 };

/**
 * Picks one number for a field. Preferred-rank statements win outright.
 * Otherwise the value most statements agree on (within 1%) wins — the same
 * fact is often entered in K, °C, and °F, and a typo in one copy is outvoted
 * by the others. With no majority the field is null rather than a coin flip.
 */
function pickNumber(
  element,
  field,
  pid,
  unitKind,
  report,
  filter = () => true,
) {
  const converters = UNITS[unitKind];
  const candidates = [];
  const usable = statements(element, pid).filter(
    (s) => isMeasured(s) && filter(s),
  );

  for (const statement of byRank(usable)) {
    const { amount, unit } = statement.value;

    if (amount === undefined) continue;

    const convert = converters[unit];

    if (!convert) {
      report.add(
        element,
        field,
        `dropped ${amount} in unsupported unit ${unit}`,
      );
      continue;
    }

    const converted = convert(Number(amount));
    const value =
      unitKind in DECIMALS
        ? Number(converted.toFixed(DECIMALS[unitKind]))
        : converted;
    const [min, max] = BOUNDS[field];

    if (value < min || value > max) {
      report.add(element, field, `dropped implausible ${round(value)}`);
      continue;
    }

    candidates.push(value);
  }

  if (candidates.length === 0) return null;

  const close = (a, b) =>
    Math.abs(a - b) <= 0.01 * Math.max(Math.abs(a), Math.abs(b));
  const support = candidates.map(
    (v) => candidates.filter((w) => close(v, w)).length,
  );
  const best = Math.max(...support);
  const winners = candidates.filter((_, i) => support[i] === best);

  if (!winners.every((v) => close(v, winners[0]))) {
    report.add(
      element,
      field,
      `no majority among ${candidates.map(round).join(", ")}; null`,
    );

    return null;
  }

  if (candidates.length > winners.length) {
    report.add(
      element,
      field,
      `chose ${round(winners[0])} over ${candidates
        .filter((v) => !close(v, winners[0]))
        .map(round)
        .join(", ")}`,
    );
  }

  return round(winners[0]);
}

function pickString(element, pid) {
  const values = [
    ...new Set(byRank(statements(element, pid)).map((s) => s.value.string)),
  ].filter(Boolean);

  return values.length === 1 ? values[0] : null;
}

/** Current symbol: preferred rank, else a non-deprecated one with no end date. */
function pickSymbol(element) {
  const current = statements(element, "P246").filter(
    (s) => !s.qualifiers?.P582,
  );
  const values = [...new Set(byRank(current).map((s) => s.value.string))];

  if (values.length !== 1) {
    throw new Error(`Element ${element.atomic_number}: symbols ${values}`);
  }

  return values[0];
}

function pickConfiguration(element, report) {
  const forms = statements(element, "P8000").map((s) => s.value.string);
  const parsed = forms.map(parseConfiguration);

  if (parsed.length === 0 || parsed.some((p) => p === null)) {
    throw new Error(
      `Element ${element.atomic_number}: unparseable configuration ${forms}`,
    );
  }

  const formatted = [...new Set(parsed.map(formatConfiguration))];

  if (formatted.length !== 1) {
    throw new Error(
      `Element ${element.atomic_number}: configurations disagree ${formatted}`,
    );
  }

  const electrons = [...parsed[0].values()].reduce((a, b) => a + b, 0);

  if (electrons !== element.atomic_number) {
    throw new Error(
      `Element ${element.atomic_number}: configuration ${formatted[0]} has ${electrons} electrons`,
    );
  }

  return formatted[0];
}

/**
 * Standard state at 25 °C and 1 atm, from the melting and boiling points. Null
 * when they can't decide it (e.g. no data for a superheavy element).
 */
function standardState(meltingPoint, boilingPoint) {
  const ambient = 298.15;

  if (meltingPoint !== null && meltingPoint > ambient) return "solid";
  if (boilingPoint !== null && boilingPoint <= ambient) return "gas";
  if (meltingPoint !== null && boilingPoint !== null) return "liquid";

  return null;
}

/**
 * Density in the element's standard state. Wikidata often lists only the
 * density of a condensed phase for gases (chlorine as a solid at 0 K), which
 * would be wrong to serve as "the" density, so a value is only accepted when
 * its phase qualifier matches the standard state.
 */
function pickDensity(element, state, report) {
  if (state === null) return null;

  const allotrope = REFERENCE_ALLOTROPE[element.atomic_number];

  return pickNumber(element, "density", "P2054", "density", report, (s) => {
    const phases = qualifierItems(s, "P515").map((id) => PHASE_ITEMS[id]);
    const parts = qualifierItems(s, "P518");

    if (allotrope && parts.length > 0 && !parts.includes(allotrope)) {
      return false;
    }

    if (phases.length > 0 ? !phases.includes(state) : state === "gas") {
      return false;
    }

    // Phase qualifiers are sometimes wrong (a liquid density tagged as gas),
    // so also require a magnitude that fits the phase. The densest gas at
    // standard conditions (radon) is under 10 kg/m³; the lightest solid or
    // liquid element (lithium) is over 500.
    const { amount, unit } = s.value;
    const kgPerM3 = UNITS.density[unit]?.(Number(amount));

    return (
      kgPerM3 === undefined || (state === "gas" ? kgPerM3 < 20 : kgPerM3 > 100)
    );
  });
}

function pickCrystalSystem(element, labels) {
  const systems = new Set(
    byRank(statements(element, "P556")).map((s) =>
      labels[s.value.item]
        ?.replace(/ crystal system$/, "")
        .replace(/^(face|body)-centered /, ""),
    ),
  );

  return systems.size === 1 ? [...systems][0] : null;
}

function oxidationStates(element, preferredOnly) {
  const list = statements(element, "P1121").filter(
    (s) => !preferredOnly || s.rank === "preferred",
  );

  return [...new Set(list.map((s) => Number(s.value.amount)))].sort(
    (a, b) => a - b,
  );
}

/** Year of discovery; preferred rank, else the earliest. Negative is BCE. */
function discoveryYear(element) {
  const years = byRank(statements(element, "P575"))
    .map((s) => s.value.time)
    .filter(Boolean)
    .map((t) => Number(/^([+-]\d+)/.exec(t)[1]));

  return years.length > 0 ? Math.min(...years) : null;
}

function discoverers(element, labels) {
  return [
    ...new Set(
      statements(element, "P61")
        .map((s) => (s.value.item ? labels[s.value.item] : null))
        .filter(Boolean),
    ),
  ];
}

function capitalize(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Values excluded after cross-checking against an independent reference (see
 * scripts/qa-datasets.mjs). Some Wikidata errors are entered only once, so the
 * majority rule can't see them (fluorine's ionization energy is entered as
 * 15.7 eV; it is 17.42). Excluded values become null.
 */
function loadExclusions() {
  if (!fs.existsSync(EXCLUSIONS_FILE)) return [];

  return JSON.parse(fs.readFileSync(EXCLUSIONS_FILE, "utf-8")).exclusions;
}

export function buildPeriodicTable(report, { applyExclusions = true } = {}) {
  const exclusions = applyExclusions ? loadExclusions() : [];
  const snapshot = JSON.parse(
    fs.readFileSync(
      path.join(SOURCES, "periodic_table.wikidata.json"),
      "utf-8",
    ),
  );
  const { elements, labels } = snapshot;

  if (elements.length !== 118) {
    throw new Error(`Expected 118 elements, got ${elements.length}`);
  }

  const records = elements.map((element, i) => {
    const z = element.atomic_number;

    if (z !== i + 1) throw new Error(`Element ${i + 1} is ${z}`);

    element.symbol = pickSymbol(element);

    const firstIonization = (s) =>
      (s.qualifiers?.P1545 ?? []).some((q) => q.string === "1");
    const num = (field, pid, unitKind, filter) =>
      pickNumber(element, field, pid, unitKind, report, filter);
    const meltingPoint = num("melting_point", "P2101", "temperature");
    const boilingPoint = num("boiling_point", "P2102", "temperature");
    const state = standardState(meltingPoint, boilingPoint);
    const atomicWeight = num("atomic_weight", "P2067", "mass");

    if (!element.label || atomicWeight === null) {
      throw new Error(`Element ${z} is missing its name or atomic weight`);
    }

    return {
      atomic_number: z,
      symbol: element.symbol,
      name: capitalize(element.label),
      ...layout(z),
      atomic_weight: atomicWeight,
      electron_configuration: pickConfiguration(element, report),
      oxidation_states: oxidationStates(element, false),
      common_oxidation_states: oxidationStates(element, true),
      standard_state: state,
      crystal_system: pickCrystalSystem(element, labels),

      melting_point: meltingPoint,
      boiling_point: boilingPoint,
      density: pickDensity(element, state, report),
      specific_heat: num("specific_heat", "P2056", "specificHeat"),
      thermal_conductivity: num(
        "thermal_conductivity",
        "P2068",
        "thermalConductivity",
      ),
      electrical_conductivity: num(
        "electrical_conductivity",
        "P2055",
        "electricalConductivity",
      ),
      speed_of_sound: num("speed_of_sound", "P2075", "speed"),

      electronegativity: num("electronegativity", "P1108", "dimensionless"),
      ionization_energy: num(
        "ionization_energy",
        "P2260",
        "energy",
        firstIonization,
      ),
      atomic_radius: num("atomic_radius", "P14936", "length"),
      covalent_radius: num("covalent_radius", "P14937", "length"),

      mohs_hardness: num("mohs_hardness", "P1088", "dimensionless"),

      discovery_year: discoveryYear(element),
      discovered_by: discoverers(element, labels),

      cas_number: pickString(element, "P231"),
      pubchem_cid: Number(pickString(element, "P662")) || null,
      ec_number: pickString(element, "P232"),
      wikidata_id: element.id,
    };
  });

  for (const { atomic_number: z, field, value, reason } of exclusions) {
    const record = records[z - 1];

    // An exclusion pins the exact value it rejected, so a corrected upstream
    // value is served again instead of being dropped by a stale entry.
    if (record[field] === value) {
      record[field] = null;
      report.add(record, field, `excluded ${value}: ${reason}`);
    }
  }

  return { retrieved_at: snapshot.retrieved_at, records };
}

// ── Main ─────────────────────────────────────────────────────────────────────

export { Report };

const BUILDERS = {
  periodic_table: buildPeriodicTable,
};

function main() {
  fs.mkdirSync(OUT, { recursive: true });

  for (const [name, build] of Object.entries(BUILDERS)) {
    const report = new Report();
    const output = build(report);
    const { records } = output;
    const file = path.join(OUT, `${name}.json`);

    fs.writeFileSync(file, `${JSON.stringify(output, null, 2)}\n`);
    console.log(
      `${name}: ${records.length} records → ${path.relative(ROOT, file)}`,
    );
    if (report.lines.length > 0) {
      console.log(
        `${name}: resolved or dropped values\n${report.lines.join("\n")}`,
      );
    }
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
