import type { NextApiRequest, NextApiResponse } from "next";

// RETIRED SSE transport.
//
// This route used to hold a Fluid function instance open for an entire client
// session, billing provisioned memory for the whole idle duration. It is now a
// tombstone: it never opens a stream and never constructs an MCP server, so it
// costs nothing to keep around.
//
// It exists only to give already-configured SSE clients a legible error instead
// of a bare 404. Delete this file once the logging below goes quiet.
//
// The live endpoint is `/api/mcp` (Streamable HTTP, `--transport http`).

// The handler never reads `req.body`, and leaving Next's body parser on would
// let a malformed or oversized POST short-circuit to a generic 400/413 inside
// `apiResolver` — skipping the 410 and, more importantly, the straggler logging
// this route exists for. Off means every request reaches the handler.
export const config = {
  api: {
    bodyParser: false,
  },
};

const SUCCESSOR_ENDPOINT = "/api/mcp";

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): void {
  // Log stragglers so they can be identified and migrated before this route is
  // deleted outright.
  console.warn(
    `[mcp] retired SSE transport hit (${req.method}) ua=${
      req.headers["user-agent"] ?? "unknown"
    } — reconnect to ${SUCCESSOR_ENDPOINT} (Streamable HTTP)`,
  );

  // Point clients at the replacement (RFC 8594). No `Allow` header: no method
  // works here, so this is 410 rather than 405.
  res.setHeader("Link", `<${SUCCESSOR_ENDPOINT}>; rel="successor-version"`);
  res.status(410).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message:
        "The SSE transport at /api/mcp/sse has been retired. Reconnect using " +
        "the Streamable HTTP transport at /api/mcp — e.g. `claude mcp add " +
        "hypothesis --transport http https://hypothesis.sh/api/mcp`. See " +
        "https://hypothesis.sh/docs/mcp for details.",
    },
    id: null,
  });
}
