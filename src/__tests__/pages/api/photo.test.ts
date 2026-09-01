import type { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import handler from "@/pages/api/photo/[[...path]]";

/**
 * Minimal Next req/res doubles. Only the procedural paths are exercised here:
 * they are self-contained, whereas photo-library requests fetch their source
 * back through the origin and would need a live server.
 */
interface Captured {
  status: number;
  body: unknown;
  headers: Record<string, string>;
}

async function call(
  path: string[] | undefined,
  query: Record<string, string> = {},
  method = "GET",
): Promise<Captured> {
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
    send(body: unknown) {
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
    query: { ...query, ...(path ? { path } : {}) },
  } as unknown as NextApiRequest;

  await handler(req, res);

  return captured;
}

describe("gen mode responses", () => {
  it("serves SVG without touching sharp", async () => {
    const res = await call(["gen", "hero", "600", "400"]);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/svg+xml; charset=utf-8");
    expect(typeof res.body).toBe("string");
    expect(String(res.body).startsWith("<svg")).toBe(true);
  });

  it("locks the SVG response down", async () => {
    const res = await call(["gen", "hero", "600", "400"]);

    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["content-security-policy"]).toContain("default-src");
    expect(res.headers["access-control-allow-origin"]).toBe("*");
  });

  it("caches procedural output immutably", async () => {
    const res = await call(["gen", "hero", "600", "400"]);

    expect(res.headers["cache-control"]).toContain("immutable");
  });

  it("reports a Photo-ID that does not leak the seed", async () => {
    const res = await call(["gen", "secret-seed", "600", "400"]);

    expect(res.headers["photo-id"]).toMatch(/^gen-gradient-[0-9a-z]+$/);
    expect(res.headers["photo-id"]).not.toContain("secret-seed");
  });

  it("is byte-identical for the same URL", async () => {
    const a = await call(["gen", "hero", "600", "400"]);
    const b = await call(["gen", "hero", "600", "400"]);

    expect(a.body).toBe(b.body);
  });

  it("varies by style", async () => {
    const gradient = await call(["gen", "hero", "600", "400"]);
    const bauhaus = await call(["gen", "hero", "600", "400"], {
      style: "bauhaus",
    });

    expect(gradient.body).not.toBe(bauhaus.body);
  });

  it("rasterizes to JPEG on request", async () => {
    const res = await call(["gen", "hero", "300", "200.jpg"]);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/jpeg");
    expect(Buffer.isBuffer(res.body)).toBe(true);

    const body = res.body as Buffer;

    // JPEG SOI marker.
    expect(body[0]).toBe(0xff);
    expect(body[1]).toBe(0xd8);
  });

  it("rasterizes to WebP on request", async () => {
    const res = await call(["gen", "hero", "300", "200.webp"]);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/webp");
    expect((res.body as Buffer).subarray(8, 12).toString("ascii")).toBe("WEBP");
  });

  it("rasterizes a large noise field at full requested size", async () => {
    // Rendered at reduced density and scaled up (see rasterizePattern), so the
    // output must still be exactly the size that was asked for.
    const raster = await call(["gen", "hero", "1600", "1600.jpg"], {
      style: "noise",
    });

    expect(raster.status).toBe(200);

    const meta = await sharp(raster.body as Buffer).metadata();

    expect(meta.width).toBe(1600);
    expect(meta.height).toBe(1600);
  });

  it("keeps the two-pass path deterministic", async () => {
    const a = await call(["gen", "hero", "900", "600.jpg"], { style: "noise" });
    const b = await call(["gen", "hero", "900", "600.jpg"], { style: "noise" });

    expect((a.body as Buffer).equals(b.body as Buffer)).toBe(true);
  });

  // A thin canvas makes the reduced-density render collapse its minor axis to
  // zero, which librsvg rejects outright. These sizes are all in range and
  // reachable from a plain URL, so they must render, not 500.
  it.each([
    [1, 1600],
    [1600, 1],
    [1, 1025],
    [1025, 1],
    [2, 1600],
  ])("renders a %ix%i noise raster instead of failing", async (w, h) => {
    const res = await call(["gen", "hero", String(w), `${h}.jpg`], {
      style: "noise",
    });

    expect(res.status).toBe(200);

    const meta = await sharp(res.body as Buffer).metadata();

    expect(meta.width).toBe(w);
    expect(meta.height).toBe(h);
  });

  it("preserves a non-square aspect through the two-pass path", async () => {
    const res = await call(["gen", "hero", "1200", "630.webp"], {
      style: "noise",
    });

    expect(res.status).toBe(200);

    const meta = await sharp(res.body as Buffer).metadata();

    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(630);
  });

  it("rejects .svg on a photo-library URL", async () => {
    const res = await call(["id", "0", "300.svg"]);

    expect(res.status).toBe(400);
  });
});

