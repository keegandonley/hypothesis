import type { NextApiRequest, NextApiResponse } from "next";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMcpServer } from "@/lib/mcp/server";

export const config = {
  api: {
    bodyParser: false,
  },
};

const transports = new Map<string, SSEServerTransport>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
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
