# WORKBENCH-003 — PROJECT LIFECYCLE & ACTIVE WORK

Verified on PavelVictus, 2026-10-06, directly in F:\WFE-Next. No delegated agents. Evidence below distinguishes the canonical user Project from the isolated deterministic runtime proof.

## RECOVERED BASELINE

HEAD, local origin/main and live GitHub main all matched fa3062f7c797006e9231f550d40fceaecce8872f. Initial working tree clean. WFE operator PID368172, exact node/server command and root verified; loadedCode de7524e0be39bf8ec51ac98db464a3a82b61725ffafea7283e80742496baaf80 matched WORKBENCH-002. Existing five Workbench surfaces, PRODUCT-LOOP evidence and canonical state were inspected before mutation. Read-only baseline retained under .wfe-next/workbench-003/baseline-state.json.

## PROJECT INVENTORY

13 Projects, 20 existing Runs; none deleted, merged or replaced. Table activity is the pre-mutation durable baseline, not a guessed creation date. Current Goal and accepted Run IDs follow. Complete before/after inventory, metadata, current Step and execution projection are in ignored inventory.json.

| Project ID | Name | Runs / accepted | Explicit purpose | Work state | Current/latest attempt | Accepted result | Baseline last activity UTC |
| --- | --- | --- | --- | --- | --- | --- | --- |
| pong | Pong Playground | 1 / 1 | LEGACY_UNKNOWN | DONE | run-1791236811376 | run-1791236811376 | 2026-10-05T21:46:51.528Z |
| real-generation | Playground | 4 / 2 | ACCEPTANCE_FIXTURE | DONE | run-1791237290779 | run-1791237290779 | 2026-10-05T21:57:00.406Z |
| general-app | Playground | 2 / 2 | ACCEPTANCE_FIXTURE | DONE | run-1791266580532 | run-1791266580532 | 2026-10-06T06:03:00.534Z |
| cross-stack | Playground | 2 / 1 | ACCEPTANCE_FIXTURE | DONE | run-1791263567602 | run-1791263567602 | 2026-10-06T05:35:13.827Z |
| household-tasks-product-loop-muwb0edl | Household Tasks Product Loop | 0 / 0 | LEGACY_UNKNOWN | NO ACTIVE WORK | None | None | Unavailable |
| household-tasks-product-loop-muwb2itp | Household Tasks Product Loop | 1 / 0 | LEGACY_UNKNOWN | BLOCKED | run-1791268600778 | None | 2026-10-06T06:41:43.786Z |
| household-tasks-product-loop-muwbb2j5 | Household Tasks Product Loop | 1 / 0 | LEGACY_UNKNOWN | BLOCKED | run-1791268998496 | None | 2026-10-06T06:48:10.699Z |
| household-tasks-product-loop-muwbl47f | Household Tasks Product Loop | 1 / 0 | LEGACY_UNKNOWN | BLOCKED | run-1791269469012 | None | 2026-10-06T07:00:37.058Z |
| household-tasks-recovery-muwc7eac | Household Tasks Recovery | 1 / 1 | LEGACY_UNKNOWN | DONE | run-1791270508721 | run-1791270508721 | 2026-10-06T07:10:34.389Z |
| household-tasks-final-muwcy8o0 | Household Tasks Final | 1 / 0 | LEGACY_UNKNOWN | BLOCKED | run-1791271759561 | None | 2026-10-06T07:43:52.822Z |
| household-tasks-final-muwdipjs | Household Tasks Final | 1 / 0 | LEGACY_UNKNOWN | BLOCKED | run-1791272714869 | None | 2026-10-06T07:53:14.895Z |
| household-tasks-final-muwdvsnz | Household Tasks Final | 5 / 2 | ACCEPTANCE_FIXTURE | DONE | run-1791276806168 | run-1791276806168 | 2026-10-06T09:54:56.592Z |
| print-queue-mini-muwicviu | Print Queue Mini | 0 / 0 | USER_PROJECT | READY | None | None | Unavailable |

