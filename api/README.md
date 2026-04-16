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

Before the first deploy, the following must be provisioned in the Helpful Places Cloudflare account (one-time, manual):

- R2 buckets `dtpr-content-prod` and `dtpr-content-preview`
- Custom domain routes for `api.dtpr.io` and `api-preview.dtpr.io`
- API tokens `CLOUDFLARE_API_TOKEN_PROD` and `CLOUDFLARE_API_TOKEN_PREVIEW` with deploy + R2-write scope (stored as GitHub Actions secrets)
- R2 S3-compatible access keys for `api/scripts/r2-upload.ts` (see `docs/deploy-tokens.md` when added)

## Infrastructure spike — pending verification

The plan flagged these capabilities as needing verification against a real Cloudflare account before Units 7/9/10/11 can commit downstream patterns. None of these can be validated from the local workspace alone; they require a preview custom domain (Cache API does not work on `*.workers.dev`).

- [ ] `wrangler.jsonc` parses and deploys with `compatibility_flags: ["nodejs_compat"]` + `limits.cpu_ms: 500`
- [ ] Workers Rate Limiting API binding syntax in wrangler 4.x (`[[ratelimit]]` vs `[[unsafe.bindings]]`) — confirm current form, update `wrangler.jsonc` before Unit 11
- [ ] `caches.default.put` / `match` returns `cf-cache-status: HIT` on second request against `api-preview.dtpr.io`
- [ ] R2 binding serves `get()` / `head()` calls from Worker code
- [ ] `@hono/mcp` + `@modelcontextprotocol/sdk@^1.29` initialize/tools-list handshake works over `app.all('/mcp', ...)` without Durable Objects
- [ ] Bundle size of a minimal hello-world + MCP SDK deps stays under 1 MB gzipped

If any fails, halt and decide: adjust approach, escalate to `docs/mcp-fallback.md`, or update the plan.

## References

- Plan: `../docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md`
- Brainstorm: `../docs/brainstorms/2026-04-16-dtpr-schema-api-mcp-brainstorm.md`
