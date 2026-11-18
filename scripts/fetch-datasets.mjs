/**
 * Refreshes the raw dataset sources in scripts/datasets/sources/ from their
 * upstreams. Network access is only needed here; `pnpm datasets:build` works
 * offline from the committed snapshots, so upstream edits arrive as reviewable
 * diffs instead of silently changing what we serve.
 *
 *   pnpm datasets:fetch && pnpm datasets:build
 *
 * periodic_table comes from Wikidata, whose structured data is CC0: no
 * attribution or other conditions attach, so the published dataset can carry
 * whatever license we choose.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES = path.join(ROOT, "scripts/datasets/sources");
const USER_AGENT =
  "hypothesis-datasets/1.0 (https://hypothesis.sh/docs/datasets)";

const SPARQL = "https://query.wikidata.org/sparql";
const API = "https://www.wikidata.org/w/api.php";

/** Statement properties the periodic_table build reads. */
export const PERIODIC_TABLE_PROPERTIES = {
  P1086: "atomic number",
  P246: "element symbol",
  P2067: "mass",
  P8000: "electron configuration",
  P1121: "oxidation state",
  P556: "crystal system",
  P2101: "melting point",
  P2102: "boiling point",
  P2054: "density",
  P1108: "electronegativity",
  P2260: "ionization energy",
  P14936: "atomic radius",
  P14937: "covalent radius",
  P2068: "thermal conductivity",
  P2055: "electrical conductivity",
  P2056: "specific heat capacity",
  P2075: "speed of sound",
  P1088: "Mohs' hardness",
  P575: "time of discovery or invention",
  P61: "discoverer or inventor",
  P231: "CAS Registry Number",
  P662: "PubChem CID",
  P232: "EC number",
};

/** Qualifiers the build interprets; everything else is dropped. */
const QUALIFIERS = new Set([
  "P515", // phase of matter
  "P518", // applies to part (allotrope)
  "P459", // determination method (measured vs computed)
  "P1545", // series ordinal (nth ionization energy)
  "P2076", // temperature
  "P2077", // pressure
  "P580", // start time
  "P582", // end time
]);

async function getJson(url) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });

    if (res.ok) return res.json();

    if (attempt >= 4 || (res.status !== 429 && res.status < 500)) {
      throw new Error(`${res.status} ${res.statusText} for ${url}`);
    }

    await new Promise((r) => setTimeout(r, attempt * 5000));
  }
}

async function getEntities(ids, props) {
  const out = {};

  for (let i = 0; i < ids.length; i += 50) {
    const params = new URLSearchParams({
      action: "wbgetentities",
      ids: ids.slice(i, i + 50).join("|"),
      props,
      languages: "en",
      format: "json",
    });

    Object.assign(out, (await getJson(`${API}?${params}`)).entities);
  }

  return out;
}

/**
 * Reduces a snak to the parts the build reads, in a compact shape:
 *   quantity → { amount, unit }   (unit is a QID, or "1" for dimensionless)
 *   item     → { item }
 *   time     → { time, precision }
 *   string   → { string }
 *   no value / unknown value → { snaktype }
 */
function trimSnak(snak) {
  if (snak.snaktype !== "value") return { snaktype: snak.snaktype };

  const { type, value } = snak.datavalue;

  switch (type) {
    case "quantity":
      return {
        amount: value.amount,
        unit: value.unit === "1" ? "1" : value.unit.split("/").pop(),
      };
    case "wikibase-entityid":
      return { item: value.id };
    case "time":
      return { time: value.time, precision: value.precision };
    case "string":
      return { string: value };
    default:
      throw new Error(`Unhandled datavalue type ${type}`);
  }
}

function trimStatement(statement) {
  const qualifiers = {};

  for (const [pid, snaks] of Object.entries(statement.qualifiers ?? {})) {
    if (QUALIFIERS.has(pid)) qualifiers[pid] = snaks.map(trimSnak);
  }

  return {
    rank: statement.rank,
    value: trimSnak(statement.mainsnak),
    ...(Object.keys(qualifiers).length > 0 ? { qualifiers } : {}),
  };
}

function referencedItems(statements, into) {
  const visit = (snak) => {
    if (snak.item) into.add(snak.item);
    if (snak.unit && snak.unit !== "1") into.add(snak.unit);
  };

  for (const s of statements) {
    visit(s.value);
    for (const snaks of Object.values(s.qualifiers ?? {})) snaks.forEach(visit);
  }
}

async function fetchPeriodicTable() {
  const query = `SELECT ?z ?item WHERE {
  ?item wdt:P31 wd:Q11344 ; wdt:P1086 ?n .
  BIND(xsd:integer(?n) AS ?z)
  FILTER(?z >= 1 && ?z <= 118)
} ORDER BY ?z`;
  const rows = (
    await getJson(`${SPARQL}?${new URLSearchParams({ query, format: "json" })}`)
  ).results.bindings;
  const ids = rows.map((r) => r.item.value.split("/").pop());

  if (new Set(rows.map((r) => r.z.value)).size !== 118 || ids.length !== 118) {
    throw new Error(`Expected one item per element 1–118, got ${ids.length}`);
  }

  const entities = await getEntities(ids, "claims|labels");
  const elements = [];
  const items = new Set();

  for (const [i, id] of ids.entries()) {
    const entity = entities[id];
    const claims = {};

    for (const pid of Object.keys(PERIODIC_TABLE_PROPERTIES)) {
      if (entity.claims[pid]) {
        claims[pid] = entity.claims[pid].map(trimStatement);
        referencedItems(claims[pid], items);
      }
    }

    elements.push({
      atomic_number: Number(rows[i].z.value),
      id,
      label: entity.labels.en?.value ?? null,
      claims,
    });
  }

  const labelled = await getEntities([...items].sort(), "labels");
  const labels = Object.fromEntries(
    Object.entries(labelled).map(([id, e]) => [
      id,
      e.labels?.en?.value ?? null,
    ]),
  );

  return {
    source: "Wikidata",
    license: "CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)",
    retrieved_at: new Date().toISOString(),
    properties: PERIODIC_TABLE_PROPERTIES,
    elements,
    labels,
  };
}

const FETCHERS = { periodic_table: fetchPeriodicTable };

fs.mkdirSync(SOURCES, { recursive: true });

for (const [name, fetchSource] of Object.entries(FETCHERS)) {
  const snapshot = await fetchSource();
  const file = path.join(SOURCES, `${name}.wikidata.json`);

  fs.writeFileSync(file, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(
    `${name}: ${snapshot.elements.length} items → ${path.relative(ROOT, file)}`,
  );
}
