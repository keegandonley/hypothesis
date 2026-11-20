import type { NextApiRequest, NextApiResponse } from "next";
import { describe, expect, it } from "vitest";

import handler from "@/pages/api/datasets/[[...path]]";

interface Captured {
  status: number;
  body: unknown;
  headers: Record<string, string>;
}

function call(path: string[] | undefined, method = "GET"): Captured {
  const captured: Captured = { status: 0, body: undefined, headers: {} };
  const res = {
    setHeader(key: string, value: string | number) {
      captured.headers[key.toLowerCase()] = String(value);
    },
    status(code: number) {
      captured.status = code;

      return this;
    },
    json(body: unknown) {
      captured.body = body;

      return this;
    },
    end() {
      return this;
    },
  } as unknown as NextApiResponse;

  const req = {
    method,
    headers: { host: "localhost:3000" },
    query: path ? { path } : {},
  } as unknown as NextApiRequest;

  handler(req, res);

  return captured;
}

describe("/datasets", () => {
  it("lists datasets", () => {
    const res = call(undefined);
    const body = res.body as { datasets: { name: string; count: number }[] };

    expect(res.status).toBe(200);
    expect(body.datasets).toContainEqual(
      expect.objectContaining({ name: "periodic_table", count: 118 }),
    );
  });

  it("serves a dataset with metadata, fields, and records", () => {
    const res = call(["periodic_table"]);
    const body = res.body as {
      count: number;
      license: { name: string };
      fields: { name: string }[];
      data: unknown[];
    };

    expect(res.status).toBe(200);
    expect(body.count).toBe(118);
    expect(body.data).toHaveLength(118);
    expect(body.license.name).toBe("CC BY 4.0");
    expect(body.fields[0].name).toBe("atomic_number");
    expect(res.headers.link).toContain('rel="license"');
  });

  it("serves a single record by key", () => {
    const res = call(["periodic_table", "Fe"]);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      dataset: "periodic_table",
      data: { atomic_number: 26, name: "Iron" },
    });
  });

  // Agents building on these datasets read bodies, not headers, so every
  // successful body must carry the license and a usable attribution line.
  describe("license in every response body", () => {
    const expectLicense = (license: unknown): void => {
      const { name, url, attribution } = license as Record<string, unknown>;

      expect(name).toBe("CC BY 4.0");
      expect(url).toBe("https://creativecommons.org/licenses/by/4.0/");
      expect(attribution).toMatch(
        /^.+ by hypothesis\.sh \(https:\/\/hypothesis\.sh\/datasets\/\w+\), licensed under CC BY 4\.0/,
      );
    };

    it("index", () => {
      const body = call(undefined).body as {
        datasets: { license: unknown }[];
      };

      for (const dataset of body.datasets) expectLicense(dataset.license);
    });

    it("dataset", () => {
      expectLicense(
        (call(["periodic_table"]).body as { license: unknown }).license,
      );
    });

    it("single record", () => {
      expectLicense(
        (call(["periodic_table", "26"]).body as { license: unknown }).license,
      );
    });

    it("precedes the data, so a truncated read still sees it", () => {
      for (const path of [["periodic_table"], ["periodic_table", "fe"]]) {
        const keys = Object.keys(call(path).body as object);

        expect(keys.indexOf("license")).toBeLessThan(keys.indexOf("data"));
      }
    });

    it("is also advertised in a Link header", () => {
      for (const path of [["periodic_table"], ["periodic_table", "fe"]]) {
        expect(call(path).headers.link).toBe(
          '<https://creativecommons.org/licenses/by/4.0/>; rel="license"',
        );
      }
    });
  });

  it("404s unknown datasets, records, and deeper paths", () => {
    expect(call(["nope"]).status).toBe(404);
    expect(call(["periodic_table", "999"]).status).toBe(404);
    expect(call(["periodic_table", "Fe", "extra"]).status).toBe(404);
  });

  it("is readable cross-origin and read-only", () => {
    expect(
      call(["periodic_table"]).headers["access-control-allow-origin"],
    ).toBe("*");
    expect(call(["periodic_table"], "OPTIONS").status).toBe(204);
    expect(call(["periodic_table"], "POST").status).toBe(405);
  });
});

describe("/datasets/fit_activities", () => {
  it("lists the files with the license", () => {
    const res = call(["fit_activities"]);
    const body = res.body as {
      license: { attribution: string };
      data: { id: string; file_url: string }[];
    };

    expect(res.status).toBe(200);
    expect(body.license.attribution).toContain("by hypothesis.sh");
    expect(body.data.map((d) => d.file_url)).toContain(
      "/datasets/fit_activities/friday-ski-2026-01-16.fit",
    );
  });

  it("serves one file's entry by id", () => {
    expect(
      call(["fit_activities", "friday-ski-2026-01-16"]).body,
    ).toMatchObject({ data: { file_size: 313964 } });
    expect(call(["fit_activities", "nope"]).status).toBe(404);
  });
});

describe("/datasets/space_images", () => {
  it("lists the images with the license", () => {
    const res = call(["space_images"]);
    const body = res.body as {
      license: { attribution: string };
      data: { id: string; file_url: string }[];
    };

    expect(res.status).toBe(200);
    expect(body.license.attribution).toContain("by hypothesis.sh");
    expect(body.data.map((d) => d.file_url)).toContain(
      "/datasets/space_images/moon-fleet.png",
    );
  });

  it("serves one image's entry by id", () => {
    expect(call(["space_images", "moon-fleet"]).body).toMatchObject({
      data: { file_size: 1883314, width: 1672, height: 941 },
    });
    expect(call(["space_images", "MOON-FLEET"]).status).toBe(200);
    expect(call(["space_images", "nope"]).status).toBe(404);
  });
});
