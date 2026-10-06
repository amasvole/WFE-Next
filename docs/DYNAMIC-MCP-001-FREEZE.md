# DYNAMIC-MCP-001 freeze and ChatGPT rediscovery

This is the freeze follow-up to DYNAMIC-MCP-001.md. That document is the original
pre-commit historical report; its uncommitted/dirty/startup-SHA descriptions refer
to that observation. No capability, plugin file or runtime implementation changed
during freeze. The owner explicitly authorized one focused local commit.
Its exact SHA is recorded in ignored .wfe-next/mcp/freeze/checkpoint.json
and the final engineering response, avoiding a self-referential commit hash.

## WORKTREE_CLASSIFICATION

The 15 original changed files all belong to DYNAMIC-MCP-001:
package.json; docs/DYNAMIC-MCP-001.md; src/control-capabilities.js;
integrations/wfe-mcp/README.md, package.json, package-lock.json,
scripts/live-smoke.mjs, scripts/package-plugin.ps1,
src/adapter.mjs, src/server.mjs, src/status-view.mjs,
test/registry.test.mjs, test/status-view.test.mjs;
plugins/wfe/plugin.json and mcp.json.
This freeze document is the sole additional source file.
No unrelated/pre-existing dirty files or staged changes were found.
package-lock.json is a reproducibility input and is included.
Ignored .wfe-next/ and integrations/wfe-mcp/node_modules/ are runtime/build
output and excluded; every ignored path and dirty path is enumerated in
.wfe-next/mcp/freeze/worktree-classification.json.

## TESTS

npm run test:mcp: 14/14 PASS again. Proof includes real loopback HTTP discovery
and invocation, a test-only registry addition with unchanged plugin bytes,
server identity/instructions and existing schemas, mutation/approval rejection,
schema stability, no shell and non-local Host/Origin rejection.
npm run mcp:smoke: PASS against the preserved canonical 4317 and 4327 services,
all 11 tools invoked, state hash and Project history unchanged.
Two fresh independent MCP clients returned identical tools/list.
No kernel/browser regression was rerun or modified in this bounded slice.

## FROZEN_COMMIT

One focused local commit on the canonical main checkout, no push or PR writes.
Draft PR #2 is the older bootstrap at 212efc1defcbc44b3b9c3b433d7b8941c87866ae,
whose branch still includes the historical integrations/wfe-plugin layout.
A new WFE-Next PR is more appropriate for the canonical integrations/wfe-mcp
implementation and discovery checkpoint. Do not rewrite PR #2 in this task.
Push/new PR requires separate scoped authorization.

## MCP_BASELINE

Baseline captured 2026-10-06T13:56:31.258Z before any ChatGPT reconnect.
Local evidence folder: .wfe-next/mcp/freeze.
tools-list.wire.json: exact response text to real tools/list.
tools-list.result.json: parsed tools/list including input/output schemas and metadata.
integration-metadata.json: deterministic sorted connection + initialize + contract.
registry-discovery.json: stable capability records, excluding observation timestamps.
transport-transcript.json: real initialize/list/call wire messages.
live-invocations.json: status, Project list, work, Print Queue Run and system results.

Protocol negotiated 2025-11-25; server wfe/0.1.0.
Integration contract wfe.mcp.integration.v1; no separate registry version exists.
Stateless Streamable HTTP returns no MCP session ID.
Capability names:
wfe_status, wfe_projects_list, wfe_project_get, wfe_run_get, wfe_work_get,
wfe_blockers_get, wfe_workbench_get, wfe_system_get, wfe_capabilities_list,
wfe_runners_get, wfe_pending_decisions_get.
Last two deliberately return authority-unavailable; nine read projections are supported.

SHA256 exact tools/list wire:
0dc2b5a1b48f89fdac960516d071d6612797009c19190e5f37e99b7aa23591da
SHA256 parsed tools/list:
27c279ec46c3615e4743f7e3d1e6c976fa461fc34bb6047fb550fd00527aa850
SHA256 integration metadata:
63e8efa778b23e547e8376a193b90e384e1bc958f4ad189962278c650497ffe4
SHA256 registry data:
5a17e933f2d579e7806466877f57918677731edda59e1a97e6727ec509b0bbc7

## PLUGIN_HASHES_UNCHANGED

