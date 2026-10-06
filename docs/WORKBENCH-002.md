# WORKBENCH-002 — PROJECT NAVIGATION & SEARCH

Verified on PavelVictus, 2026-10-06. Implementation and acceptance performed locally, without delegated agents, new Project, START, orchestration or accepted workspace writes.

## RECOVERED BASELINE

HEAD, origin/main and live GitHub main: `5ee2042e5f2c3cf13bdc236ed7fe9fc0ccee9c04`. Initial checkout clean. Operator PID72524, root F:\WFE-Next, Windows process command and 4317 listener ownership verified. Initial loadedCode `90dfc227087b8c49f74613a6da206aa9c27139b24835e62ffe728b80a46f91dd` matched WORKBENCH-001 evidence. Existing WORKBENCH-001 surfaces and PRODUCT-LOOP history were inspected and subsequently exercised. Household Tasks Final (`household-tasks-final-muwdvsnz`) retains five Runs, two accepted and three BLOCKED attempts. Current accepted Run is `run-1791276806168`; its shared evolved workspace is `.wfe-next/workspaces/run-1791276018747`.

## EXISTING FILES IMPLEMENTATION

Inventory before mutation:

| Classification | Capability | Existing authority |
| --- | --- | --- |
| A reusable | Accepted-root derivation, path checks, directory listing, inert preview | src/workspace-files.js, GET /api/files/:project |
| A reusable | Run.workspace, exact artifacts array, Project/Run history | existing Kernel state and /api/state |
| A reusable | Scratch copy, edit, download and per-tab sessionStorage | WORKBENCH-001 ui/index.html |
| B incomplete | Flat folder navigation, selection persistence, file context | Existing Files / Artifacts surface |
| B incomplete | Text detection and capped preview | Existing 256 KB limit; no supported-extension contract |
| C missing | Expand/collapse tree, Project filename/path/content search, snippets, stale-query suppression | No existing search utility in WFE-Next |

## NAVIGATION

PASS. Files / Artifacts now contains an Accepted Workspace root, lazy folder expansion/collapse, selected-file styling, relative paths and a read-only preview. Back to tree retains the selected result and expands its ancestor folders. Switching Workbench surfaces preserves the current file. The original five surfaces and responsive layout remain.

## SEARCH

PASS. Case-insensitive literal filename/path and safe-text content search, within the selected Project's current accepted workspace. Each result displays filename, relative path, match type and, for a text result, a bounded contextual snippet and line number. Clicking opens the real file preview. No persistent index exists. The first text occurrence per file is returned; filename and text matches can appear as separate results.

Real Edge/Puppeteer before and after final restart: filename `index.html`, path `public/`, text `Household Tasks`, multiple `priority` matches, zero results, result opening, matching preview, contextual snippet, query replacement and return to tree all PASS. Each final navigation acceptance has 33 checks. These use actual accepted Household Tasks files.

## SEARCH BOUNDS

1,000 files; 3,000 directory entries processed; 100 results; 256 KiB per preview/search file; 8 MiB read budget; 250 ms elapsed budget; depth 24; query 1-200 characters. Directory listing is capped at 500 entries and reports truncation. Limits are returned by the API; partial search explicitly advises narrowing the query. Search excludes hidden entries, node_modules, links and non-regular files.

## PREVIEW

PASS. UTF-8 txt, md, json, js, ts, html, css, java, py, yaml/yml and xml, plus existing common text variants. Oversized, binary, unsupported extension and invalid UTF-8 have explicit states. Reads use a capped descriptor buffer even if a file grows after stat. Source is displayed with textContent, never executed/rendered as HTML. Actual public/index.html preview is byte-identical to source.

## PROJECT CONTEXT

PASS. Root identity, accepted Run ID, shared evolved workspace, relative path, byte size and file type are visible. Only exact entries in Run.artifacts receive the recorded-artifact label; no ancestry heuristic invents artifact linkage. No client-supplied workspace root or filesystem browser was introduced.

## SCRATCH INTEGRATION

PASS. Preview -> Scratch -> edit -> reload retains local experiment semantics. Accepted source byte-for-byte unchanged before/after copy/edit and at end of acceptance. Scratch stays non-authoritative and never writes to the accepted workspace. Same browser tab survives operator restart/reload; an independent new tab starts empty. No UI durable authority was added.

## FILESYSTEM SAFETY

