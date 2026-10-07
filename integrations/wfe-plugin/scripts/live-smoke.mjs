import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const endpoint = new URL(process.env.WFE_MCP_ENDPOINT ?? "http://127.0.0.1:4327/mcp");
const client = new Client(
  { name: "wfe-live-smoke", version: "0.1.0" },
  { capabilities: {} },
);

try {
  await client.connect(new StreamableHTTPClientTransport(endpoint));

  const listed = await client.listTools();
  const names = listed.tools.map((tool) => tool.name);

  if (names.length !== 1 || names[0] !== "wfe_status") {
    throw new Error(`expected exactly one tool named wfe_status; got: ${names.join(", ") || "(none)"}`);
  }

  const result = await client.callTool({ name: "wfe_status", arguments: {} });
  const view = result.structuredContent;

  if (!view || view.schemaVersion !== "wfe.status.v0") {
    throw new Error("wfe_status returned no valid structuredContent");
  }
  if (view.available !== true) {
    throw new Error(`WFE operator unavailable: ${view.error?.code ?? "unknown error"}`);
  }

  console.log("WFE MCP LIVE SMOKE: PASS");
  console.log(`Endpoint: ${endpoint.origin}${endpoint.pathname}`);
  console.log(`Tool: ${names[0]}`);
  console.log(`Operator PID: ${view.operator?.pid ?? "unavailable"}`);
  console.log(`Projects: ${view.counts.projects}`);
  console.log(`Active: ${view.counts.active}`);
  console.log(`Ready: ${view.counts.ready}`);
  console.log(`Blocked: ${view.counts.blocked}`);
  console.log(`Opened: ${view.counts.opened}`);

  for (const project of [...view.active, ...view.ready, ...view.blocked.slice(0, 5)]) {
    console.log(`- ${project.state}: ${project.name} [${project.id}]${project.currentRun ? ` · ${project.currentRun}` : ""}`);
  }
} finally {
  await client.close().catch(() => {});
}
