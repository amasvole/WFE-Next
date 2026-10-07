# Canonical self-management / work-state authority

Repository candidate based on accepted main `457062712fed94b5623593683b36e8ed0c47ab5d`. No live store adoption, startup change, service operation or merge is performed by this slice.

## Authority audit

Inspection of the canonical snapshot on 2026-10-07 found top-level `projects` and `productControl`, 14 Projects, 21 Runs and no `workState`. Two Projects are explicitly ACTIVE USER_PROJECT; the remaining metadata is INACTIVE. Those classifications are retained verbatim, not converted to work acceptance or history.

| Source | Classification | Authority and reuse |
| --- | --- | --- |
| `.wfe-next/state.json`, `Kernel.state` | CANONICAL | Single owner and durable JSON snapshot; existing atomicSave reused. |
| `Project.id/name/metadata` | CANONICAL | Product identity, explicit lifecycle/purpose/protection. ACTIVE/INACTIVE/ARCHIVED classifies the Project, not an engineering work item. |
| `Project.pendingGoal/preparedPlan` | CANONICAL | Current product goal and reviewed plan; no new goal store. |
| `Project.runs`, Run/Step/status/verifier/blocker | CANONICAL | Recorded execution lifecycle and evidence. Historical attempts remain unchanged. Legacy blocker text stays readable. |
| Old completed Runs and acceptance evidence | HISTORICAL | DONE records product completion; does not attest infrastructure SHA acceptance or WFEKey approval. |
| `projectStatus()`, `/api/state.projectStatus`, status-view | DERIVED PROJECTION | Existing product Goal/Run/result projection. Not an engineering acceptance authority. |
| Workbench UI, work/history/control getters | DERIVED PROJECTION | Read existing Projects/Runs. Scratch is client-local, not canonical or discoverable. |
| `active`, `opened`, operator PID/loadedCode | RUNTIME OBSERVATION | Process-local execution/open-preview evidence, never engineering lifecycle or health authority. |
| Adapter sourceIdentity (SHA/clean/start timestamp/fingerprint) | RUNTIME OBSERVATION | Disk identity at adapter startup, separate from accepted main and candidate SHA. |
| `productControl.receipts/consumedApprovals` | CANONICAL | Existing empty-product-create policy, exact-SHA receipt and idempotency authority; unchanged. |
| `Run.decisions`, Project protection, confirmed boolean | HISTORICAL / CANONICAL policy metadata | Recorded execution context and legacy protection; never verified WFEKey approval. |
| WFEKey verification port in ProductMutation | EXTERNAL REFERENCE | Approval authority remains WFEKey; no general decision authority is implemented in this kernel. |
| MCP READ/PRODUCT capability registries | DERIVED PROJECTION | Server-owned contract/availability and fixed handler dispatch; reused for four reads. |
| GitHub PR/branch/check/commit/merge | EXTERNAL REFERENCE | Evidence linkage only; PR merged never changes work lifecycle. |
| Runner/node getters and system node entries | DERIVED PROJECTION | Explicitly unavailable canonical authority. Operator PID does not imply machine or runner health. |
| Victus bootstrap source/accepted startup documents | HISTORICAL + EXTERNAL REFERENCE | Frozen implementation and acceptance evidence; unchanged. Operator-declared acceptance may be recorded explicitly. |
| Earlier acceptance scripts and dated docs | HISTORICAL | Useful evidence, not current work-state authority. PRODUCT-CONTROL-001's original product.create-unavailable statement predates PRODUCT-CREATE-001/code. |
| Legacy `wfe_work_get` / `wfe_blockers_get` | DERIVED PROJECTION / LEGACY terminology | Preserve existing consumers; product execution/history projections, not a second durable work store. |
| Chat, terminals, provider transcripts | EXTERNAL REFERENCE | Never read to infer current canonical work state. |

No separate queue, database, incident registry, runner registry or generic workflow engine exists here to reuse. There is no duplicate durable work authority to synchronize.

## Minimum model

Optional `Project.workState`, schema `wfe.project.work.v1`, contains project-scoped stable items (identity is Project ID + work ID). The Project owns each item without a duplicated owner field. `managedSystem: WFE` marks at most one ordinary Project; optional `acceptedMainSha` records accepted canonical source independently of runtime observations and each item's candidate SHA.

Items record title/purpose, optional same-Project parent/related references, explicit `ACTIVE`, `WAITING`, `BLOCKED`, `READY`, `DONE`, `FROZEN`, `HISTORICAL`, `CANCELLED` lifecycle, optional execution binding, and required nextAction. FROZEN means explicitly accepted/frozen engineering work. Project lifecycle and Run execution states have different semantics and remain intact.

Optional binding fields: currentRunId, acceptedRunId, repository, pr, branch, candidateSha, frozenSha, node, runner, decisionId, githubCheck. Run IDs must exist in the owning Project; acceptedRunId must reference DONE. SHA fields are full 40-character commit identities; branch/PR never substitute for them. Accepted main, candidate and frozen identity are separate fields. Missing bindings are omitted, never fabricated.

BLOCKED requires class, summary and observedAt; optional cause code, dependencyWorkId, requiredAction and approvalId describe resolution. Non-blocked items cannot retain a current blocker. Explicit unknown cause is supported. Dependencies resolve within the owning Project and cannot reference themselves.

