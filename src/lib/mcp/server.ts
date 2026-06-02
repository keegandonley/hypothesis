import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { NextApiRequest } from "next";
import {
  sendPushNotificationTool,
  createWebhookSessionTool,
  listWebhookEventsTool,
} from "./tools";
import { webhookTestingPrompt, cicdNotificationSetupPrompt } from "./prompts";

export function createMcpServer(req: NextApiRequest): McpServer {
  const server = new McpServer({
    name: "hypothesis",
    version: "1.0.0",
  });

  server.tool(
    sendPushNotificationTool.name,
    sendPushNotificationTool.description,
    sendPushNotificationTool.inputSchema,
    async (args) => {
      return sendPushNotificationTool.handler(args);
    },
  );

  server.tool(
    createWebhookSessionTool.name,
    createWebhookSessionTool.description,
    createWebhookSessionTool.inputSchema,
    async () => {
      return createWebhookSessionTool.handler(req);
    },
  );

  server.tool(
    listWebhookEventsTool.name,
    listWebhookEventsTool.description,
    listWebhookEventsTool.inputSchema,
    async (args) => {
      return listWebhookEventsTool.handler(args);
    },
  );

  server.prompt(
    webhookTestingPrompt.name,
    webhookTestingPrompt.description,
    webhookTestingPrompt.argsSchema,
    (args) => {
      return webhookTestingPrompt.handler(args as { deviceId?: string });
    },
  );

  server.prompt(
    cicdNotificationSetupPrompt.name,
    cicdNotificationSetupPrompt.description,
    cicdNotificationSetupPrompt.argsSchema,
    (args) => {
      return cicdNotificationSetupPrompt.handler(args as { deviceId: string });
    },
  );

  return server;
}
