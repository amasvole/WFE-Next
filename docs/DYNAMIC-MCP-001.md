# WFE Windows/Victus — dynamic MCP capability surface

Verified 2026-10-06 on the Windows/Victus machine. Dynamic MCP acceptance PASS;
full existing browser regression remains blocked by local browser launch failures.
No commit, push, PR update, plugin installation or ZIP rebuild performed.

## 1. AUDIT

F:/WFE-Next was clean main at ef489670f8ff206184095d6ff4f1946247621951,
matching local origin/main and the live GitHub main API. F:/WFE-Plugin-Test
is a detached worktree of the same repository at
212efc1defcbc44b3b9c3b433d7b8941c87866ae, not a separate repository.
merge-base is ef489670f8ff206184095d6ff4f1946247621951.
Draft PR #2 remains OPEN, draft, feat/wfe-plugin-status-v0, head 212efc1.
Its untracked package-lock.json and wfe-plugin-0.1.0.zip were preserved.
The ZIP contains only root plugin.json and mcp.json; no server code.

Sources inspected: server/kernel/project-status, Workbench/architecture contracts,
prototype manifests, status view, transport, tests, installer and package lock.
Targeted duplicate search covered these worktrees, CodexProjects and installed
C:/Users/Pavel/.codex/plugins/wfe. Installed manifests equal prototype bytes.
This is a scoped source audit, not an assertion of a complete disk-wide search.
Old WFE was used only as the unchanged browser test dependency location,
F:/WFE/bootstrap/rdc/node_modules/puppeteer; no broker/runner/host edits.

## 2. CANONICAL_SOURCE

Canonical ownership: F:/WFE-Next/src/control-capabilities.js and
integrations/wfe-mcp/{src,test,scripts,package.json,package-lock.json,README.md};
stable plugin source in plugins/wfe. Bootstrap view/tests/manifests were imported
from the identified worktree, with provenance retained here. Generated ZIP,
dependencies and ignored runtime reports are output, not another authority.
Historical prototype source remains in its preserved detached worktree.
Active MCP now executes an absolute entrypoint in WFE-Next.

## 3. LIVE_WFE_STATE

13 Projects; active=0, READY=0, current BLOCKED=5, opened=0.
Print Queue Mini / print-queue-mini-muwicviu is ACTIVE USER_PROJECT, DONE,
1 Run / 1 accepted; run-1791291658889. The earlier READY/zero-Run observation
is historical. Its representation is separately covered by a real MCP test.
Household / household-tasks-final-muwdvsnz retains 5 Runs / 2 accepted and
accepted identity run-1791276806168. Counts are observations, not contracts.

Operator http://127.0.0.1:4317, PID357460, root F:/WFE-Next.
loadedCode 662be07caa96f67796c7d3a96b35498972f0d55143e63baa4def50a663e9fdb6
matches the unchanged operator runtime source set. Operator was not restarted.
Durable state SHA256 before/after live smoke:
b3873eeb2044ed9f876c93541a7ceeb3b81db0e5b3d6412383044257fc1210e4.

## 4. MCP_CURRENT_STATE

Streamable HTTP http://127.0.0.1:4327/mcp, localhost only, PID375952.
The previous one-tool bootstrap PID127536 was replaced only after candidate
PID296180 on 4328 passed. Candidate stopped; 4328 has no listener.
Final health identifies WFE-Next/integrations/wfe-mcp, read-only, 11 tools.
SDK initialize/list/call all passed through an actual HTTP client.

## 5. PLUGIN_CURRENT_STATE

plugin.json and mcp.json are unchanged from prototype AND installed source.
No rebuild, reinstall, upload or new ZIP.
SHA256 plugin.json:
5697d7bfe8786c657434b2a4aa8cc54ba40b810b50b061b6ece555adf4719979
SHA256 mcp.json:
cdcd428d9d932ba8dca368f0f571d921167dfcfc5eb35ed6431b66318ee3adf2
The package contains identity/presentation and an MCP endpoint, no tool list.

## 6. DYNAMIC_CAPABILITY_DESIGN

WFE-owned catalogue -> generic MCP discovery/call adapter -> canonical GET state.
Each entry declares input/output JSON Schema, stable name/description,
safetyClass, read/write access, supported/unavailable state, handler identity,
approval.required, approval.authority and approval.granted=false.
Standard SDK/AJV validates arguments and structured outputs.
Integration contract wfe.mcp.integration.v1; normal MCP protocol negotiation.
wfe.status.v0 is retained; other tools use wfe.control.v1.

A real HTTP test added wfe_test_observation to a test server registry, discovered
and invoked it while plugin hashes, existing tool schemas, server identity and
instructions remained unchanged. Production discovery increased from one to
11 tools at the SAME installed-plugin URL with the same manifest bytes.
Ordinary additions require server code/restart and client rediscovery.
Existing-session hot reload and automatic ChatGPT UI cache refresh are not claimed.

