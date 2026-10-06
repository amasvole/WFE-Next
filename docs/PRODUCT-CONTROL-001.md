# Product-control slice — 2026-10-06

## Result

BLOCKED_END_TO_END. No new application was generated. A guarded discovery and observation slice was implemented in canonical F:\WFE-Next. This is a partial implementation, not a successful PLAN → BUILD → TEST → ACCEPT → DONE demonstration.

## Audit

Initial checkout was clean, HEAD bfd91d1a30aee00dcc6f46d1b0b61ef3288dcea9. DYNAMIC-MCP-001 supplies 11 server-owned read capabilities through a thin stable plugin. Its adapter rejects all writes before invoking handlers or HTTP. Existing operator routes include POST /api/projects, /api/plan, /api/start and /api/open/:id. Kernel planning persists preparedPlan; start/evolve performs build, static checking, behavioral acceptance and verification. The final verifier sets DONE. There is no separate authoritative acceptance.run endpoint.

Project protection and a confirmed boolean are present. Neither is a WFEKey decision. This repository has no canonical broker/policy/WFEKey decision consumption, exact-SHA execution binding or durable operation receipt contract. Startup sourceIdentity is observation metadata, not authorization. Exposing existing POST routes through MCP would bypass the requested security boundary. An adapter-created approval or receipt would not repair that gap.

## Minimal surface

| Semantic operation | MCP name | Current behavior |
| --- | --- | --- |
| product.create | wfe_product_create | BLOCKED; no mutation authority |
| product.open | wfe_product_open | BLOCKED; launches a process |
| product.status | wfe_product_status | Canonical Project projection |
| work.plan | wfe_work_plan | BLOCKED; persists a plan and invokes provider |
| work.start | wfe_work_start | BLOCKED; reviewed-plan authority absent |
| work.status | wfe_work_status | Canonical Run projection |
| acceptance.run | wfe_acceptance_run | BLOCKED; execution authority absent |
| acceptance.result | wfe_acceptance_result | Recorded status/verifier; no fresh attestation |
| artifact.list | wfe_artifact_list | Safe recorded names; existence/integrity unverified |
| artifact.preview | wfe_artifact_preview | BLOCKED; opened state lacks run-bound ownership/freshness |

Strict inputs reject unknown properties, including client-provided approved flags. No generic command, shell, filesystem path or approval-token input is exposed. Mutations advertise write/WFEKey-required/unavailable and fail before any handler/network operation. Existing 11 capabilities are preserved. New default discovery contains 21 tools. Plugin files retain their frozen hashes.

## Evidence

- MCP tests: 15/15 PASS, including actual Streamable HTTP discovery/invocation and mutation rejection without HTTP access.
- Live isolated MCP listener against canonical operator PID 357460: 21 discovered tools; product/work/acceptance/artifact reads succeeded for existing Print Queue Mini, run-1791291658889.
- New Counter application requests for create/plan/start/acceptance were explicitly rejected. No new Project or Run exists.
- Only four GET /api/state requests occurred. Canonical persisted state hash stayed b3873eeb2044ed9f876c93541a7ceeb3b81db0e5b3d6412383044257fc1210e4.
- Existing 4327 service smoke passed with its original 11 tools. Existing listeners were preserved. New discovery was proven on a separate ephemeral listener; it is not yet loaded in the persistent service or verified inside ChatGPT.
- Browser acceptance was not rerun. Historical DONE is not fresh acceptance. The freeze document records earlier browser launch failures; these were not independently reproduced here.

Detailed real MCP responses are in product-control-evidence.json. Changes are uncommitted; nothing pushed or deployed.

## Shortest next step

Implement or connect one real canonical mutation authority contract before enabling any MCP write. It must validate operation + canonical source/candidate identity + plan/goal digest + WFEKey decision scope/expiry/single use; fail on dirty/stale identities; serialize operations per product; persist an idempotent receipt with operation/project/run/decision/identity and result; reject replay and plan drift. That authority must wrap kernel mutations, not merely be a check in the MCP adapter. Preview needs a run-bound owned endpoint receipt; acceptance needs exact candidate evidence.

Start with product.create through this authority and prove approved execution, denied execution, stale SHA, replay and durable receipt recovery. Then route plan/start and the existing internal build/test/accept sequence through the same contract, capture a generated candidate digest, and rerun the Counter demo. No genuine WFEKey integration is available in this repo to consume today; a local fake approval would not satisfy the task.
