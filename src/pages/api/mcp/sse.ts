/* eslint-disable @typescript-eslint/no-deprecated -- This route intentionally
   keeps the deprecated SSE transport alive for backwards compatibility while
   clients migrate to the Streamable HTTP endpoint at /api/mcp. */
import type { NextApiRequest, NextApiResponse } from "next";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMcpServer } from "@/lib/mcp/server";

// DEPRECATED SSE transport, kept working for backwards compatibility.
//
// This is the legacy MCP transport. It holds a Fluid function instance open for
// the entire client session (billing provisioned memory for the whole idle
// duration) and keeps sessions in an in-memory Map that doesn't survive across
// Fluid instances — i.e. it is the compute drain the Streamable HTTP endpoint
// at `/api/mcp` was built to replace.
//
// It stays available only so already-configured clients keep working during
// migration. New clients should use `/api/mcp` (`--transport http`). Remove
// this route once every SSE client has been migrated.
export const config = {
  api: {
    bodyParser: false,
  },
};

const SUCCESSOR_ENDPOINT = "/api/mcp";

const transports = new Map<string, SSEServerTransport>();

// Signal deprecation on every response (RFC 8594) and point clients at the
// successor endpoint, without breaking the connection.
function markDeprecated(req: NextApiRequest, res: NextApiResponse): void {
  res.setHeader("Deprecation", "true");
  res.setHeader("Link", `<${SUCCESSOR_ENDPOINT}>; rel="successor-version"`);
  // Log usage so remaining SSE clients can be found and migrated.
  console.warn(
    `[mcp] deprecated SSE transport used (${req.method}) ua=${
      req.headers["user-agent"] ?? "unknown"
    } — migrate to ${SUCCESSOR_ENDPOINT} (Streamable HTTP)`,
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  markDeprecated(req, res);

  if (req.method === "GET") {
    const transport = new SSEServerTransport("/api/mcp/sse", res);

    transports.set(transport.sessionId, transport);

    transport.onclose = () => {
      transports.delete(transport.sessionId);
    };

    const server = createMcpServer(req);

    await server.connect(transport);

    return;
  }

  if (req.method === "POST") {
    const sessionId = req.query.sessionId as string;
    const transport = transports.get(sessionId);

    if (!transport) {
      res.status(404).json({ error: "Session not found" });

      return;
    }

    await transport.handlePostMessage(req, res);

    return;
  }

  res.setHeader("Allow", ["GET", "POST"]);
  res.status(405).json({ error: "Method not allowed" });
}
