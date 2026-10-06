# PRODUCT-LOOP-001 — local acceptance evidence

Verified on PavelVictus, 2026-10-06. This closes the existing PRODUCT-LOOP-001; it does not start a new milestone.

Accepted baseline before this work: `f3aa8a83b6cb1d019b0058b42431f027234a46b8`.
Project: `household-tasks-final-muwdvsnz` (Household Tasks Final).
Canonical authority: `.wfe-next/state.json`. Disposable detailed evidence remains in `.wfe-next/recovery-product-loop-001/` and is not tracked.

## Recovery and root cause

The recovered Run `run-1791273326239` was legitimately BLOCKED, finished at `2026-10-06T08:08:39.089Z`; it was not orphaned. Its evidence and workspace were preserved. No new Project was created.

The old operator process started at `07:28:50 UTC`, before the kernel's `07:36:27 UTC` modification. In a copied workspace, omitting the assigned PORT from the artifact-owned accept command reproduced the exact `fetch failed` with no behavioral checks. With the current port propagation the same artifact produced 11 passing live API checks. This identifies a WFE runtime boundary failure consistent with the stale operator, rather than requiring a product rewrite. A second reproducible WFE failure rejected a valid formatted JSON acceptance document despite exit code 0 and pass=true; evidence parsing now accepts the complete document.

Procedure failures were recorded honestly, without product repair. Two additional Goal 1 attempts remain BLOCKED in history (`run-1791274938671`, `run-1791275557802`). The latter contained complete payloads nested under known operation names. Lossless normalization now supports that shape, rejects conflicting payloads, and still rejects unknown operations or missing semantic fields. A normal explicit retry of the same Goal after a terminal contract/procedure/runtime boundary failure copies the candidate into a new isolated workspace, records retryOf, and independently checks it. It does not rewrite the old Run or claim provider success as acceptance.

Provider inspection also showed that allowedTools did not remove Bash. The local CLI now uses actual tools restrictions, restricted workspace file tools, safe mode, dontAsk, and strict MCP configuration. Planning exposes Read/Glob/Grep; generation additionally exposes Write/Edit. Auth and model selection remain unchanged. No shell, agents, MCP, hooks, or customization execution is added to the provider surface.

## Runtime and contract rules

- Operator/control endpoint remains `http://127.0.0.1:4317/`.
- Accepted product assignment is `http://127.0.0.1:61501/`, declared through runtime.portEnv=PORT. Acceptance, readiness, browser execution, OPEN, evolution, and reopen preserve that effective local origin.
- WFE performs local bind preflight, rejects its protected operator port and occupied endpoints, and verifies the listener belongs to the exact spawned product PID. Readiness requires successful HTTP status plus live process ownership; HTTP 200 alone is not OPEN authority.
- The generated source is not rewritten to change a port. Only the declared runtime port binding is supplied to the generated child; the internal browser-executor port marker is removed before product spawn. Reserved environment bindings are rejected.
- The independent browser executor starts its own intended product process after the initial acceptance process has been stopped, using the same assignment. stopBackend/startBackend/reload prove actual lifecycle and fresh network observations.
- Browser commands remain argv, with shell=false. Runtime code contains no household task or priority rules.
- accept command+args, accept.procedure=wfe-browser.json, and omitted accept with independent wfe-browser.json remain supported. A procedure is never a shell command.
- type text/value and row rowText/row/text + selector/target aliases are normalized. Scoped assertions inspect the intended row/selector. Selector-only assertAbsent observes actual visibility. Known nested payloads normalize losslessly; unknown operations and incomplete semantic payloads reject.
- CONTRACT, ACCEPTANCE PROCEDURE and WFE RUNTIME boundary failures do not consume product repair attempts. OPEN is unavailable while the Project is active or its latest attempt is not DONE.

## Completed gates

