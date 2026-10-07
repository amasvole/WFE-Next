# Victus startup contract

The existing `WFE Victus User Bootstrap` login task is the only owner of local
WFE-Next startup. Deploy `scripts/victus/Start-WFEVictusBootstrap.ps1` to its
existing `F:\WFE\bootstrap\runtime\Start-WFEVictusBootstrap.ps1` path. Keep the
existing task identity, Interactive/Limited Pavel principal, IgnoreNew policy,
logon trigger and retry settings. Place `runtime/wfe-next-startup-binding.json`
alongside the deployed script, containing only `sourceSha` and `nodeSha256`
bound to the exact deployed generation. Existing task arguments remain unchanged.
Explicit SHA/hash arguments are supported for negative verification. No new
task, supervisor, service, credential store, port or polling system is added.

| Phase | Component | Owner/dependencies |
|---|---|---|
| Before login | Existing GitHub runner services | SCM Auto and existing machine bootstrap; network/GitHub connectivity |
| Before login | VMware Authorization/DHCP/NAT/USB | Existing SCM Auto services; does not start guests |
| Login | Desktop Commander | Existing user bootstrap, fixed package version |
| Login | WFE-Next operator, 127.0.0.1:4317 | Same bootstrap, Pavel user profile, pinned Node/source, readable valid existing state |
| Login | WFE-Next MCP, 127.0.0.1:4327 | Same bootstrap, operator /api/state ready, existing locked MCP dependencies |
| Login | Pavel Control Plane | Existing separate exact-source Scheduled Task; not operator/MCP startup authority |
| On demand | Runner bootstrap broker/factory | Existing Manual one-shot broker client, exact WFEKey decision and admitted Candidate; protected reconciliation gate |
| On demand | Managed node handler | Existing admitted request/registered handlers; not a commissioned boot daemon |
| Never implicitly | VM provisioning, unfinished product runs, product OPEN, commissioning probe, legacy production agent poll/claim | Separate explicit lifecycle/approval only |

Both HTTP listeners are local development endpoints, not production WFE pull
transport. HTTPS/pull-only transport and WFEKey broker approvals remain unchanged.
The operator reads `.wfe-next/state.json`; startup validates it before the kernel
can silently fall back to an empty state. Startup does not invoke model/Claude,
START/OPEN, product mutations, GitHub workflows, broker requests or VMware.
Provider credentials remain in the same interactive user profile and are only
needed for a later explicit product-generation action.

The bootstrap checks clean source at its pinned SHA, its own deployed bytes and
Node hash/version; fixes only child MCP port/origin environment; uses explicit
entrypoints and repository working directory. It refuses a foreign listener,
duplicate or unready existing process. A per-session mutex serializes invocation;
existing task IgnoreNew also applies. It starts operator, verifies identity through
GET /api/state, then starts MCP and verifies dynamic tools/list. State hash must
remain unchanged. Failure is logged/nonzero; only children created by that failed
invocation are stopped. Existing task retry policy is retained. This is bounded
startup wiring, not continuous crash supervision. Source updates intentionally
require rebinding the deployment's exact SHA/hash; mismatches fail closed.

Host acceptance: existing task run completes with result 0, both readiness lines,
canonical live smoke PASS, stable state/plugin hashes, identical PIDs on a second
task invocation, invalid SHA rejected without new children, both host runners
online/idle, no new VMware guest and no new workflow dispatched. These are local
restart-mechanism proofs. A later operator-authorized Windows reboot is still
needed for post-reboot confirmation; no reboot is performed by this slice.

Root cause on 2026-10-07: operator/MCP had manual repo commands but no service,
task, Run/startup shortcut or existing bootstrap entry. The former user bootstrap
started Desktop Commander only. This was missing persistence wiring, not an
observed credential, working-directory or dependency failure. The old `WFE`
checkout/factory and WFE-Next are distinct repositories; historical MCP worktrees
must not be used to launch a second operator. Manual/stopped broker is expected;
its protected installed configuration/state require administrator read evidence
before claiming full broker/cleanup readiness.