## 7. CAPABILITIES_EXPOSED

Supported read projections:
wfe_status, wfe_projects_list, wfe_project_get, wfe_run_get, wfe_work_get,
wfe_blockers_get, wfe_workbench_get, wfe_system_get, wfe_capabilities_list.

Explicit unavailable discovery entries:
wfe_runners_get, wfe_pending_decisions_get.
They return WFE_AUTHORITY_NOT_IMPLEMENTED, not fictitious empty healthy lists.
No test-only capability is retained in the production registry.

## 8. WFEKEY / MUTATION_BOUNDARY

No writes or shell capabilities exposed. Only GET /api/state is reachable by
the adapter. Unknown/extra command and approved arguments reject.
Future privileged write entries must declare WFEKey, but ALL writes remain
denied before handler/network execution. A test sets granted:true and proves
discovery still reports false and handler/network counters remain zero.
MCP metadata is not an approval receipt. Actual future execution requires
a separately implemented canonical WFE/WFEKey authority flow.

## 9. WORKBENCH / SYSTEM PROJECTION

Recorded lifecycle/purpose separates user and historical/acceptance work.
Current Goal, current Run, execution, accepted result and blocked history
remain distinct. Workbench history defaults to last 50 Runs, max100,
with total/truncation metadata. No raw logs, paths or runtime commands returned.
Scratch is local to the Workbench client and explicitly unobservable here.

System reports operator, WFE version, worktreeClean=false, startup disk identity/fingerprint comparison and adapterLoadedCode eab571614c085c49fcb5ba0bbbd720bd53065ae9288ffcac9f189205b0c4fb20.
No canonical WFE-Next development-work classification, node registry, runner
inventory, incident authority or WFEKey decision contract exists yet.
Victus/Mac/runner/decisions are explicitly unavailable. Old production runner
security remains untouched; Mac is not another control plane.

## 10. TESTS

MCP: 14/14 PASS, including all ten requested invariants.
Existing workspace-files, workspace-search, planner and project-status suites PASS.
Kernel: 8/13 PASS; 5 browser-dependent failures with default Edge launch error.
An existing WFE_BROWSER_EXE override was tried with the installed headless shell;
it produced spawn EFTYPE and did not resolve the dependency. No browser installs,
system changes or acceptance bypass performed. Full npm test is not green.

## 11. LIVE_SMOKE

PASS first on candidate 4328, then canonical 4327 against real 4317.
All 11 tools discovered and invoked; 9 supported succeeded, 2 explicitly
unavailable. State hash, full Project content and operator PID unchanged.
Evidence: .wfe-next/mcp/live-smoke.json (ignored local output).
Final warm wfe_status samples: 32,3,29,31,6,17,9,27,6ms.
Original prototype samples: 11,26,17,12,32ms.
Cold canonical first status call: 69.8ms. No speedup claimed.
Schema compilation uses an in-memory compiled-schema cache; WFE state is never
cached. Each runtime tool reads one snapshot with 2s/8MiB bounds.
A bounded canonical operator endpoint is the next performance option only
if future measurements justify it.

## 12. CHANGES

Added canonical catalogue, generic transport, strict schemas/safety metadata,
GET-only bounded client, projections, compatibility tests, live smoke and
operation/provenance documentation. Added root npm scripts for MCP install,
start, tests and smoke. Locked dependencies installed offline with scripts disabled.
Added a release-only packaging definition requiring a caller-supplied output;
it refuses existing outputs. No package was generated for these tool additions.
Existing operator/kernel/UI and persisted projects/history were not edited.

## 13. COMMITS / PRS

Changes are local uncommitted reviewable files in F:/WFE-Next on main.
No new branch, commit, push, merge or PR modification authorized/performed.
Historical https://github.com/amasvole/WFE-Next/pull/2 remains draft at 212efc1.
Live GitHub main remains ef489670f8ff206184095d6ff4f1946247621951.

## 14. BLOCKERS

Full browser regression: Edge fails to launch; alternative cached shell EFTYPE.
Canonical runner/node/WFEKey/development-work authority contracts missing.
Actual ChatGPT UI rediscovery was not exercised; MCP transport/discovery is proven.
These limitations do not block the demonstrated server-only capability addition.

## 15. NEXT_SMALLEST_STEP

Reconnect the existing ChatGPT WFE connection and confirm expanded tools in
the actual host. Resolve the browser launch dependency in a separately bounded
check before treating full WFE regression as green. Review the local diff before
any commit/push or historical PR supersession.

ORDINARY_CAPABILITY_REQUIRES_PLUGIN_REBUILD = NO


