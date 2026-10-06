import { createServer as createHttpServer } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  buildStatusView,
  formatStatusText,
  operatorOrigin,
  unavailableStatus,
} from "./status-view.mjs";

const HOST = "127.0.0.1";
const PORT = Number.parseInt(process.env.WFE_MCP_PORT ?? "4327", 10);
const OPERATOR_ORIGIN = operatorOrigin(process.env.WFE_OPERATOR_ORIGIN);
const MCP_PATH = "/mcp";

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("WFE_MCP_PORT must be a valid TCP port");
}

async function readCanonicalState() {
  const response = await fetch(`${OPERATOR_ORIGIN}/api/state`, {
    signal: AbortSignal.timeout(2_000),
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`operator returned HTTP ${response.status}`);
  return response.json();
}

async function currentStatus() {
  const observedAt = new Date().toISOString();
  try {
    return buildStatusView(await readCanonicalState(), observedAt);
  } catch {
    return unavailableStatus(observedAt);
  }
}

function createWfeMcpServer() {
  const server = new McpServer(
    { name: "wfe", version: "0.1.0" },
    {
      instructions:
        "This server is read-only. Use wfe_status for the current canonical WFE-Next operator/project/run status. Never claim that this plugin can mutate WFE, run shell commands, approve actions, or replace WFEKey.",
    },
  );

  server.registerTool(
    "wfe_status",
    {
      title: "WFE status",
      description:
        "Read the current canonical WFE-Next operator and project execution status. Use for current work, ready plans, blockers, runs, steps, and accepted-result identity. Read-only; no shell or mutation.",
      inputSchema: {},
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () => {
      const view = await currentStatus();
      return {
        content: [{ type: "text", text: formatStatusText(view) }],
        structuredContent: view,
      };
    },
  );

  return server;
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type,mcp-session-id");
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
}

const httpServer = createHttpServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${HOST}:${PORT}`);

  if (url.pathname === MCP_PATH) cors(res);

  if (req.method === "OPTIONS" && url.pathname === MCP_PATH) {
    res.writeHead(204).end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    res
      .writeHead(200, { "content-type": "application/json; charset=utf-8" })
      .end(JSON.stringify({
        service: "wfe-chatgpt-plugin",
        version: "0.1.0",
        transport: "streamable-http",
        mcpPath: MCP_PATH,
        operatorOrigin: OPERATOR_ORIGIN,
        authority: "read-only",
      }));
    return;
  }

  if (
    url.pathname === MCP_PATH
    && req.method
    && new Set(["POST", "GET", "DELETE"]).has(req.method)
  ) {
    const server = createWfeMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch {
      if (!res.headersSent) {
        res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
        res.end("Internal MCP server error");
      }
    }
    return;
  }

  res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Not Found");
});

httpServer.listen(PORT, HOST, () => {
  console.error(`WFE MCP read-only adapter listening on http://${HOST}:${PORT}${MCP_PATH}`);
  console.error(`Canonical operator source: ${OPERATOR_ORIGIN}/api/state`);
});