PASS. Shared accepted-root/path validator is used by tree, preview and search. Invalid and inherited-object Project identifiers, traversal, absolute Windows paths, backslashes, encoded traversal, hidden/excluded paths, Windows alternate data streams, symlink/junction escapes and out-of-authority workspace records reject. Boundaries are tested automatically; traversal and invalid authority are additionally checked through the live HTTP API. Oversized/binary/unsupported cases and Windows junctions use disposable unit-test roots, never fake acceptance Projects. No arbitrary filesystem read endpoint exists.

## PERFORMANCE

PASS. Accepted Household Tasks has eight visited files and six `priority` results. Twenty HTTP searches measured min 6.8 ms, average 15.0 ms, max 45.7 ms, with no truncation. This is local small-workspace evidence, not a large-workspace throughput claim. Search yields to the event loop every 20 files. UI debounces 180 ms, aborts superseded fetches and guards query/Project generations; it clears stale results immediately. Backend searches remain independently bounded when a client aborts.

## RESTART PROOF

PASS. Final owned idle operator PID367188 -> PID368172. No active Run or opened product during restart. State file SHA-256 before and after: `8d1074ff59bb86713b7209b04143c634133cee5a8006edd31ed9a055a230d81a`. Loaded fingerprint equals disk: `de7524e0be39bf8ec51ac98db464a3a82b61725ffafea7283e80742496baaf80`. Fresh Edge acceptance after this restart reconfirmed Projects, five/two history, tree, search, accepted OPEN and persisted product markers. Same-tab and independent-tab Scratch semantics passed separately.

## WORKBENCH-001 REGRESSION

PASS. Original scripts/workbench-acceptance.cjs: 36 before-restart checks (including actual Generate Plan and changed-Goal START invalidation), 34 after-restart checks. Project selection, Overview/current accepted identity, Goals/Run grouping, all three BLOCKED attempts, source preview, Scratch, Technical details, OPEN/Stop and 820 px no-horizontal-overflow check remain PASS. No START invoked.

## PRODUCT-LOOP REGRESSION

PASS. Existing kernel lifecycle/continuation/retry tests and real accepted product OPEN, owned listener/readiness, product reload, original completed/High task marker and evolved Low task marker. Historical Projects/Runs compare unchanged to WORKBENCH-001 baseline except the existing expected OPEN evidence updates. Generation/evolution was not repeated.

## HUMAN INTERVENTIONS

Pavel interventions: zero. Routine lane repairs: a PowerShell UI splice anchor, whitespace cleanup, and a disposable restart harness pipe that stayed open after background operator launch. The exact owned harness/Edge was stopped and the harness rerun with detached standard handles. The final clean restart/browser runs are the acceptance authority.

## CLEANUP

PASS. Browser harnesses closed; no WFE acceptance harness remains. Product stopped through existing owner API. No 61501 listener; active=[] and opened={}. Only the intentional WFE operator owns 4317. Accepted files, product data, BLOCKED history and unrelated repositories preserved. Ignored local evidence under `.wfe-next/workbench-002/` includes baseline-state.json, before-restart.json, after-restart.json, restart.json, regression-before.json, regression-after.json, performance.json, cleanup.json and screenshots.

## TESTS

PASS. npm test: 13/13 kernel tests plus workspace-files, new workspace-search and plan-output suites. New tests cover all required text extensions, filename/path/content and zero-result search, bounded result count, unsupported/oversized/binary states, invalid authority, traversal/absolute/encoded/ADS paths and Windows junction exclusion. Node/server/UI syntax and git diff --check PASS. Real Edge checks as above; no browser script errors. Navigation harness reproducible: `node scripts/workbench-navigation-acceptance.cjs before-restart|after-restart`; requires installed Edge/Puppeteer and existing accepted Project, and never STARTs a Run.

## COMMIT

The coherent commit containing this report is created and pushed to existing main only after all listed acceptance, restart, regression, cleanup and test gates PASS. Final SHA and remote identity are reported by the implementation lane.

## NEXT SMALLEST STEP

Add match highlighting and jump-to-line in the existing read-only preview, using returned match context and the same accepted-root boundary.

## PAVEL-SPOKO RESULT

Technical navigation/search acceptance PASS: real accepted project content can be found, opened and located in its workspace, without Pavel intervention. Personal satisfaction remains Pavel's own judgment after use.

WORKBENCH-002 — ACCEPTED
