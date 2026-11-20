import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import exclusionsFile from "../../../scripts/datasets/sources/periodic_table.exclusions.json";
import {
  DATASETS,
  getDataset,
  type DatasetField,
  type DatasetRecord,
} from "@/lib/datasets";

function defined<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`${what} is undefined`);

  return value;
}

function matchesType(value: unknown, field: DatasetField): boolean {
  if (value === null) return field.nullable;

  switch (field.type) {
    case "integer":
      return Number.isInteger(value);
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "string":
      return typeof value === "string" && value.length > 0;
    case "boolean":
      return typeof value === "boolean";
    case "string[]":
      return Array.isArray(value) && value.every((v) => typeof v === "string");
    case "integer[]":
      return Array.isArray(value) && value.every((v) => Number.isInteger(v));
  }

  return false;
}

describe.each(DATASETS)("$name schema", (dataset) => {
  const names = dataset.fields.map((f) => f.name);

  it("has unique field names", () => {
    expect(new Set(names).size).toBe(names.length);
  });

  it("declares exactly the keys every record has, in order", () => {
    for (const record of dataset.records) {
      expect(Object.keys(record)).toEqual(names);
    }
  });

  it("only holds values of the declared type", () => {
    for (const record of dataset.records) {
      for (const field of dataset.fields) {
        const value = record[field.name];

        expect(
          matchesType(value, field),
          `${String(record[dataset.primaryKey])}.${field.name} = ${JSON.stringify(value)}`,
        ).toBe(true);
      }
    }
  });

  it("has a unique primary key", () => {
    const keys = dataset.records.map((r) => r[dataset.primaryKey]);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it("is licensed CC BY 4.0 with attribution to hypothesis.sh", () => {
    expect(dataset.license.name).toBe("CC BY 4.0");
    expect(dataset.license.attribution).toContain("by hypothesis.sh");
    expect(dataset.license.attribution).toContain(
      `https://hypothesis.sh/datasets/${dataset.name}`,
    );
  });
});

describe("periodic_table", () => {
  const table = defined(getDataset("periodic_table"), "periodic_table");
  const el = (key: string): DatasetRecord =>
    defined(table.lookup(key), `element ${key}`);
  const numbers = (field: string): [string, number][] =>
    table.records
      .filter((r) => r[field] !== null)
      .map((r) => [String(r.symbol), r[field] as number]);

  it("is sourced only from CC0 data", () => {
    expect(table.source).toMatchObject({
      name: "Wikidata",
      license: "CC0 1.0",
    });
  });

  it("has all 118 elements in order", () => {
    expect(table.records.map((r) => r.atomic_number)).toEqual(
      Array.from({ length: 118 }, (_, i) => i + 1),
    );
  });

  it("looks up by number, symbol, name, and common spelling", () => {
    expect(el("26").symbol).toBe("Fe");
    expect(el("FE").symbol).toBe("Fe");
    expect(el("iron").symbol).toBe("Fe");
    expect(el("aluminum").symbol).toBe("Al");
    expect(el("aluminium").symbol).toBe("Al");
    expect(el("cesium").symbol).toBe("Cs");
    expect(table.lookup("0")).toBeUndefined();
    expect(table.lookup("119")).toBeUndefined();
    expect(table.lookup("unobtainium")).toBeUndefined();
  });

  it("uses current IUPAC names and symbols", () => {
    expect(
      table.records
        .slice(111)
        .map((r) => `${String(r.symbol)} ${String(r.name)}`),
    ).toEqual([
      "Cn Copernicium",
      "Nh Nihonium",
      "Fl Flerovium",
      "Mc Moscovium",
      "Lv Livermorium",
      "Ts Tennessine",
      "Og Oganesson",
    ]);
  });

  it("derives the IUPAC 2021 layout", () => {
    expect(el("H")).toMatchObject({ period: 1, group: 1, block: "s" });
    expect(el("He")).toMatchObject({ period: 1, group: 18, block: "s" });
    expect(el("B")).toMatchObject({ period: 2, group: 13, block: "p" });
    expect(el("Fe")).toMatchObject({ period: 4, group: 8, block: "d" });
    expect(el("La")).toMatchObject({
      group: null,
      block: "f",
      grid_row: 9,
      grid_column: 3,
    });
    expect(el("Yb")).toMatchObject({
      block: "f",
      grid_row: 9,
      grid_column: 16,
    });
    expect(el("Lu")).toMatchObject({ group: 3, block: "d", grid_row: 6 });
    expect(el("No")).toMatchObject({ block: "f", grid_row: 10 });
    expect(el("Lr")).toMatchObject({ group: 3, block: "d", grid_row: 7 });
    expect(el("Hf")).toMatchObject({ group: 4, grid_column: 4 });
    expect(el("Og")).toMatchObject({ period: 7, group: 18, block: "p" });
  });

  it("puts every element in a distinct grid cell", () => {
    const cells = table.records.map(
      (r) => `${String(r.grid_row)},${String(r.grid_column)}`,
    );

    expect(new Set(cells).size).toBe(118);
  });

  it("normalizes electron configurations", () => {
    expect(el("H").electron_configuration).toBe("1s1");
    expect(el("He").electron_configuration).toBe("1s2");
    expect(el("Ne").electron_configuration).toBe("[He] 2s2 2p6");
    expect(el("Fe").electron_configuration).toBe("[Ar] 3d6 4s2");
    expect(el("Cu").electron_configuration).toBe("[Ar] 3d10 4s1");
    expect(el("Au").electron_configuration).toBe("[Xe] 4f14 5d10 6s1");
  });

  it("has electron configurations whose electron count is the atomic number", () => {
    const core: Record<string, number> = {
      He: 2,
      Ne: 10,
      Ar: 18,
      Kr: 36,
      Xe: 54,
      Rn: 86,
    };

    for (const r of table.records) {
      const config = r.electron_configuration as string;
      let electrons = 0;

      for (const part of config.split(" ")) {
        const bracket = /^\[(\w+)\]$/.exec(part);

        electrons += bracket
          ? core[bracket[1]]
          : Number(defined(/^\d[spdf](\d+)$/.exec(part)?.[1], part));
      }

      expect(electrons, `${String(r.symbol)} ${config}`).toBe(r.atomic_number);
    }
  });

  it("converts units and derives standard states", () => {
    expect(el("Fe").melting_point).toBe(1811.15); // 1538 °C upstream
    expect(el("Fe").density).toBe(7874);
    expect(el("Hg").standard_state).toBe("liquid");
    expect(el("Br").standard_state).toBe("liquid");
    expect(el("Ga").standard_state).toBe("solid"); // melts at 29.8 °C
    expect(el("Cl").standard_state).toBe("gas");
    expect(el("He").standard_state).toBe("gas");
  });

  it("keeps temperatures free of conversion noise", () => {
    for (const field of ["melting_point", "boiling_point"]) {
      for (const [symbol, value] of numbers(field)) {
        expect(Number(value.toFixed(2)), `${symbol}.${field} = ${value}`).toBe(
          value,
        );
      }
    }
  });

  it("only serves physically plausible values", () => {
    const bounds: Record<string, [number, number]> = {
      melting_point: [0.5, 4500],
      boiling_point: [3, 7000],
      electronegativity: [0.6, 4],
      ionization_energy: [3, 30],
      specific_heat: [50, 20000],
    };

    for (const [field, [min, max]] of Object.entries(bounds)) {
      for (const [symbol, value] of numbers(field)) {
        expect(value, `${symbol}.${field}`).toBeGreaterThanOrEqual(min);
        expect(value, `${symbol}.${field}`).toBeLessThanOrEqual(max);
      }
    }

    for (const r of table.records) {
      if (r.density === null) continue;

      const density = r.density as number;

      if (r.standard_state === "gas") {
        expect(density, String(r.symbol)).toBeLessThan(20);
      } else {
        expect(density, String(r.symbol)).toBeGreaterThan(100);
      }
    }
  });

  it("never serves a value the QA cross-check excluded", () => {
    expect(exclusionsFile.exclusions.length).toBeGreaterThan(0);

    for (const { atomic_number, field, value } of exclusionsFile.exclusions) {
      const record = table.records[atomic_number - 1];

      expect(record[field], `${String(record.symbol)}.${field}`).not.toBe(
        value,
      );
    }
  });
});

describe("fit_activities", () => {
  const dataset = defined(getDataset("fit_activities"), "fit_activities");
  const dir = path.join(process.cwd(), "public/datasets/fit_activities");

  it("lists every hosted file with its real size", () => {
    const onDisk = fs.readdirSync(dir).filter((name) => name.endsWith(".fit"));

    expect(onDisk.sort()).toEqual(
      dataset.records.map((r) => `${String(r.id)}.fit`).sort(),
    );

    for (const record of dataset.records) {
      const file = path.join(dir, `${String(record.id)}.fit`);

      expect(record.file_url).toBe(
        `/datasets/fit_activities/${String(record.id)}.fit`,
      );
      expect(fs.statSync(file).size).toBe(record.file_size);
      // FIT header: ".FIT" signature at bytes 8–11.
      expect(fs.readFileSync(file).subarray(8, 12).toString()).toBe(".FIT");
    }
  });
});

describe("space_images", () => {
  const dataset = defined(getDataset("space_images"), "space_images");
  const dir = path.join(process.cwd(), "public/datasets/space_images");

  it("lists every hosted image with its real size and dimensions", () => {
    const onDisk = fs.readdirSync(dir).filter((name) => name.endsWith(".png"));

    expect(onDisk.sort()).toEqual(
      dataset.records.map((r) => `${String(r.id)}.png`).sort(),
    );

    for (const record of dataset.records) {
      const file = path.join(dir, `${String(record.id)}.png`);
      const bytes = fs.readFileSync(file);

      expect(record.file_url).toBe(
        `/datasets/space_images/${String(record.id)}.png`,
      );
      expect(fs.statSync(file).size).toBe(record.file_size);
      // PNG signature at bytes 0–7.
      expect([...bytes.subarray(0, 8)]).toEqual([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      // IHDR is always the first chunk: width and height at bytes 16 and 20.
      expect(bytes.readUInt32BE(16)).toBe(record.width);
      expect(bytes.readUInt32BE(20)).toBe(record.height);
    }
  });
});
