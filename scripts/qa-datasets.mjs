/**
 * Cross-checks the Wikidata-derived periodic table against an independent
 * reference and records the values that disagree, so the build can exclude
 * them. Runs as part of `pnpm datasets:fetch` (it needs the network); the
 * build itself stays offline and reads only the committed exclusions file.
 *
 * The reference is PubChem's periodic table (NIH/NLM). It is used to *judge*
 * values, never to supply them: the exclusions file records our value, the
 * field, and how far off it is, and nothing from PubChem reaches the served
 * data. That keeps the published dataset purely CC0-sourced and ours to
 * license.
 *
 * Fields without an independent reference (thermal and electrical
 * conductivity, specific heat, elastic moduli, …) are only guarded by the
 * build's internal-consistency and plausibility rules.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildPeriodicTable, Report } from "./build-datasets.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = path.join(
  ROOT,
  "scripts/datasets/sources/periodic_table.exclusions.json",
);
const REFERENCE_URL =
  "https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON";

/**
 * Field → reference column, conversion into our units, and the relative
 * difference tolerated. Tolerances leave room for ordinary disagreement
 * between reputable sources (measurement era, allotrope, temperature) and
 * catch entry errors: wrong element, wrong unit, values rounded to integers.
 */
const CHECKS = {
  melting_point: { column: "MeltingPoint", scale: 1, tolerance: 0.03 },
  boiling_point: { column: "BoilingPoint", scale: 1, tolerance: 0.05 },
  density: { column: "Density", scale: 1000, tolerance: 0.05 }, // g/cm³
  electronegativity: {
    column: "Electronegativity",
    scale: 1,
    tolerance: 0.05,
  },
  // 5%: several reference values predate current NIST measurements (Ta, Os,
  // Fr, Th differ by 3–4% and Wikidata has the newer value), while the entry
  // errors this catches are 10% or more.
  ionization_energy: { column: "IonizationEnergy", scale: 1, tolerance: 0.05 },
};

const res = await fetch(REFERENCE_URL, {
  headers: {
    "User-Agent":
      "hypothesis-datasets/1.0 (https://hypothesis.sh/docs/datasets)",
  },
});

if (!res.ok) throw new Error(`${res.status} fetching ${REFERENCE_URL}`);

const table = (await res.json()).Table;
const columns = table.Columns.Column;
const reference = new Map(
  table.Row.map((row) => {
    const record = Object.fromEntries(columns.map((c, i) => [c, row.Cell[i]]));

    return [Number(record.AtomicNumber), record];
  }),
);

const { records } = buildPeriodicTable(new Report(), {
  applyExclusions: false,
});
const exclusions = [];
let compared = 0;

for (const record of records) {
  const ref = reference.get(record.atomic_number);

  if (!ref) continue;

  for (const [field, { column, scale, tolerance }] of Object.entries(CHECKS)) {
    const ours = record[field];
    const theirs = Number.parseFloat(ref[column]) * scale;

    if (ours === null || !Number.isFinite(theirs) || theirs === 0) continue;

    compared++;

    const difference = Math.abs(ours - theirs) / Math.abs(theirs);

    if (difference > tolerance) {
      exclusions.push({
        atomic_number: record.atomic_number,
        symbol: record.symbol,
        field,
        value: ours,
        reason: `differs from an independent reference by ${Math.round(difference * 100)}%`,
      });
    }
  }
}

fs.writeFileSync(
  FILE,
  `${JSON.stringify(
    {
      checked_at: new Date().toISOString(),
      reference: "PubChem periodic table (NIH/NLM), used for comparison only",
      tolerances: Object.fromEntries(
        Object.entries(CHECKS).map(([f, c]) => [f, c.tolerance]),
      ),
      exclusions,
    },
    null,
    2,
  )}\n`,
);

console.log(
  `periodic_table QA: ${compared} values compared, ${exclusions.length} excluded → ${path.relative(ROOT, FILE)}`,
);
