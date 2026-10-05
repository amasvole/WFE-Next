# REAL-GENERATION-001

Production uses a real model-backed provider. DeterministicPongProvider remains a regression fixture only.

Accepted run: `run-1791237290779`

Goal: create an immediately playable browser Pong-style game with a model-chosen original twist, excluding gravity/curved-trajectory mechanics for novelty.

Observed path:

`START -> BUILDING -> CHECKING(FAIL) -> REPAIRING -> CHECKING(PASS) -> VERIFYING(PASS) -> DONE -> PLAY`

The model chose **Rally Shrink**: each paddle hit shrinks that paddle for the remainder of the rally; paddles reset for the next point.

The first candidate failed because the declared twist explanation was not visibly present verbatim in the operator-facing HTML. WFE fed that concrete deterministic failure to the model-backed repair operation. The model edited the artifact; the second check passed. No human interaction occurred after START.

The provider transcript/session is not runtime authority and is not persisted. Canonical state stores the goal, plan, semantic steps, decisions, product record, check results, verifier result, artifacts and outcome.