- **pong**: Create a playable Pong game with one original twist. Accepted Run IDs: run-1791236811376.
- **real-generation**: Create a playable browser Pong-style game with an original twist of your choice. It must be immediately understandable and playable. For novelty, the twist must NOT involve gravity, gravity wells, or curved trajectories. Accepted Run IDs: run-1791237189776, run-1791237290779.
- **general-app**: Add a minimum-stock threshold to each filament spool. The user must be able to set the minimum remaining amount in grams for each spool. A spool whose remaining amount is below its minimum threshold must be clearly highlighted in the inventory. The application must show a summary count of how many spools currently need restocking. Existing filament inventory functionality and existing stored data must continue to work. Accepted Run IDs: run-1791237829863, run-1791266580532.
- **cross-stack**: Create a local application for managing 3D-printing jobs. A job must contain: customer; description; price; status. The user must be able to: create a job; see all jobs; change a job�s status; delete a job. The application must have a browser UI communicating with a backend API. Stored jobs must survive a backend/server restart. The application should be straightforward to start and use locally. Accepted Run IDs: run-1791263567602.
- **household-tasks-product-loop-muwb0edl**: No recorded Goal Accepted Run IDs: none.
- **household-tasks-product-loop-muwb2itp**: Create a small local browser application for tracking household tasks. Each task has a title and completion state. I can add tasks, mark them complete or incomplete, delete them, and tasks survive page reload. Keep the interface clear and straightforward. Accepted Run IDs: none.
- **household-tasks-product-loop-muwbb2j5**: Create a small local browser application for tracking household tasks. Each task has a title and completion state. I can add tasks, mark them complete or incomplete, delete them, and tasks survive page reload. Keep the interface clear and straightforward. Accepted Run IDs: none.
- **household-tasks-product-loop-muwbl47f**: Create a small local browser application for tracking household tasks. Each task has a title and completion state. I can add tasks, mark them complete or incomplete, delete them, and tasks survive page reload. Keep the interface clear and straightforward. Accepted Run IDs: none.
- **household-tasks-recovery-muwc7eac**: Create a small local browser application for tracking household tasks. Each task has a title and completion state. I can add tasks, mark them complete or incomplete, delete them, and tasks survive page reload. Keep the interface clear and straightforward. Accepted Run IDs: run-1791270508721.
- **household-tasks-final-muwcy8o0**: Create a small local browser application for tracking household tasks. Each task has a title and completion state. I can add tasks, mark them complete or incomplete, delete them, and tasks survive page reload. Keep the interface clear and straightforward. Accepted Run IDs: none.
- **household-tasks-final-muwdipjs**: Create a small local browser application for tracking household tasks. Each task has a title and completion state. I can add tasks, mark them complete or incomplete, delete them, and tasks survive page reload. Keep the interface clear and straightforward. Accepted Run IDs: none.
- **household-tasks-final-muwdvsnz**: Add an optional priority to each task with choices Low, Medium, and High. Show the priority on every task, let me change it after creation, preserve existing tasks, and keep all existing task behavior working. Accepted Run IDs: run-1791276018747, run-1791276806168.
- **print-queue-mini-muwicviu**: Create a small local browser application for tracking my 3D printing jobs. Each job has a name, printer status (Planned, Printing, Done), and optional note. I can add jobs, change their status, delete them, and the data survives page reload. Keep the interface compact and easy to scan. Accepted Run IDs: none.

All Projects had only id/name/runs, with workspace on two Projects. None had lifecycle, purpose or protection. Print Queue had zero Runs and no durable Goal/Plan; its prepared Goal/Plan existed solely in the original Edge tab. That tab was read without START. The exact visible Goal, six components, eight implementation items and seven acceptance items were recovered into the existing Project; original generation time remains unavailable. Recovery timestamp is explicitly recovery provenance and is excluded from user activity.

Authority classification:

| Class | Finding |
| --- | --- |
| A — durable authority exists | Project identity, all Run Goals/Plans, Run status/steps/start/finish/checks/verifier, DONE accepted result, workspace and recorded OPEN evidence |
| B — safely derived | Run and DONE counts; current/latest attempt; accepted result; last recorded timestamp; live RUNNING from operator active membership; current Step from that Run |
| C — missing metadata | Project lifecycle/purpose/protection; legacy creation time; original pre-Run Goal/Plan timestamps; provider ownership |
| D — must not infer | User/test/recovery/playground provenance from names, age or ID suffix; provider owner from generic Run status; creation time from generated ID; semantic Goal coverage |

## LIFECYCLE MODEL

PASS. Optional Project.metadata in existing state.json contains lifecycle ACTIVE / INACTIVE / ARCHIVED, purpose, protection and provenance source. There is no separate metadata store. Organization can be explicitly edited in Settings / Technical. Archive only changes classification; it preserves every Run. Existing unclassified Projects project as inactive protected LEGACY / UNKNOWN. New explicitly created Projects default to ACTIVE, USER PROJECT, NORMAL with a real createdAt timestamp.

## PROVENANCE MODEL

