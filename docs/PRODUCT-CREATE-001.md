# PRODUCT-CREATE-001 — authoritative empty product creation

## Scope and audit

This implements only `product.create`: creation of one empty canonical Project.
It does not generate application code, create a workspace, plan, start, accept,
open, or launch a process. Existing unsafe HTTP mutations are not exposed by MCP.
The original uncommitted product-control work was preserved in this candidate.
The thin plugin bytes remain unchanged. There is no generic shell capability.

Audit of this repository's src, tests, integrations and architecture found no
canonical policy/WFEKey/receipt mechanism to reuse. Kernel is the existing single
state owner. ProductMutation is its narrow fixed-action control dispatcher, not
another state owner, service, or user-selected policy framework.

## Authority and policy

`wfe_product_create` -> POST `/api/control/product-create` -> `Kernel.createProduct`
-> ProductMutation -> atomic canonical `.wfe-next/state.json` replacement.

The kernel normalizes a strict request: requestId, projectId, name, exact baseSha,
optional protection and approvalId. It records the normalized request and SHA256
digest. Policy `wfe.product.create.v1` permits only a new empty ACTIVE USER_PROJECT.
NORMAL is low risk: no execution, credentials, filesystem access, existing target
mutation or privilege acquisition; WFEKey is not required. The existing protected
classification WARN_BEFORE_MUTATION requires authenticated WFEKey authority.
Existing target IDs are rejected; protection cannot be downgraded on an existing
Project through create. No client confirmation boolean grants authority.

The trusted approval verification port must return an authenticated WFEKey
attestation bound to approvalId, request digest, action, target, SHA and expiration.
The default production kernel has no bridge configured and rejects such requests
with APPROVAL_AUTHORITY_UNAVAILABLE (or APPROVAL_REQUIRED when missing).
No approval minting tool, secret, key or test bypass is installed in production.
Valid approval consumption is proven with an explicitly test-only trusted bridge;
this is contract evidence, not proof of live WFEKey integration.

The kernel binds the request to live clean Git HEAD and clean loaded startup HEAD.
Both are rechecked before committing. Changing HEAD requires a kernel restart.
Source changes, dirty/untracked source, a stale base SHA or unavailable identity
cannot create a Project. The live demo requires a clean committed candidate.

## Persistence and replay

One fsynced temp file and atomic rename stores the product, terminal receipt and
approval consumption together. Kernel.save uses the same atomic writer so later
legacy state saves cannot truncate these records. Existing Project object
references are retained, preserving asynchronous Plan/Run owners.

Receipts are stored at `state.productControl.receipts[requestId]`; successful
Projects link `creationReceiptId`. Receipts contain canonical request/digest,
action/target, requested/observed SHA, policy decision, consumed approval identity,
terminal PASS/REJECTED code and timestamp. Failures of authority persist REJECTED
receipts with no product or approval consumption. Invalid requests, conflicting
request IDs, busy locks, corrupt/stale-owner snapshots and commit-point source
drift fail without executing the mutation.

Identical requestId/digest returns the identical terminal receipt with
deduplicated=true, even after restart or a lost acknowledgement. Different
arguments under the same ID are rejected. A new ID cannot recreate an existing
target or reuse a consumed approval. Rejected requests are terminal too; use a new
requestId after correcting authority or source.

Only one canonical state owner is supported. The mutation lock is exclusive and
contains owner PID/request identity. A competing or stale Kernel cannot overwrite
state. A crash after commit permits receipt replay despite a leftover lock. A
leftover lock blocks *new* mutations until the operator verifies its owner is
dead, stops all state writers and removes only that exact stale lock. It is never
automatically stolen. Pre-rename orphan temp files are noncanonical and harmless.
File fsync + atomic rename proves process-restart durability; sudden host power
loss guarantees beyond the filesystem's rename durability are not claimed.

## Validation and reproduction

- `npm run test:product`: deterministic kernel authority, replay, SHA/dirty/live
  Git binding, approval scope/expiry/replay, separate-process reload, atomic
  failure, corrupt state, contention and lost acknowledgement checks.
- `npm run test:mcp`: original read-only regression suite plus real Streamable
  HTTP client -> MCP -> fixed HTTP control -> kernel -> durable state. The original
  11-capability regression tests explicitly use the original read registry.
- Full kernel suite still has the five browser-dependent failures recorded in
  DYNAMIC-MCP-001-FREEZE.md; this mutation invokes no browser. Browser repair is
  outside scope. Other Project/Plan/files/search regression checks pass.
- `node integrations/wfe-mcp/scripts/product-demo.mjs <report.json> create`:
  uses the persistent plugin endpoint and canonical operator, creates one Counter
  Project at candidate SHA, retries it, rejects stale SHA and missing protected
  approval, reads status through MCP and compares persisted receipt and existing
  Projects. It does not call legacy POST routes or create a Run.
- Restart the idle canonical operator at the same clean candidate; invoke the
  same script with `<report.json> restart`. It requires a changed PID, identical
  receipt, deduplication and exactly one persisted product.
- `npm run mcp:smoke`: read-only verification of current discovery and state;
  supported writes are deliberately not invoked by the smoke test.

Live evidence belongs in ignored runtime storage / the task output, not committed
source. Candidate SHA is recorded there, avoiding a self-referential commit hash.
An actual ChatGPT host refresh/invocation is separate from the real MCP transport
proof; plugin packaging and endpoint remain stable.

## Remaining boundary

Product creation alone does not build an application. Other mutations remain
unavailable. Connecting a real WFEKey decision verifier is necessary before
protected creates can succeed in production. For normal empty product creation,
the next product milestone is a separately authorized `work.plan` authority slice.
