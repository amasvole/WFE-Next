# WFE ChatGPT Plugin — status v0

Read-only MCP adapter for the canonical WFE-Next local operator.

## Boundary

This milestone exposes exactly one tool:

- `wfe_status` — current operator, Project, Goal, Plan readiness, Run/Step, blockers and accepted-result identity.

It does **not** expose a shell, filesystem, Git commands, process control, WFE mutations, approvals, credentials, or WFEKey authority.

The adapter does not read `.wfe-next/state.json` directly. Its only WFE source is the existing canonical operator projection:

`GET http://127.0.0.1:4317/api/state`

The configured operator origin is validated as loopback-only.

## Run locally

```bash
cd integrations/wfe-plugin
npm install
npm test
npm start
```

The MCP endpoint is:

`http://127.0.0.1:4327/mcp`

The root health endpoint is:

`http://127.0.0.1:4327/`

With a live WFE operator and MCP server running, execute the reproducible end-to-end probe:

```bash
npm run smoke:live
```

It verifies that exactly one tool (`wfe_status`) is advertised and that its structured result reports `available=true`.

Override only the port if needed:

```bash
WFE_MCP_PORT=4328 npm start
```

`WFE_OPERATOR_ORIGIN` may point to another **HTTP loopback** port, but remote/LAN origins are rejected.

## Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector@latest
```

Choose **Streamable HTTP** and connect to `http://127.0.0.1:4327/mcp`.

## ChatGPT connection

ChatGPT custom MCP plugins use a Streamable HTTP endpoint. Keep this service loopback-only and connect it through **Secure MCP Tunnel** for private use.

Do not expose this unauthenticated development endpoint directly to the public internet. A future public/remote deployment requires explicit authentication/authorization and a separate security review.

## Next bounded milestone

After live status is proven end-to-end in ChatGPT:

1. add focused read-only tools for Project and Run detail only if `wfe_status` is insufficient;
2. keep raw evidence opt-in rather than returning terminal-sized logs by default;
3. add write actions separately behind existing WFE policy + WFEKey boundaries;
4. never introduce a generic shell tool.