describe("method handling", () => {
  it("answers preflight", async () => {
    const res = await call(["gen", "hero", "300"], {}, "OPTIONS");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-methods"]).toContain("GET");
  });

  it("rejects writes", async () => {
    const res = await call(["gen", "hero", "300"], {}, "POST");

    expect(res.status).toBe(405);
  });
});

describe("rasterizing every style through sharp/librsvg", () => {
  // photo-pattern.test.ts checks the SVG *strings*; only this path proves
  // librsvg can actually parse them. A style whose markup it chokes on would
  // otherwise 500 in production while every string assertion still passed.
  it.each(["gradient", "label", "bauhaus", "noise"])(
    "renders a non-blank %s raster at the requested size",
    async (style) => {
      const res = await call(["gen", "hero", "300", "200.jpg"], { style });

      expect(res.status).toBe(200);
      expect(Buffer.isBuffer(res.body)).toBe(true);

      const body = res.body as Buffer;
      const meta = await sharp(body).metadata();

      expect(meta.width).toBe(300);
      expect(meta.height).toBe(200);

      // A style that failed to draw would still encode as a valid flat JPEG,
      // so require actual variation in the pixels.
      const stats = await sharp(body).stats();

      expect(stats.channels[0].stdev).toBeGreaterThan(0.5);
    },
  );

  it("rasterizes noise at exactly its cap", async () => {
    const res = await call(["gen", "hero", "512", "512.jpg"], {
      style: "noise",
    });

    expect(res.status).toBe(200);
    expect((await sharp(res.body as Buffer).metadata()).width).toBe(512);
  });

  it("rasterizes with grayscale and blur applied", async () => {
    const res = await call(["gen", "hero", "300", "200.jpg"], {
      grayscale: "",
      blur: "5",
    });

    expect(res.status).toBe(200);

    const stats = await sharp(res.body as Buffer).stats();
    const [r, g, b] = stats.channels;

    // Saturation zeroed by feColorMatrix means the channels agree.
    expect(Math.abs(r.mean - g.mean)).toBeLessThan(2);
    expect(Math.abs(g.mean - b.mean)).toBeLessThan(2);
  });
});

describe("hostile seeds", () => {
  const HOSTILE = "</svg><script>alert(1)</script>";

  it("never reflects one into the SVG document", async () => {
    const res = await call(["gen", HOSTILE, "200", "150"]);

    expect(res.status).toBe(200);

    const body = String(res.body);

    expect(body).not.toContain("<script");
    expect(body).not.toContain("alert");
    expect(body).not.toContain("</svg><");
    expect(body.startsWith("<svg")).toBe(true);
  });

  it("still rasterizes cleanly", async () => {
    const res = await call(["gen", HOSTILE, "200", "150.jpg"]);

    expect(res.status).toBe(200);
    expect((await sharp(res.body as Buffer).metadata()).width).toBe(200);
  });

  it("keeps it out of the Photo-ID header", async () => {
    const res = await call(["gen", HOSTILE, "200", "150"]);

    expect(res.headers["photo-id"]).toMatch(/^gen-gradient-[0-9a-z]+$/);
  });
});
