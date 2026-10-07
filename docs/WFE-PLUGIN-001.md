# WFE-PLUGIN-001 — Read-only ChatGPT status bridge

## Goal

Make the live state of WFE-Next directly queryable from ChatGPT through a purpose-built MCP plugin, without using a generic cloud shell or creating a second WFE orchestration/state system.

## Base

Implementation branch starts from:

`ef489670f8ff206184095d6ff4f1946247621951`

## v0 contract

One MCP tool:

`wfe_status`

It reads the canonical local operator `/api/state` projection and returns a bounded structured view covering:

- operator availability and loaded-code identity;
- Project lifecycle/purpose/protection;
- current Goal;
- prepared Plan readiness;
- current Run and Step;
- RUNNING / READY / BLOCKED / DONE / NO ACTIVE WORK;
- accepted-result identity;
- last activity;
- compact counts.

## Authority boundary

v0 is R1/read-only.

It cannot:

- execute shell commands;
- access arbitrary files;
- run Git;
- start/stop products or Runs;
- mutate Goals or Plans;
- approve actions;
- sign anything;
- bypass WFEKey;
- become an alternate state store.

The only live WFE input is the already-existing operator `GET /api/state`. The adapter intentionally does not parse `.wfe-next/state.json` itself.

## Network boundary

The adapter binds only to `127.0.0.1`.

The operator source must also be an HTTP loopback origin. Remote and LAN origins fail closed.

Private ChatGPT access should use Secure MCP Tunnel. Direct public exposure of the unauthenticated development endpoint is out of scope.

## Output policy

Default output is consolidated rather than terminal-like:

- headline availability/counts;
- active work;
- ready work;
- blocked work;
- structured Project status for deeper reasoning.

Raw Run records, filesystem roots and terminal logs are not copied into the v0 result.

## Acceptance

Before merge:

- install exact plugin dependencies;
- `npm test` in `integrations/wfe-plugin` passes;
- MCP Inspector initializes over Streamable HTTP;
- `wfe_status` returns `available=true` against a live operator;
- stopping/unreachable operator returns explicit `WFE_OPERATOR_UNAVAILABLE`, not fake empty healthy state;
- remote `WFE_OPERATOR_ORIGIN` is rejected;
- no write tool is advertised;
- no raw Project Run payload or operator filesystem root leaks from the bounded status view;
- ChatGPT custom MCP connection can invoke `wfe_status` through the private tunnel.

## Next step

Do not add write capability in this milestone. First prove that `@WFE co se teď děje?` reliably answers from live canonical state.
