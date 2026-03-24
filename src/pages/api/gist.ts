import type { NextApiRequest, NextApiResponse } from "next";

const GIST_URL_RE = /^https?:\/\/gist\.github\.com\/[^/]+\/([a-f0-9]+)/i;

interface GistFile {
  filename: string;
  type: string;
  raw_url: string;
  content?: string;
  truncated?: boolean;
}

interface GistResponse {
  files: Record<string, GistFile>;
  message?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { url, file: fileParam } = req.query;

  if (!url) {
    res.redirect(302, "/docs/gist");
    return;
  }

  if (typeof url !== "string") {
    res.status(400).json({ error: "Missing required query param: url" });
    return;
  }

  const match = url.match(GIST_URL_RE);
  if (!match) {
    res.status(400).json({ error: "url must be a GitHub Gist URL (https://gist.github.com/user/id)" });
    return;
  }

  const gistId = match[1];

  let gistData: GistResponse;
  try {
    const apiRes = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "hypothesis.sh" },
    });
    if (apiRes.status === 404) {
      res.status(404).json({ error: "Gist not found or is private" });
      return;
    }
    if (!apiRes.ok) {
      res.status(502).json({ error: `GitHub API error: ${apiRes.status}` });
      return;
    }
    gistData = await apiRes.json();
  } catch {
    res.status(502).json({ error: "Failed to reach GitHub API" });
    return;
  }

  const fileNames = Object.keys(gistData.files).sort();
  if (fileNames.length === 0) {
    res.status(404).json({ error: "Gist has no files" });
    return;
  }

  let targetFile: GistFile;
  if (fileParam && typeof fileParam === "string") {
    const found = gistData.files[fileParam];
    if (!found) {
      res.status(400).json({ error: `File "${fileParam}" not found in gist. Available: ${fileNames.join(", ")}` });
      return;
    }
    targetFile = found;
  } else {
    targetFile = gistData.files[fileNames[0]];
  }

  let content: string;
  if (!targetFile.truncated && targetFile.content != null) {
    content = targetFile.content;
  } else {
    try {
      const rawRes = await fetch(targetFile.raw_url);
      if (!rawRes.ok) {
        res.status(502).json({ error: "Failed to fetch raw gist content" });
        return;
      }
      content = await rawRes.text();
    } catch {
      res.status(502).json({ error: "Failed to fetch raw gist content" });
      return;
    }
  }

  res.setHeader("Content-Type", targetFile.type || "text/plain");
  res.setHeader("Cache-Control", "public, max-age=60");
  res.status(200).send(content);
}
