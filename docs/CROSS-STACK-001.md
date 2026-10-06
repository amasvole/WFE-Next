# CROSS-STACK-001

Accepted continuation from baseline 663ebe983983badfd6272a317d71a55afa7440f7.

A real model selected a dependency-free Node HTTP backend, browser UI, JSON HTTP API and disk JSON persistence for the 3D-printing jobs Goal. WFE did not encode those choices.

The artifact owns wfe-run.json and proposes wfe-browser.json. WFE does not trust a provider PASS: scripts/browser-executor.js independently executes the bounded declarative UI procedure in an existing local Edge through existing Puppeteer, restricts requests to the artifact origin, records every action/observation, owns backend start/stop/restart, and returns observed PASS/FAIL.

Independent browser acceptance exercised create, rendered field round-trip, status mutation, delete, creation of a persistence marker, backend stop, proof of unavailability, restart from wfe-run.json, readiness, browser reload and rendered persistence.

A first browser procedure produced a false negative because it asserted internal value "in-progress" as visible text while the valid UI renders "In Progress". The product was not repaired; only the acceptance procedure was corrected and rerun.

Final accepted browser lifecycle included old backend PID 363936 -> unavailable -> new PID 362184 -> ready -> reload -> persistence marker visible. No product repair was required. Cleanup left no listener on port 4000.

The verifier now rejects browser-required runs unless independent browser acceptance passes.