PASS. Supported purposes: USER PROJECT, ACCEPTANCE FIXTURE, RECOVERY / TEST, PLAYGROUND / EXPERIMENT, LEGACY / UNKNOWN. Four exact-ID fixtures are established by scripts/real-generation.js, scripts/general-app-acceptance.js, scripts/cross-stack-acceptance.js and docs/PRODUCT-LOOP-001.md. Print Queue is the exact existing Project identified by Pavel and confirmed in the real browser. Eight other Projects remain LEGACY / UNKNOWN. In particular a name containing Recovery, Final or Playground is not enough to assert origin. All 12 historical Projects were explicitly organized INACTIVE and protected by this milestone, without changing their execution history. The one-time migration is explicit, requires the exact baseline snapshot and stops on any drift; it is never run automatically during startup.

## ACTIVE WORK MODEL

PASS. /api/state returns a transient projectStatus projection from existing Project/Run fields and live active membership. It is never persisted as a second Run state. It exposes current Goal, prepared Plan readiness, matching current/latest Run, Step, RUNNING / READY / DONE / BLOCKED / NO ACTIVE WORK, accepted result and last activity. An unfinished recorded attempt without live membership projects BLOCKED/interrupted, without rewriting the durable Run or claiming it still runs. Provider ownership explicitly remains unavailable. New pre-Run pendingGoal/preparedPlan live directly on Project; editing Goal invalidates its prepared Plan, races reject a stale planner response, and START validates the reviewed exact Goal/Plan. Run history remains the authority after START.

## PROJECT LIST UX

PASS. Compact cards show name, lifecycle/purpose, counts, work state, PLAN READY / NO ACTIVE RUN or Run/Step, Goal excerpt, accepted identity, protection, last activity and Project ID. Live cards also show start time and actual WFE operator PID, with provider owner unavailable. Active is the fresh default and initially contains only Print Queue. User Projects, Historical / Tests and All Projects remain directly available. Cards sort running work first, then real recorded activity. Selection/filter persist locally; when a selected Project falls outside a nonempty filter, the first visible Project becomes selected. Overview contains compact PROJECT STATUS. Original responsive navigation, file/search/scratch surfaces are retained.

## CURRENT USER PROJECT

PASS. print-queue-mini-muwicviu remains the original Print Queue Mini: ACTIVE, USER PROJECT, NORMAL, 0 Runs, 0 accepted, PLAN READY, NO ACTIVE RUN, no accepted result. Exact browser Goal/Plan recovered, visible and retained across reload/restart. No replacement Project, new Goal intent, corrected Plan or user Product Run was created. START availability follows the existing review rules. A durable review note visibly warns about Pavel's known material PLA/PETG/ASA omission. No semantic verifier was added.

## HISTORICAL / ACCEPTANCE PROJECTS

PASS. Household Tasks Final household-tasks-final-muwdvsnz retains five Runs, two DONE/accepted and three BLOCKED. Current accepted result run-1791276806168, evolved shared workspace and original persistent product records remain. All 13 existing Project IDs and all historical execution fields compare to the inventory snapshot. Normal accepted OPEN refreshes the existing openEvidence field through the existing owner API; this expected runtime observation is excluded from the history comparison. No acceptance status, blocker, Goal, Plan, artifact, result or record was rewritten.

## PROTECTION GUARDRAIL

PASS. WARN BEFORE MUTATION is a UX guardrail, not a permission engine. Protected Goal starts read-only; New Goal / edit asks for explicit continuation before editing. Generate Plan, START and organization edits independently warn. API attempts without confirmed=true reject before mutation. Real Edge cancellation left a protected canonical Project unchanged. Plan/START warnings and explicit continuation were additionally exercised on an isolated prepared Project. Files, Search, Technical Details, accepted OPEN and Stop stay available. NORMAL user Project does not show this guardrail.

## LAST ACTIVITY

PASS. Maximum real recorded Project creation/Goal/Plan and Run/step/check/behavior/verifier/OPEN timestamp is used. Metadata classification and browser recovery do not fabricate activity. Print Queue and the empty historical Project correctly show unavailable. Household last activity advances only with actual regression OPEN evidence. Cards order by these real timestamps; unavailable remains explicit.

## LIVE RUN PROOF

PASS with explicit scope. 50 before-restart checks include real Edge against an isolated WFE operator at 4318, using a delayed deterministic provider and existing runtime acceptance. Actual UI Generate Plan, changed-Goal START invalidation, protected Plan/START cancellation, START -> BUILDING/RUNNING -> DONE, Goal/Run/Step/start time, accepted result and automatic clearing of RUNNING all passed. The isolated temporary Project/runtime was removed after completion. Screenshots live-running.png and live-done.png retained. This proves live RUNNING UX through the real operator, not a synthetic DOM. No canonical user Product Run or live Claude generation was invoked because the Print Queue intent is known incomplete. The real provider planning/schema boundary remains covered by existing tests; semantic correctness is not claimed.

## RESTART PROOF

