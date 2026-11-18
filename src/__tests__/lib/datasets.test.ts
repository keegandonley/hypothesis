import { describe, expect, it } from "vitest";
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
  }
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
});

describe("periodic_table", () => {
  const table = defined(getDataset("periodic_table"), "periodic_table");
  const el = (key: string): DatasetRecord =>
    defined(table.lookup(key), `element ${key}`);

  it("has all 118 elements in order", () => {
    expect(table.records.map((r) => r.atomic_number)).toEqual(
      Array.from({ length: 118 }, (_, i) => i + 1),
    );
  });

  it("looks up by number, symbol, name, and alternate name", () => {
    expect(el("26").symbol).toBe("Fe");
    expect(el("FE").symbol).toBe("Fe");
    expect(el("iron").symbol).toBe("Fe");
    expect(el("Ferrum").symbol).toBe("Fe");
    expect(el("ununoctium").symbol).toBe("Og");
    expect(table.lookup("0")).toBeUndefined();
    expect(table.lookup("119")).toBeUndefined();
    expect(table.lookup("unobtainium")).toBeUndefined();
  });

  // The source attaches these three columns to the wrong rows. Each anchor is
  // a textbook value that only lands on the right element after the fix.
  it("restores electron configurations to the right elements", () => {
    expect(el("H").electron_configuration).toBe("1s1");
    expect(el("He").electron_configuration).toBe("1s2");
    expect(el("C").electron_configuration).toBe("[He] 2s2 2p2");
    expect(el("Fe").electron_configuration).toBe("[Ar] 3d6 4s2");
    expect(el("Cu").electron_configuration).toBe("[Ar] 3d10 4s1");
    expect(el("Au").electron_configuration).toBe("[Xe] 4f14 5d10 6s1");
    expect(el("Og").electron_configuration).toBe("[Rn] 5f14 6d10 7s2 7p6");
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

  it("restores specific heat and RTECS numbers to the right elements", () => {
    expect(el("He").specific_heat).toBe(5193.1);
    expect(el("Li").specific_heat).toBe(3570);
    expect(el("Fe").specific_heat).toBe(449);
    expect(el("Li").rtecs_number).toBe("OJ5540000");
    expect(el("Au").rtecs_number).toBe("MD5070000");
    expect(el("Hg").rtecs_number).toBe("OV4550000");
  });

  it("has no RTECS numbers or specific heats on superheavy elements", () => {
    for (const r of table.records.filter(
      (r) => (r.atomic_number as number) >= 104,
    )) {
      expect(r.rtecs_number).toBeNull();
      expect(r.specific_heat).toBeNull();
    }
  });

  it("uses current IUPAC names for 112–118", () => {
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
    expect(el("Cn").alternate_names).toEqual(["Ununbium"]);
  });

  it("cleans units and formatting", () => {
    expect(el("W").mohs_hardness).toBe(7.5);
    expect(el("He").boiling_point).toBe(4.22);
    expect(el("Fe").melting_point).toBe(1811);
    expect(el("Cu").space_group_name).toBe("Fm-3m");
    expect(el("H").adiabatic_index).toBe(1.4);
    expect(el("H").cas_number).toBe("1333-74-0");
    expect(el("H").pubchem_cid).toBe(783);
  });

  it("marks stability and lays out the f-block below the table", () => {
    expect(el("Fe").radioactive).toBe(false);
    expect(el("Fe").half_life).toBeNull();
    expect(el("U").radioactive).toBe(true);
    expect(el("La")).toMatchObject({ grid_row: 9, grid_column: 3 });
    expect(el("Lr")).toMatchObject({ grid_row: 10, grid_column: 17 });
    expect(el("Hf")).toMatchObject({ grid_row: 6, grid_column: 4 });
  });
});
