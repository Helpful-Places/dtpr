# MCP transport: hand-rolled JSON-RPC fallback

## Why this exists

The plan ([Unit 10](../../docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md))
intended to mount the MCP read-side tools through `@hono/mcp` +
`@modelcontextprotocol/sdk@^1.29`. During implementation we hit a hard
incompatibility between that SDK chain and the workerd runtime that
`@cloudflare/vitest-pool-workers` uses for tests:

> `SyntaxError: Unexpected token ':'`
> `at .../ajv@8.18.0/dist/core.js?mf_vitest_no_cjs_esm_shim`

The MCP SDK pulls in **Ajv 8** transitively (for JSON Schema validation
inside the server transport). Ajv 8 is CommonJS-only and
`require()`-loads its own `data.json` meta-schema; vitest-pool-workers'
module loader explicitly skips the CJS-to-ESM shim for that path
(`?mf_vitest_no_cjs_esm_shim`), and the file ends up parsed as JS,
failing on the JSON's first `:` character. Enabling
`nodejs_compat_v2 + nodejs_als` did not change the outcome (the shim
opt-out fires earlier).

The plan's risk table already anticipated this:

> **MCP SDK Workers compatibility (flagged unverified in brainstorm)**
> Research confirmed `@hono/mcp` + `@modelcontextprotocol/sdk@^1` +
> `nodejs_compat` flag is the supported path; spike validated during
> Unit 1 workspace scaffolding. **If the SDK path breaks, fallback is
> a hand-rolled JSON-RPC handler over `fetch` — documented in
> `api/docs/mcp-fallback.md` but not built unless needed.**

The Unit 1 spike was deferred to a real Cloudflare account; we hit the
incompatibility in test-runtime before we had a chance to validate
against production workerd. Rather than wait, we shipped the
documented fallback.

## What we built instead

`api/src/mcp/server.ts` is a ~150-line JSON-RPC dispatcher implementing
exactly the methods the DTPR read surface needs:

- `initialize` — protocol handshake, returns `serverInfo` + capabilities.
- `notifications/initialized` (and the unprefixed alias) — accepted,
  no response per JSON-RPC notification semantics.
- `tools/list` — returns the 7 tool descriptors.
- `tools/call` — dispatches to the registered tool handler.
- `ping` — replies with `{}`.

Single requests and JSON-RPC batches are both supported. The wire
content type is `application/json` — no SSE / streamable-HTTP, no
session ids, no Durable Objects. Stateless reads were the assumption
all along; this just makes that assumption explicit in the transport.

`api/src/mcp/tools.ts` keeps the same tool catalogue + handler
implementations as the SDK-based draft. The only structural change is
that `inputSchema` is emitted via `z.toJSONSchema(schema, { target:
'draft-2020-12', io: 'input', unrepresentable: 'any' })` at registry
build time and stored alongside the descriptor.

## Removed dependencies

- `@hono/mcp@^0.2.5`
- `@modelcontextprotocol/sdk@^1.29.0`

(They remain available for the demo client in Unit 15, where they run
under Node and don't hit the workerd issue.)

## Trade-offs vs the SDK path

- ✅ No transitive Ajv → no workerd CJS issue → tests run cleanly.
- ✅ Smaller bundle (the SDK + Ajv are heavy).
- ✅ Stateless and fully visible: every request is one POST, one
  response.
- ❌ No automatic compliance with future MCP spec features
  (resources, prompts, sampling). When/if we add any of those, we
  re-evaluate adopting the SDK or extending the fallback.
- ❌ No streamable-HTTP or SSE. The current MCP read surface doesn't
  need it; if we later add long-running validate or per-session OAuth
  we'll revisit.

## Reverting to the SDK

If a future workerd / vitest-pool-workers release fixes the Ajv issue,
or if we move tests to a different harness, reverting is mechanical:

1. Re-add `@hono/mcp` and `@modelcontextprotocol/sdk` to dependencies.
2. Replace `api/src/mcp/server.ts` with the SDK-based handler (kept in
   the git history of this commit).
3. Replace `api/src/mcp/tools.ts` with the `McpServer.registerTool(...)`
   form (also in git history).
4. Run the existing `api/test/api/mcp.test.ts` suite — the JSON-RPC
   client it uses talks to the wire format, so no test changes needed.
