---
date: 2026-04-17
status: stub
topic: content-release-terminology-rename
supersedes: none
related_brainstorms:
  - docs/brainstorms/2026-04-17-dtpr-icon-composition-brainstorm.md
---

# Content Release Terminology Rename (stub)

## Status

**Stub — not ready for implementation.** This plan records the scope of a cross-cutting terminology cleanup that was surfaced during the icon composition brainstorm but deliberately excluded from that scope. Pick this up when the team has bandwidth for a purely mechanical rename PR that doesn't conflict with active feature work.

## Problem Frame

The existing API conflates two concepts under the word "schema":

1. **Structural schema** — the Zod/TS type shape in `api/src/schema/` (what fields an element has, what fields a category has).
2. **Content release** — a concrete immutable-when-stable snapshot of content (titles, descriptions, translations, etc.) conforming to a structural schema. Today these look like `ai@2026-04-16-beta`.

The current codebase names the content-release manifest `SchemaManifestSchema`, uses `app/content/dtpr.v1/` with a suffix that conflates the two, and exposes a prefix-confused URL story. The icon composition brainstorm established the preferred terminology but left the rename out of scope because it touches 15+ files across `api/`, `app/`, and `studio/` packages — a distraction from the icon feature scope.

## Scope (when picked up)

**Must do:**

1. Rename `SchemaManifestSchema` → `ContentReleaseManifestSchema` (or `ReleaseManifestSchema` — decide during planning).
   - Files touched (at least): `api/src/schema/manifest.ts`, `api/src/schema/emit-json-schema.ts`, `api/cli/lib/yaml-reader.ts`, `api/src/rest/responses.ts`, `api/src/store/r2-loader.ts`, `api/src/store/inline-bundles.ts`, `api/src/store/index.ts`, `api/src/validator/types.ts`, `api/test/unit/schema.test.ts`.
2. Rename related symbols: `VersionStringSchema` → `ContentReleaseVersionSchema`; any `schemaVersion` variables/params that refer to a content release → `releaseVersion`.
3. Decide fate of `app/content/dtpr.v1/`:
   - **Option A**: Rename to `app/content/dtpr/` (drop the `.v1` suffix entirely, since that directory is legacy content that was migrated into `api/schemas/ai/2026-04-16-beta/`). Confirms single-source-of-truth in `api/`.
   - **Option B**: Delete `app/content/dtpr.v1/` once all consumers (`app/content.config.ts`, `app/nuxt.config.ts`, `studio/cli/commands/*.ts`, `studio/server/utils/paths.ts` and `git.ts`) are migrated to read from the `api` bundle or its source YAML.
4. Update comments, docstrings, and markdown docs that use "schema version" when they mean "content release version."
5. Update the MCP tool descriptors and OpenAPI docs if they surface the conflated naming.

**Out of scope for this stub:**

- URL path renames. The current `/api/v2/schemas/:version/…` URL surface is partner-facing and stable; renaming to `/api/v2/releases/:version/…` would be a breaking change to external consumers. If a rename happens, it's a separate planned migration with deprecation window, not bundled into this cleanup.
- Schema version field additions (`structural_schema_hash` etc.) — that's a different decision.

## Preconditions to Execute

- No active feature work overlapping the same files (best done during a quiet window).
- Agreement on the final name: `ContentReleaseManifestSchema` vs `ReleaseManifestSchema` vs another candidate.
- Agreement on Option A vs Option B for `app/content/dtpr.v1/`.

## Risks / Notes

- This is a mechanical rename. TypeScript's compiler will catch most of the surface automatically; the risk is only in string-literal references (e.g. comments, error messages, docs) and in any reflection-style code that keys on the type name.
- The rename should land as a single PR. Splitting it creates a period where both names coexist, which is noisier than it's worth for a cleanup.

## Next Steps

Promote from stub to a full plan via `/ce:plan` when ready to execute.
