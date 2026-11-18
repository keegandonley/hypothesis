import type { NextApiRequest, NextApiResponse } from "next";
import { DATASETS, getDataset, type Dataset } from "@/lib/datasets";

/**
 * Sample datasets as JSON. Served at /datasets/... via a rewrite in
 * next.config.mjs:
 *
 *   /datasets                    index of every dataset
 *   /datasets/{name}             one dataset: metadata, fields, and all records
 *   /datasets/{name}/{key}       a single record
 *
 * Every successful body carries the dataset's license, attribution line
 * included, ahead of the data. Consumers such as agents often read only the
 * body (and sometimes only its start), so the license can't live solely in a
 * header or in a response they might not request.
 *
 * The data is static per deploy, so responses are cached hard at the CDN.
 */

const ALLOWED_METHODS = "GET, HEAD, OPTIONS";

const CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

interface DatasetSummary {
  name: string;
  title: string;
  description: string;
  count: number;
  url: string;
  license: Dataset["license"];
  source: Dataset["source"];
}

function summary(dataset: Dataset): DatasetSummary {
  return {
    name: dataset.name,
    title: dataset.title,
    description: dataset.description,
    count: dataset.records.length,
    url: `/datasets/${dataset.name}`,
    license: dataset.license,
    source: dataset.source,
  };
}

function notFound(res: NextApiResponse, error: string): void {
  res.status(404).json({
    error,
    datasets: DATASETS.map((d) => `/datasets/${d.name}`),
  });
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): void {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
    res.setHeader("Access-Control-Max-Age", "86400");
    res.status(204).end();

    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", ALLOWED_METHODS);
    res.status(405).json({ error: "Method not allowed" });

    return;
  }

  const raw = req.query.path;
  const path = (Array.isArray(raw) ? raw : raw ? [raw] : []).filter(Boolean);

  if (path.length === 0) {
    res.setHeader("Cache-Control", CACHE_CONTROL);
    res.status(200).json({ datasets: DATASETS.map(summary) });

    return;
  }

  const [name, key, ...rest] = path;
  const dataset = getDataset(name);

  if (!dataset) {
    notFound(res, `Unknown dataset "${name}"`);

    return;
  }

  if (rest.length > 0) {
    notFound(res, "Not found");

    return;
  }

  // CC BY requires attribution; advertise the license on every response.
  res.setHeader("Link", `<${dataset.license.url}>; rel="license"`);

  if (key === undefined) {
    res.setHeader("Cache-Control", CACHE_CONTROL);
    res.status(200).json({
      ...summary(dataset),
      primary_key: dataset.primaryKey,
      lookup: `/datasets/${dataset.name}/{key} — ${dataset.lookupDescription}`,
      notes: dataset.notes,
      fields: dataset.fields,
      data: dataset.records,
    });

    return;
  }

  const record = dataset.lookup(key);

  if (!record) {
    res.status(404).json({
      error: `No ${dataset.name} record matches "${key}"`,
      lookup: dataset.lookupDescription,
    });

    return;
  }

  res.setHeader("Cache-Control", CACHE_CONTROL);
  res.status(200).json({
    dataset: dataset.name,
    url: `/datasets/${dataset.name}/${encodeURIComponent(key)}`,
    license: dataset.license,
    source: dataset.source,
    data: record,
  });
}
