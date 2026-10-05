# Intentionally small kernel

The kernel has eight product concepts: Project, Goal, Plan, Run, Step, Workspace, Artifact and Verifier. `Kernel` is the single runtime state owner and persists one JSON snapshot. There is no queue, ledger, control plane, approval topology or distributed scheduler.

A `Provider` receives requested work plus structured context and returns structured files/repairs. Provider transcripts are not canonical state. `DeterministicPongProvider` makes acceptance executable without cloud credentials and is replaceable through the same narrow interface.

Each Run owns a disposable workspace. Checks are code-owned and bounded. The browser UI is a projection over the kernel and invokes narrow actions (`plan`, `start`); it owns no runtime state.

## Growth rule

Add a persistent concept only when a product acceptance target requires it. Future real-model adapters, IDE access, preview, history, configuration and deployment attach here rather than creating another authority.