PASS. Final owned idle operator 365712 -> 362648. State SHA256 before and after: 1A93773C6D2392DAF5EF2B4321FFFE7BD2B00DF161E1FE0DBD597627309AA92E. Loaded fingerprint equals disk: 662be07caa96f67796c7d3a96b35498972f0d55143e63baa4def50a663e9fdb6. Fresh Edge after restart: 36 lifecycle checks PASS, including metadata/protection, Print Queue ready Plan, 13 Projects, Household 5/2, filtering, selection, guardrails and unchanged history. No active Run or opened product during restart. Organization and prepared Plan load from the same durable Project state.

## WORKBENCH-002 REGRESSION

PASS. 33 real Edge checks after final restart: file tree expand/collapse, current accepted-root identity, byte-exact source preview, filename/path/content search, result snippets/opening, zero results, stale-query replacement, selection retention, Scratch, boundaries and 820px no-overflow. Accepted files unchanged.

## WORKBENCH-001 REGRESSION

PASS. 34 real Edge checks after final restart: Project selection, Overview, Goals/5 Runs/3 BLOCKED/2 accepted, steps/evidence, preview, Scratch reload, Technical Details, real OPEN/Stop and responsive layout. Canonical fixture planning is deliberately skipped with --inspect-only before restart; actual browser Generate Plan and changed-Goal invalidation are exercised by the isolated lifecycle harness to preserve historical drafts. Original optional real-provider planning harness still supports explicit protected continuation.

## PRODUCT-LOOP REGRESSION

PASS. Real accepted Household product OPEN, owned listener/readiness, reload, original completed/High marker and evolved Low marker verified after WFE restart. Existing kernel continuation/retry/accepted-origin/browser-proof tests PASS. Existing generation/evolution was not repeated. Stored product records preserved; cleanup Stop used existing owner API.

## HUMAN INTERVENTIONS

Pavel interventions: zero. Routine technical repairs: acceptance wait for async filter; removal of redundant harness dialog handling; timestamp formatting repair described below. Computer Use read the original browser but DevTools disallowed pasted code, which was not bypassed. Visible text was copied instead. Its final original-tab refresh was refused because the tool could not establish the browser URL confidently; all further Computer Use input stopped. Independent Edge harness acceptance was already complete; the original user tab can be normally reloaded to view the new Workbench.

## CLEANUP

PASS. All owned harness Edge instances closed. Isolated operator/Project/workspace removed from its verified temporary root. No listener at 4318 or product 61501; only intentional operator PID362648 owns 127.0.0.1:4317. active=[], opened={}. No WFE-Next acceptance Node process remains. User Edge and unrelated processes/repositories untouched. Ignored evidence retained under .wfe-next/workbench-003; no credentials read, stored or printed. A helper PowerShell JSON round-trip trimmed eight ISO timestamp fractional zeros while adding the review note; equality of actual instants was proven and only those exact original strings restored from baseline. Final history comparison PASS. Temporary lane scripts are cleaned separately after report generation.

## TESTS

PASS. npm test: 13 original kernel tests; existing workspace-files/workspace-search/planner suites; four new lifecycle tests for unknown provenance, runtime projection/no stale RUNNING, Goal invalidation/protection/restart/history and stale planner races. Browser acceptance counts above. UI/server/kernel/module syntax, loaded fingerprint and Git whitespace check PASS. New tests use disposable state only and clean their roots.

## COMMIT

Single coherent commit based on fa3062f7c797006e9231f550d40fceaecce8872f is created/pushed only after lifecycle, provenance, projection, guardrails, history, restart, all regression/tests and cleanup gates PASS. Exact final SHA and live remote identity are reported by the lane; no unrelated repo or branch changes.

## PAVEL ACCEPTANCE FINDINGS

Historical Project ambiguity is resolved by explicit classification/protection/filtering, while uncertain provenance remains honest. Pre-Run Goal/Plan was browser-only and could vanish on reload; it now persists on Project. The material omission is present already in the recovered browser Goal as well as Plan, and is visibly flagged. Neither input was silently repaired or executed. Personal usability satisfaction is still Pavel's judgment, separate from technical acceptance.

## NEXT SMALLEST STEP

Review/correct the original Print Queue Goal to include material PLA/PETG/ASA, then regenerate and review its Plan. Handle broader Goal-to-Plan coverage in a separate bounded milestone; do not expand this lifecycle slice into a semantic AI engine.

## PAVEL-SPOKO RESULT

Technical acceptance PASS: WFE now exposes current Project -> Goal -> Run/Step/execution -> accepted result/history without asking which Codex chat owns it. User and historical work are distinct; reference inspection is available and mutation needs explicit continuation. Pavel's personal satisfaction was not invented.

WORKBENCH-003 — ACCEPTED
