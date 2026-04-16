# dtpr.v1 content tree — AI portion frozen as of 2026-04-16

This directory contains the v1 DTPR content (categories, elements, datachain types) served by the Nuxt-hosted `dtpr.io/api/dtpr/v1/...` endpoints.

**As of 2026-04-16, the AI (`ai__*` categories and AI-touching elements) portion of this tree is frozen.** Canonical AI content now lives in [`api/schemas/ai/`](../../../api/schemas/ai/) as YAML-per-entity with embedded locales, served from the standalone API at `api.dtpr.io`.

## What this means in practice

- **Do not edit AI content here.** Edits made to `categories/*/ai__*.md` or to AI-touching elements will not propagate to the canonical tree under `api/schemas/ai/`. The `dtpr.io/api/dtpr/v1` surface continues to serve this tree unchanged; drift between the two surfaces is accepted (per plan R27).
- **Device content continues here.** `device__*` categories and device-only elements are unaffected by the AI migration. Edit them as before.
- **Shared elements** (those that belonged to both `device__*` and `ai__*` categories) have an authoritative AI copy under `api/schemas/ai/2026-04-16-beta/elements/`. The device portion continues to be served from this tree.

## Why

The AI datachain iterates quickly, and its new home (`api/schemas/ai/…`) gives it:

- **Versioned snapshots** — each structural revision is a new dated directory (`ai/YYYY-MM-DD[-beta]/`)
- **YAML-per-entity with embedded locales** — one file per element/category instead of 894 locale-specific markdown files
- **A validated build pipeline** — `pnpm --filter @dtpr/api schema:build ai@<version>` catches structural and semantic errors before deploy
- **First-class MCP support** — AI agents can introspect + construct datachains against `api.dtpr.io/mcp`

See [`docs/brainstorms/2026-04-16-dtpr-schema-api-mcp-brainstorm.md`](../../../docs/brainstorms/2026-04-16-dtpr-schema-api-mcp-brainstorm.md) and [`docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md`](../../../docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md) for the full rationale.
