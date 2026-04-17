# @dtpr/api

Standalone DTPR API (REST + MCP) served from Cloudflare Workers at `api.dtpr.io`.

This workspace is fully self-contained — it does not import from `../app`, `../docs-site`, or `../studio`. The Nuxt-hosted `dtpr.io/api/dtpr/v0|v1` endpoints continue running independently.

## Quickstart

```bash
# Install (from repo root)
pnpm install

# Run locally (Miniflare)
pnpm --filter ./api dev

# Typecheck
pnpm --filter ./api typecheck

# Run tests (vitest-pool-workers — runs inside workerd isolates)
pnpm --filter ./api test

# Build schema bundles from YAML source
pnpm --filter ./api schema:build ai@2026-04-16-beta

# Validate a schema version without emitting
pnpm --filter ./api schema:validate ai@2026-04-16-beta

# Deploy to production (api.dtpr.io)
pnpm --filter ./api deploy
```

## Layout

```
api/
  src/            # Worker source (Hono app, middleware, schema, validator, REST, MCP)
  cli/            # schema:build|validate|new|promote commands
  schemas/        # Versioned YAML content (ai/<YYYY-MM-DD>[-beta]/...)
  migrations/     # One-shot migration scripts
  test/           # Vitest + vitest-pool-workers suite
```

## Cloudflare prerequisites

The Helpful Places Cloudflare account already has:

- Workers `dtpr-api` (production, `api.dtpr.io`) and `dtpr-api-preview` (preview, `api-preview.dtpr.io`) — first deploy was 2026-04-17
- R2 buckets `dtpr-api` (production) and `dtpr-api-preview` (preview)
- Custom domain routes for both hostnames

Before CI can deploy, set the following GitHub Actions secrets on `Helpful-Places/dtpr` (see `docs/deploy-tokens.md` for exact scopes):

- `CLOUDFLARE_ACCOUNT_ID` — `f978769622a3e15ad770688a80811aa8`
- `CLOUDFLARE_API_TOKEN_PROD` — Workers Scripts: Edit (scoped to `dtpr-api`) + Workers R2 Storage: Edit (scoped to `dtpr-api`)
- `CLOUDFLARE_API_TOKEN_PREVIEW` — same scopes against `dtpr-api-preview`
- `R2_ACCESS_KEY_ID_PROD` / `R2_SECRET_ACCESS_KEY_PROD` — R2 S3 keys, Object Read & Write scoped to `dtpr-api`
- `R2_ACCESS_KEY_ID_PREVIEW` / `R2_SECRET_ACCESS_KEY_PREVIEW` — same against `dtpr-api-preview`


## Infrastructure spike — pending verification

The plan flagged these capabilities as needing verification against a real Cloudflare account before Units 7/9/10/11 can commit downstream patterns. None of these can be validated from the local workspace alone; they require a preview custom domain (Cache API does not work on `*.workers.dev`).

- [x] `wrangler.jsonc` parses and deploys with `compatibility_flags: ["nodejs_compat"]` (verified 2026-04-17; `limits.cpu_ms` blocked on paid plan)
- [ ] Workers Rate Limiting API binding syntax in wrangler 4.x (`[[ratelimit]]` vs `[[unsafe.bindings]]`) — confirm current form, update `wrangler.jsonc` before Unit 11
- [ ] `caches.default.put` / `match` returns `cf-cache-status: HIT` on second request against `api-preview.dtpr.io`
- [ ] R2 binding serves `get()` / `head()` calls from Worker code
- [ ] `@hono/mcp` + `@modelcontextprotocol/sdk@^1.29` initialize/tools-list handshake works over `app.all('/mcp', ...)` without Durable Objects
- [ ] Bundle size of a minimal hello-world + MCP SDK deps stays under 1 MB gzipped

If any fails, halt and decide: adjust approach, escalate to `docs/mcp-fallback.md`, or update the plan.

## References

- Plan: `../docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md`
- Brainstorm: `../docs/brainstorms/2026-04-16-dtpr-schema-api-mcp-brainstorm.md`
