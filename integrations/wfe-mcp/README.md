# Stable plugin, dynamic canonical capabilities

Canonical source: WFE-Next. The bootstrap was imported from worktree
F:/WFE-Plugin-Test at 212efc1defcbc44b3b9c3b433d7b8941c87866ae (draft PR #2),
itself based on ef489670f8ff206184095d6ff4f1946247621951. That historical
worktree and its untracked ZIP/lockfile are retained; they are not the active
implementation. No historical projects or old amasvole/WFE runners are migrated.

- src/control-capabilities.js: canonical read catalogue and whitelisted projections.
- integrations/wfe-mcp: MCP transport, bounded GET-only operator client and tests.
- plugins/wfe: original identity and Streamable HTTP connection, byte-for-byte unchanged.
- .wfe-next: ignored runtime/evidence only; ZIPs and node_modules are build output.

## Integration contract wfe.mcp.integration.v1

Streamable HTTP at http://127.0.0.1:4327/mcp, server identity wfe/0.1.0.
Initialize negotiates the MCP protocol through the SDK. Ordinary operations are
discovered by tools/list, including inputSchema, outputSchema, readOnlyHint
and _meta["wfe/capability"]. wfe_capabilities_list provides the same catalogue.
Clients must refresh tools/list when reconnecting. This stateless server does
not promise hot reload or list-changed notifications in an existing session.
Adding a capability changes the server catalogue, not plugin files. Restart
the MCP adapter and rediscover. Release the plugin only for connection/transport,
identity, authentication or integration compatibility changes. A host retaining
a tool cache may need reconnection; reinstalling the plugin is not part of this path.

wfe_status retains wfe.status.v0; other tools use wfe.control.v1:
capability, available, observedAt, data and optional error. Unknown/malformed
arguments are MCP InvalidParams. Unavailable operator, invalid canonical state,
missing identity and unsupported authority are structured errors, never an empty
healthy result. Schemas and ordering are deterministic.

Capability records have name, description, input/output schemas, safetyClass,
access, availability, approval {required, authority, granted:false}, handlerIdentity.
The catalogue is code-owned, not loaded from user state or arbitrary executable
paths. Registry entries are projections of GET /api/state, not new orchestration.

## Authority and availability

Only GET /api/state is available to the adapter. No state files, execution
handlers, shell strings, filesystem tools, process controls or approval receipts
are available to tool handlers. Writes are denied before handler/network access,
even if metadata says approval is required or supplies granted:true. Future
mutations must add an explicitly reviewed canonical WFE/WFEKey receipt flow;
metadata cannot authorize execution. The current catalogue exposes no writes.

READY/zero-Run Projects are preserved. Current Goal/Run, accepted identity and
bounded history remain separate. DONE denotes the kernel's accepted history,
not a new MCP acceptance verdict. User versus historical/fixture classification
comes from recorded metadata. WFE development classification, node registries,
runner authority, incidents and WFEKey decisions do not exist in this kernel.
They are unavailable, not fabricated, and old production broker security is untouched.
Workbench projection reports existing surfaces; Scratch is client-local.
Files/Search retain existing operator boundaries and are not duplicated in MCP.

Listeners remain HTTP loopback only. The adapter rejects non-loopback Host/Origin
and redirects to remote operator endpoints. No wildcard browser CORS, public
port or tunnel changes. Status content excludes raw workspaces, diagnostics,
execution commands and operator root. This unauthenticated local development
endpoint is not a public deployment contract.

## Run / tests / performance

From repository root: npm run mcp:install (locked, install scripts disabled),
npm run test:mcp, npm run mcp:start, npm run mcp:smoke.
Never start a second operator from the historical prototype.

Tests use disposable loopback transports and injected canonical snapshots. They
prove server-only additions are discovered/called with unchanged plugin hashes,
server identity/instructions and existing schemas; deny mutation and approval
bypass; retain v0 status; reject malformed state; and preserve READY zero-Run history.
Live smoke reads the installed-contract endpoint, calls every discovered capability
and checks durable state and operator PID remain unchanged.

Each runtime read performs one bounded GET (2s timeout, 8MiB maximum), with
whitelisted output, 50/100 Run history limits and no cross-request state cache.
The current operator still serializes full /api/state; this tranche does not
restart or rewrite it. A future measured bottleneck should add a canonical
bounded operator projection endpoint, never a second adapter state database.
Source SHA/fingerprint is explicitly a disk snapshot at adapter startup;
loadedCode comparison is not proof of remote SHA equality or a clean checkout.


For integration-contract releases only: scripts/package-plugin.ps1 -OutputPath <new-archive-path>. It packages only the stable plugin folder, refuses overwrite and is not run for ordinary tool additions.