| Gate | Evidence |
| --- | --- |
| Goal 1 retry DONE | `run-1791276018747`, finished `2026-10-06T08:40:27.966Z`; copied retry of `run-1791275557802`; independent browser acceptance and verifier PASS |
| Goal 1 behavior | Real browser add/title, incomplete -> complete -> incomplete observations, delete disappearance, reload, backend restart; canonical browser procedure contains fresh navigation after restart |
| FIRST OPEN | Actual operator OPEN; product at 61501, exact spawned PID owned listener, Household Tasks observable, operator 4317 simultaneously responsive |
| Goal 1 durable marker | `9fc47ade-bda3-4157-9eb3-99094d3ca620`, title `PRODUCT-LOOP-001 persistence 1791276196627`, completed=true; disk snapshot captured before Goal 2 |
| Goal 2 DONE | `run-1791276806168`, finished `2026-10-06T08:55:42.681Z`; normal same-Project Goal -> Generate Plan -> review -> one START, existing workspace evolved in place |
| Goal 2 independent behavior | Low/Medium/High available; each changed priority observed in the intended row and selected control; changed High persists after reload and fresh backend restart; add/title/complete/incomplete/delete and new Low task persistence PASS |
| Data preservation | All pre-Goal2 records retain id/title/completed/createdAt. Original marker remains completed and acquires High priority through actual UI actions. Creation can omit a choice and defaults to Medium |
| SECOND OPEN | Actual WFE OPEN shows evolved accepted product on 61501; exact intended process ownership and operator availability PASS |
| WFE restart | Final operator restart before/after state SHA256 identical: `140074A1FDABB5D965E86BB5A92DD038BDA00F15D55401E4087C1A82E4FB5675` |
| Durable recovery | Same Project, three historical BLOCKED attempts, accepted Goal 1 and accepted Goal 2 all present; UI Goal history shows 5 runs / 2 accepted; canonical state matches live state |
| OPEN after restart | Current Goal 2 product opened through operator UI on 61501, PID 341636, exact ownership and readiness PASS; fresh renderer observes original marker completed/High and new Goal 2 marker Low |
| Loaded code | Final operator reports loadedCode `59e463772c3d447e0614277c989a9f3b500a1e765b91fe9ccd9b05ffad9f71bb`, equal to current disk code fingerprint |
| Tests | Final npm test: 13/13 PASS; UI script syntax and git diff --check PASS |
| Human interventions | Pavel after START: Goal 1=0, Goal 2=0. Execution-agent technical repairs/retries are recorded separately; no Pavel terminal/browser assistance |
| Cleanup | Current product stopped through WFE owner API; all proven obsolete WFE acceptance servers/monitors/harnesses stopped. Only intentional operator PID19216 remains on 4317; no product listener at 61501, no acceptance harness |

## False-test handling

Provider claims and synthetic DOM checks were not acceptance authority. Real browser observations were required. A regression proves that completion text in another row cannot satisfy the requested row. Unknown/malformed procedure checks do not trigger product repair. Occupied/wrong-owner endpoint tests fail closed. A live fixture also rejects undeclared internal runtime binding leakage.

One original disposable custom restart check could select an older tab with the same URL. It is not standalone restart authority. The canonical Goal 1 browser procedure did stop/start/reload, the marker was independently captured on disk before Goal 2, and corrected Goal 2/final checks require a newly created popup or a fresh renderer/reload. Those fresh checks prove original marker identity, completion, priority and backend persistence. No canonical Run evidence was rewritten.

Final cleanup identified obsolete provider background servers by exact cwd, terminal BLOCKED Run, parent command and listener ownership: PID21396/5173, PID22368/5917 and PID25476/3100. Their disposable shell harnesses and read-only monitors were cleaned up without changing Project records or product data. Unrelated repositories and user processes were untouched.

No queue, scheduler, service, process-manager platform, remote worker, new database, authority store, or parallel agent was introduced. The normal WFE Project -> Goal -> Plan -> START -> progress -> DONE -> OPEN -> next Goal flow was exercised without ChatGPT/Codex Cloud as the operating interface.

PRODUCT-LOOP-001 — ACCEPTED
