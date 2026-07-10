import type { NextApiRequest, NextApiResponse } from "next";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "@/lib/mcp/server";

// Stateless Streamable HTTP MCP endpoint.
//
// Each request spins up a fresh server + transport, returns a single buffered
// JSON response (`enableJsonResponse`), and tears everything down — no
// connection is ever held open. This is the preferred replacement for the
// deprecated SSE transport (`/api/mcp/sse`, still available for existing
// clients), which pinned a Fluid function instance open for the entire client
// session and billed provisioned memory for the whole idle duration.
//
// Stateless mode (`sessionIdGenerator: undefined`) is also the only correct
// choice under Fluid Compute: the old SSE handler kept sessions in an in-memory
// Map that doesn't survive across instances, so follow-up POSTs could land on
// an instance without the session and 404.
//
// Safety cap: responses are fast request/response JSON, so 30s is generous.
export const config = { maxDuration: 30 };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  // Only POST carries JSON-RPC. A GET would open a standalone keep-alive SSE
  // stream (the exact hold-open this migration eliminates) and DELETE
  // terminates a session, which stateless mode has none of — reject both.
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed" },
      id: null,
    });

    return;
  }

  const server = createMcpServer(req);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    // Pass Next's already-parsed body so the transport doesn't re-read the
    // (now consumed) request stream.
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("mcp request error", err);

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  } finally {
    // Tear down only after handleRequest has fully settled. Tying cleanup to
    // res "close" instead would let a mid-flight client disconnect clear the
    // transport's stream map before the tool result is sent, leaving the
    // JSON-response promise unresolved and the function hanging until
    // maxDuration — the exact idle-billing drain this migration removes.
    await transport.close();
    await server.close();
  }
}
