#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";

import { registerRestaurantPrompts } from "./prompts/restaurantPrompts.js";
import { registerRestaurantTools } from "./tools/restaurantTools.js";

// Create server instance
const server = new McpServer({
  name: "sevenroom-mcp-server",
  version: "1.0.0",
});


// Prompt registration (must be done before tool registration)
//registerRestaurantPrompts(server);

// Tool registration
registerRestaurantTools(server);


/**
 * Main: Connect to stdio transport and run server
 */
async function main() {
  // Create Streamable HTTP transport and connect the MCP server to it
  const transport = new StreamableHTTPServerTransport({
    // Stateless mode: do not generate session IDs (suitable for simple deployments)
    sessionIdGenerator: undefined,
    // Accepts requests with Accept: application/json only
    enableJsonResponse: true
  });

  await server.connect(transport);

  // Create an Express HTTP server to forward requests to the transport
  const app = express();
  // Parse JSON bodies (the transport can accept a parsed body)
  app.use(express.json({ limit: "4mb" }));

  // MCP endpoint - supports GET (SSE), POST (requests), DELETE (close)
  app.get("/mcp", (req: any, res: any) => transport.handleRequest(req, res));
  app.post("/mcp", (req: any, res: any) => transport.handleRequest(req, res, req.body));
  app.delete("/mcp", (req: any, res: any) => transport.handleRequest(req, res));

  // Basic health endpoint (not part of MCP transport)
  app.get("/health", (_req: any, res: any) => res.json({ status: "ok" }));

  // Use PORT from environment (Azure App Service) or default to 2003 for local dev
  const port = process.env.PORT ? Number(process.env.PORT) : 2003;
  
  app.listen(port, () => {
    // Use stderr for logs to avoid interfering with MCP message streams
    console.error(`SevenRoom MCP Server running on http://localhost:${port}/mcp`);
  });
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