nextAction kinds are AUTOMATIC, WFEKEY, OPERATOR, NONE. Terminal items must use NONE. Current items require an explicit action. AUTOMATIC only names one of the four fixed read capabilities in this slice; no command, shell, HTTP passthrough or mutation dispatcher exists. WFEKEY and OPERATOR are requirements, never evidence that approval has been granted or an action has run. Next-action lists include blocked/waiting resolution actions with their lifecycle and blocker still attached; they are not an executable queue.

Closed schemas reject unknown fields, including approval booleans. Up to 100 items per Project, 1000 total, one managed WFE Project. Kernel load/save and MCP state validation enforce the same schema and semantic rules. Read getters clone output and sort Project/item IDs; no clock or GitHub lookup determines lifecycle. No work-state mutation capability exists, so product operations cannot accidentally transition a frozen work item.

## Projection

Existing operator stack adds GET `/api/current-work` and `/api/self-state`. Four server-discovered MCP reads: `wfe_current_work_get`, `wfe_work_item_get`, `wfe_next_actions_get`, `wfe_self_state_get`. No plugin edits, rebuild or reinstall. Discovery is 25 capabilities in the candidate; the frozen live server remains at 21 until approved rollout.

Current-work output groups the same canonical records by lifecycle. Items include `authorities: {runner: UNAVAILABLE, node: UNAVAILABLE, approval: UNAVAILABLE, approvalAuthority: WFEKey, granted: false}`. Binding names are references, not authority or health assertions. Self output is UNKNOWN when no managed WFE Project is recorded; a recorded Project can still have a null accepted main. Runtime identity remains available independently through `wfe_system_get`.

## Compatibility and adoption

Missing workState means unclassified, with no inferred work items, accepted SHA, blockers or current development. Existing metadata, Goal/Plan, Runs, receipts and Workbench remain readable and unchanged. Projection does not write a migration. Invalid JSON/work-state fails closed on load rather than replacing the store with an empty state. This intentionally makes malformed state a visible operator repair condition.

`scripts/stage-self-state.cjs` accepts an offline snapshot, an explicitly reviewed managed Project, and a new output path. It clones the snapshot, adds only that Project, validates and writes exclusively (`wx`); it never overwrites the input/output or existing managed Project. It has no live-store deployment path. Existing self Project requires a separately reviewed state update; this slice adds no mutation authority.

`docs/examples/wfe-self-project.json` is a schema-valid review example, not a migrated live record. It includes the owner-declared accepted baseline and current slice; BLOCKED/historical demonstration entries are labelled illustrative, not factual claims about old work. Before adoption, replace/remove illustrative entries and record exact reviewed PR/candidate/decision/Run identities where applicable. Use a fresh snapshot under a separately approved quiescent owner operation; do not replace a live store from a stale snapshot. No historical Project/Run is reclassified or rewritten. Ongoing work updates need an authorized canonical-owner operation; they cannot be performed through these new read capabilities.

## Example answers, deterministic from the supplied example

| Operator question | Projection answer |
| --- | --- |
| What is WFE doing right now? | ACTIVE `wfe-self/self-management`: canonical self-management implementation review. Accepted main remains `457062712fed94b5623593683b36e8ed0c47ab5d`. |
| What is blocked? | BLOCKED `adoption-example`, class DEPENDENCY, code EXAMPLE_ACCEPTANCE_PENDING, dependency self-management, recorded observation timestamp and required operator acceptance. This row is explicitly illustrative. |
| What is the next executable action? | OPERATOR review of the bounded candidate/draft PR; adoption-example also requires OPERATOR dependency resolution. No automatic mutation is authorized. |
| What must remain frozen? | FROZEN victus-startup, frozen SHA equals the accepted baseline, nextAction NONE. |
| What is historical only? | HISTORICAL demo-example, nextAction NONE. No existing demo was changed. |

## Changed files and validation

- `src/work-state.js`: canonical schema, validation, deterministic projections.
- `src/kernel.js`: validation at load/save; malformed state is not silently reset.
- `src/control-capabilities.js`: four bounded read capabilities, shared validation.
- `src/server.js`: two GET projections and source fingerprint includes the new runtime module.
- `integrations/wfe-mcp/src/adapter.mjs`: matching source fingerprint dependency.
- `scripts/stage-self-state.cjs`: offline review snapshot staging.
- `docs/examples/wfe-self-project.json`: explicit example Project with four lifecycle examples.
- `docs/SELF-STATE-001.md`: audit, model, adoption boundary, results.
- `test/work-state.test.js`: lifecycle, schema, blockers/actions, reference non-authority, reload, legacy preservation, staging and product.create preservation.
- `integrations/wfe-mcp/test/work-state.test.mjs`: dynamic registry schemas, read-only calls, invalid/legacy state and plugin preservation.
- `integrations/wfe-mcp/test/registry.test.mjs`: argument/absence expectations for project-scoped work lookup.
- `integrations/wfe-mcp/test/product-control.test.mjs`: capability count grows from 21 to 25.
- `package.json`: new canonical-work tests included in the ordinary test command.

Verification: full existing npm test passed (13 kernel tests, workspace-files/search/planner suites, 4 Project lifecycle tests); new work-state tests 7/7; product mutation regressions 10/10; MCP regressions 18/18, including real transport discovery. Initial sandbox test failures were EPERM temp-file rename, resolved by running isolated tests outside the restrictive sandbox. Locked MCP dependencies installed with scripts disabled; initial restricted-network install was cancelled. No changes to lockfiles/plugin manifests/startup scripts, no live store writes.

Repository implementation is ready for draft review. Runtime adoption is deliberately pending merge and scoped owner authorization; until then the live system has no recorded self Project and must report UNKNOWN through any future deployment of these getters without adoption.