Canonical, installed and prototype files have identical SHA256:
plugin.json: 5697d7bfe8786c657434b2a4aa8cc54ba40b810b50b061b6ece555adf4719979
mcp.json: cdcd428d9d932ba8dca368f0f571d921167dfcfc5eb35ed6431b66318ee3adf2
Existing prototype ZIP SHA256:
063feff60a208dd3e50d5f6f18d24c1eb8bb7bfe96bb4a6530324e4a5d76b095
No plugin modification, rebuild, repackage or reinstall performed.

## LIVE_PROCESSES

Operator PID357460: 127.0.0.1:4317, canonical F:/WFE-Next.
MCP PID375952: 127.0.0.1:4327, absolute canonical entrypoint.
Both preserved throughout freeze; no listener restart.
State hash:
b3873eeb2044ed9f876c93541a7ceeb3b81db0e5b3d6412383044257fc1210e4
MCP loaded-source fingerprint:
eab571614c085c49fcb5ba0bbbd720bd53065ae9288ffcac9f189205b0c4fb20
The live system sourceIdentity SHA ef489670... and worktreeClean=false are
explicitly startup observations from before commit. They do not refresh until
a future separately justified restart; they are not the current Git checkpoint.
Disk/runtime hashes match and implementations remain unchanged.

## CHATGPT_REDISCOVERY_STEPS

1. Open the existing WFE connection details and refresh/reconnect its MCP
   discovery. Do not reinstall, remove/add, or change its endpoint/tunnel.
   For a direct custom MCP connection the official flow is
   ChatGPT Plugins -> existing connection -> Refresh.
   If that control is absent in the actual installed host, stop and report the
   visible connection type; do not substitute installation or a public endpoint.
2. Start a fresh ChatGPT conversation with the existing WFE plugin selected.
   Inspect discovered tools: 11 names above. A model-written list alone is
   not proof; record host tool details and actual invocation/result traces.
3. Send this single verification prompt:

   Use only the existing WFE connection. Invoke wfe_capabilities_list,
   wfe_status, wfe_projects_list, wfe_work_get and wfe_run_get with
   {"projectId":"print-queue-mini-muwicviu","runId":"run-1791291658889"}.
   Show actual tool names, arguments, observedAt, operator PID, counts,
   Print Queue current/accepted Run and any errors. Do not infer success
   from this prompt or prior conversation. Do not mutate anything.

4. Match actual traces to baseline: 11 capabilities; available=true for the
   requested reads; operator PID357460; current live state, at baseline
   13 Projects/0 active and Print Queue accepted run-1791291658889.
   Counts/history may legitimately change after baseline; obtain a fresh
   canonical read if they differ. The old startup SHA/dirty flag is expected.

Official Refresh/new-conversation guidance:
https://developers.openai.com/plugins/deploy/connect-chatgpt
It applies to direct custom MCP connections; the current ChatGPT UI/account
connection type has not been inspected by this agent.

If only wfe_status remains visible, use evidence to locate the boundary:
- Local tools/list still has 11 and two fresh clients agree: server discovery works.
- No remote trace yet: ChatGPT connection/conversation cache or a different
  endpoint/tunnel target are hypotheses, not diagnosed facts.
- Fresh ChatGPT connection metadata shows 11 but old conversation only one:
  conversation/tool-import cache is the supported boundary.
- ChatGPT-side tools/list shows one while local shows 11: investigate its
  actual endpoint/tunnel/client filter; do not blame the plugin package.
- Initialization/list errors: record HTTP/protocol/schema/origin errors.
- MCP session caching is not demonstrated here: stateless server, no session ID.
- Plugin metadata still connects to the same endpoint and contains no tool list.

## KNOWN_UNRELATED_FAILURES

Original kernel suite: five browser-dependent failures (Edge launch;
alternative cached headless shell spawn EFTYPE). Neither kernel nor browser
executor/runtime/UI was changed by DYNAMIC-MCP-001. No evidence attributes
those failures to this adapter; no browser repair or bypass in this freeze.

## BLOCKERS

No local blocker to ChatGPT rediscovery verification.
Actual ChatGPT success remains pending human-host evidence.
Host connection/tunnel reachability and its refresh control are not verified.
Missing runner/node/WFEKey authority remains explicit and outside this slice.

SAFE_TO_VERIFY_IN_CHATGPT = YES

