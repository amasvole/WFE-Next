# WFE-Next

Product-first autonomous software creation kernel. First target: **PONG-OVERNIGHT-001** — natural-language Goal → Plan → one START → autonomous build/test/repair/verify → PLAY.

## Run

    npm test
    npm run accept:pong
    npm run accept:real   # requires authenticated Claude Code on PATH
    npm start

Open http://localhost:4317. No runtime dependencies are required. Runtime state is `.wfe-next/state.json`; each run gets a disposable workspace.

Production generation uses a bounded model CLI provider; `DeterministicPongProvider` is test-only. Set `WFE_MODEL_COMMAND` to override the `claude` executable.

See `docs/ARCHITECTURE.md`, `docs/PONG-OVERNIGHT-001.md`, and `docs/REAL-GENERATION-001.md`.

The local operator supports Project -> Goal -> Generate Plan -> review -> START -> live progress -> DONE -> OPEN, followed by another Goal in the same Project. See [PRODUCT-LOOP-001](docs/PRODUCT-LOOP-001.md) for recovery, runtime ownership, data preservation, restart and independent acceptance evidence. Provider execution requires the installed Claude CLI tools/restricted/safe-mode capabilities; browser endpoint ownership is verified on Windows.
