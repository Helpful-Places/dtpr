---
title: Schema drafting CLI, preview deploys, and DTPR skill plugin
type: feat
status: active
date: 2026-04-17
origin: docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md
---

# Schema drafting CLI, preview deploys, and DTPR skill plugin

## Overview

This plan closes out Phase P3 of the parent DTPR API plan. It keeps Unit 13 (CLI drafting commands) and Unit 14 (preview deployment) from the parent, and **replaces** Unit 15's public "wow-factor demo" with a Claude Code plugin shipping two agent skills that wrap the MCP at `https://api.dtpr.io/mcp`.

The plugin becomes the new north-star acceptance test: when a user can install the plugin and produce a validated datachain (or a concrete schema-change proposal) without writing any code, the read-side API and MCP surface are validated end-to-end.

Phase P1 and P2 (Units 1–12) are shipped on `main`. Cloudflare custom domains `api.dtpr.io` and `api-preview.dtpr.io` are live. GitHub Actions secrets for prod deploys are populated. There is no beta to promote today — `schema:promote` is built for completeness, not run.

## Problem Frame

Three pieces of work are outstanding from the parent plan:

1. **Drafting workflow is stubbed.** `api/cli/bin.ts` has placeholder handlers for `new` and `promote` that return exit code 2 (`api/cli/bin.ts:54–59`). Today, creating a new beta version means hand-copying a directory and hand-editing `meta.yaml`. This is bug-prone (one of the reasons the migration step in Unit 5 had to be characterization-tested).
2. **Preview traffic has no CI path and no no-index guard.** The preview Worker (`dtpr-api-preview` on `api-preview.dtpr.io`) was deployed manually on 2026-04-17 (parent plan, line 440). There is no workflow that rebuilds and uploads beta content to the preview R2 bucket on PR, and nothing stops search engines from indexing in-flight content. A `schema:preview` PR label should gate an automatic preview deploy; the preview env should set `X-Robots-Tag: noindex, nofollow`.
3. **We have no consumer-facing front door for the MCP.** The original Unit 15 proposed a standalone demo script using the Anthropic SDK. The revised north star is a Claude Code plugin shipping two agent skills that wrap the MCP — one for *describing an AI system as a datachain* (canonical consumer use) and one for *brainstorming DTPR itself* (meta-use, which Jonathan will use to iterate on the schema). This turns "can an agent use our MCP?" into a question a user answers themselves by running a skill, rather than a one-off scripted demo.

Success looks like: a user clones/installs the plugin, asks Claude "describe this facial-recognition system as a DTPR datachain," and Claude drives the MCP tools through `validate_datachain: ok:true` without prompting the user for anything a tool description couldn't already convey.

## Requirements Trace

Reorganized from parent plan (`docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md`) — parent unit numbers in parentheses; this plan's units are numbered 1–5:

- **R21** — `schema:new` CLI (parent Unit 13) → **Unit 1**
- **R23a** — `schema:promote` CLI command (parent Unit 13) → **Unit 1**. Satisfied by building + testing the command; execution against the current beta is deferred.
- **R23b** — GitHub branch protection on `main` as the merge gate for promotion PRs (parent Unit 13 prereq) → **not in scope of this plan**; documented as a one-time manual prerequisite before the first real promotion.
- **R24** — preview deployments at `api-preview.dtpr.io` (parent Unit 14) → **Unit 2**

Superseding:

- **R-Unit15 (new)** — Claude Code plugin `dtpr` with two skills (`dtpr-describe-system`, `dtpr-schema-brainstorm`) wrapping the remote MCP at `api.dtpr.io/mcp`. Replaces the original Unit 15 wow-factor demo script. → **Units 3–5**

## Scope Boundaries

- Not touching the existing REST v2 / MCP server code (`api/src/rest/`, `api/src/mcp/`). Those are parent-plan-complete.
- Not promoting `ai@2026-04-16-beta` to stable. Nothing to promote yet. `schema:promote` is built and tested; running it is a separate decision gated on the brainstorming skill driving real changes.
- Not building a public wow-factor demo script or recording. The plugin *is* the demo.
- Not re-opening the MCP fallback decision (still hand-rolled JSON-RPC per `api/docs/mcp-fallback.md`).

### Deferred to Separate Tasks

- **Promoting `ai@2026-04-16-beta` to stable** — separate PR, runs `schema:promote` once the brainstorming skill is used to drive any needed taxonomy edits. No architectural work needed, just the CLI invocation + human review.
- **Publishing the plugin to a public marketplace registry** — the plan adds a `marketplace.json` to this repo so `/plugin marketplace add helpful-places/dtpr` works off the GitHub URL. A dedicated standalone plugin repo, if desired, is a later split.
- **Skill eval-loop optimization via `skill-creator`'s `run_loop.py`** — the plan commits baseline eval prompts and documents the harness; full eval-loop tuning (description optimizer, should-trigger/should-not-trigger sets) is follow-up work once the skills have seen real use.

## Context & Research

### Relevant Code and Patterns

**CLI (for Unit 1):**
- `api/cli/bin.ts` — dispatcher. `commands` map at line 32; `parseCommonFlags` at line 14. `new` / `promote` stubs at lines 53–59.
- `api/cli/commands/build.ts` — the template for a command's structure: imports fs/path/yaml helpers, resolves source/output roots via `parseCommonFlags`, calls library helpers, returns a `BuildResult { ok, … }`.
- `api/cli/lib/version-parser.ts` — `parseVersion()` + `InvalidVersionError`. Already understands the `-beta` suffix.
- `api/cli/lib/yaml-reader.ts` — `readSchemaVersion(root, version)`. Reuse for validation-on-promote.
- `api/test/cli/cli-build.test.ts` — pattern for CLI tests: tmpdir fixture, capture logs, snapshot outputs.
- `api/package.json` — `schema:new` and `schema:promote` scripts already wired to `tsx cli/bin.ts new|promote`.

**Preview deployment (for Unit 2):**
- `api/wrangler.jsonc:40+` — `env.preview` block is complete (name, routes, R2 binding, rate-limit bindings). No changes needed here except to confirm shape.
- `.github/workflows/api-deploy.yaml` — prod deploy workflow; the preview workflow mirrors its shape but uses `CLOUDFLARE_API_TOKEN_PREVIEW` + `dtpr-api-preview` bucket + `--env preview` flag.
- `api/src/middleware/` — existing middleware (CORS, request-id, logging, payload-limits, timeout, error envelope). The new `noindex` middleware is one small file following the same pattern.

**Plugin + skills (for Units 3–5):**
- External pattern (Anthropic-official): `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/skill-creator/skills/skill-creator/SKILL.md` — canonical SKILL.md layout with required `name` + `description` frontmatter, progressive-disclosure body shape.
- External pattern: Sentry and Linear plugin layouts under the official marketplace demonstrate "plugin that primarily exists as a front-door to an MCP":
  - `.claude-plugin/plugin.json` — plugin manifest
  - `.mcp.json` — MCP server registration at the plugin level, with `type: "http"` and a URL for remote streamable-HTTP MCPs
  - `skills/<skill-name>/SKILL.md` — one per skill
- The Sentry pattern (`sentry-workflow/SKILL.md`) shows how skills reference MCP tools by name in prose (tables, phase bullets) rather than calling them directly. The tool descriptions live on the MCP server (our Unit 10); the skill provides the *workflow and judgment*.

### Institutional Learnings

- **Parent plan, Unit 5 lesson:** bulk content moves silently corrupt things. Characterization tests against a small fixture caught locale-mapping bugs before they hit all 75 elements. Both `schema:new` (copies all files) and `schema:promote` (renames the directory) should be tested against a 2-category / 2-element fixture before being run on real content.
- **Parent plan, MCP lesson:** the MCP tool *descriptions* are the primary agent-facing documentation. Skill bodies should *reference* tool names, not re-describe what they do. Duplicating tool descriptions into skill prose creates a rot surface.

### External References

- [Claude Code plugins / skills docs (Anthropic)](https://docs.claude.com/en/docs/claude-code/plugins) — the plugin + `.mcp.json` registration pattern; `type: "http"` for remote MCP.
- [skill-creator official plugin](https://github.com/anthropics/claude-plugins-official) — authoritative SKILL.md shape and the eval-loop harness referenced in Unit 4/5 verification.
- Parent plan research findings (`docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md:105–151`) for MCP and Cloudflare specifics.

## Key Technical Decisions

- **Plugin lives in a `plugin/dtpr/` subdirectory of this monorepo**, with a `.claude-plugin/marketplace.json` at the repo root listing it. *Rationale:* iteration speed while the schema and skills co-evolve; users install with `/plugin marketplace add helpful-places/dtpr` + `/plugin install dtpr` against the GitHub URL. Splitting into a standalone plugin repo is deferred until the schema/skills stabilize.
- **Two peer skills, no router.** The two skill descriptions (brainstorming DTPR itself vs describing a system with DTPR) are disjoint enough that a router skill adds ceremony without disambiguation value. Revisit if we add a third skill.
- **Skill bodies name MCP tools in prose; MCP server owns the tool descriptions.** The MCP's Zod-derived JSON Schema + `.describe()` text (parent plan Unit 10) is the single source of truth for what each tool does. Skill prose only explains *when/why* in a workflow.
- **`schema:promote` lands fully but is not run.** Nothing to promote today. The command is tested against a fixture; invoking it on `ai@2026-04-16-beta` is a separate decision for a separate PR. *Rationale:* the command is small enough that building it now is cheaper than paging it back in later, and holding it back would block any future schema work.
- **Plugin-level `.mcp.json` with `type: "http"`, no auth header.** The DTPR API is public and unauthenticated by design (parent plan R28), so the MCP registration is a two-line config with just `type` and `url`. No env-var expansion, no header config, no secrets to manage.
- **Preview deploy is PR-label-gated.** Only PRs labeled `schema:preview` trigger the preview deploy job. Rationale matches parent plan Unit 14: keeps incidental infra deploys off unrelated PRs.

## Open Questions

### Resolved During Planning

- **How do skills wire up remote MCPs?** Via a plugin-level `.mcp.json` with `type: "http"` and the URL. Skills themselves don't declare MCPs; the plugin does. When a user installs the plugin, the MCP is auto-registered.
- **Do we need to re-register the MCP tool descriptions inside the skill?** No. The MCP server owns the tool schemas (Unit 10); the skill body references tool names in workflow prose so the model can bind them at runtime.
- **Do we need an eval harness now?** Commit baseline eval prompts under `plugin/dtpr/evals/` so they run under skill-creator's existing `run_loop.py` when desired. Full optimization loop is post-launch.

### Deferred to Implementation

- **Exact wording of each skill description.** The description determines triggering accuracy, and the right wording is best found by running candidate descriptions against 10–20 should-trigger / should-not-trigger prompts. Start with a clear draft; tune during verification.
- **Which DTPR categories/elements deserve explicit scaffolding in the `describe-system` skill.** Depends on which tool-call chains repeatedly confuse the agent in practice. Start with minimal scaffolding; add only where we observe failures.

## Output Structure

```
plugin/
  dtpr/
    .claude-plugin/
      plugin.json                       # Plugin manifest: name, description, version, author
    .mcp.json                           # Remote MCP registration (http, url)
    README.md                           # Install instructions + one-paragraph per skill
    skills/
      dtpr-describe-system/
        SKILL.md                        # Consumer workflow: AI system -> datachain
      dtpr-schema-brainstorm/
        SKILL.md                        # Meta workflow: iterate on DTPR itself
    evals/
      describe-system.evals.json        # Baseline eval prompts per skill
      schema-brainstorm.evals.json
.claude-plugin/
  marketplace.json                      # Top-level; lists plugin/dtpr as a local plugin
```

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification.*

**Plugin install + invocation flow:**

```
User: /plugin marketplace add helpful-places/dtpr
User: /plugin install dtpr
Claude Code reads:
  - plugin/dtpr/.claude-plugin/plugin.json     -> plugin identity
  - plugin/dtpr/.mcp.json                      -> registers MCP "dtpr" at api.dtpr.io/mcp
  - plugin/dtpr/skills/*/SKILL.md              -> indexes skills (name + description)

User: "Describe our facial-recognition parking kiosk as a DTPR datachain"
Claude matches dtpr-describe-system (description trigger)
Loads SKILL.md body -> follows workflow:
  1. list_schema_versions (MCP)
  2. get_schema (MCP)
  3. list_elements(query='facial recognition', ...) (MCP)
  4. construct datachain
  5. validate_datachain (MCP) -> iterate on fix_hint per error
  6. present final datachain + narrative
```

**Drafting workflow (CLI):**

```
pnpm --filter ./api schema:new ai 2026-05-01-beta
  -> copies api/schemas/ai/2026-04-16-beta/ to api/schemas/ai/2026-05-01-beta/
  -> rewrites meta.yaml (status: beta, new created_at, notes line)
  -> prints "drafted from ai@2026-04-16-beta; edit api/schemas/ai/2026-05-01-beta/"

[user edits the new version]

pnpm --filter ./api schema:validate ai@2026-05-01-beta
pnpm --filter ./api schema:promote ai@2026-05-01-beta
  -> validates (same code path as validate command)
  -> renames directory (drops -beta)
  -> rewrites meta.yaml (status: stable)
  -> creates git branch schema/promote-2026-05-01, commits
  -> prints "PR ready: push this branch and open a PR"
```

## Implementation Units

- [ ] **Unit 1: `schema:new` + `schema:promote` CLI commands**

**Goal:** Land drafting and promotion commands following the `build` command's structure. Both commands are pure-function-plus-thin-fs-wrapper so they can be unit-tested against tmpdir fixtures.

**Requirements:** R21, R23

**Dependencies:** parent plan Units 4 + 5 (both complete)

**Files:**
- Create: `api/cli/commands/new.ts` — implements `schemaNew(type, version, flags) -> NewResult`
- Create: `api/cli/commands/promote.ts` — implements `schemaPromote(versionString, flags) -> PromoteResult`
- Modify: `api/cli/bin.ts` — wire both commands into the `commands` map (replace lines 53–59 stubs); update `printHelp()` to drop the "not yet implemented" suffix
- Test: `api/test/cli/cli-new.test.ts` — happy + edge cases against a 2-cat / 2-el tmpdir fixture
- Test: `api/test/cli/cli-promote.test.ts` — happy + edge cases; uses the same fixture shape

**Approach:**
- **`schema:new <type> <new-beta>`:**
  - Resolve "source" by reading `api/schemas/<type>/` and picking the newest version (prefer stable over beta if same date). Tie-break: lexicographic on date.
  - Target must end in `-beta` — drafting always starts from beta.
  - Copy the whole source directory to `api/schemas/<type>/<new-beta>/`.
  - Rewrite `meta.yaml`: set `version`, `status: beta`, new `created_at`, `notes: "Drafted from <source-version>"`, reset `content_hash` to the sentinel.
  - Print: `drafted from <source>; edit api/schemas/<type>/<new-beta>/` + a reminder that `pnpm schema:build` validates-and-emits.
  - Errors: target already exists, target missing `-beta` suffix, no source versions present, invalid type.
- **`schema:promote <type>@<date>-beta`:**
  - Validate the beta first by reusing `validateCmd` from `api/cli/commands/build.ts`. Short-circuit on validation failure with the same pretty-printer the build command uses.
  - Rename the directory: `api/schemas/<type>/<date>-beta/` → `api/schemas/<type>/<date>/`.
  - Rewrite `meta.yaml`: set `version` to the stable form, `status: stable`, keep `created_at`, update `notes: "Promoted from <date>-beta"`.
  - Git ops: `git checkout -b schema/promote-<type>-<date>` (or fail clearly if dirty tree), `git add api/schemas/<type>/<date>/` + `git rm` the old beta dir, `git commit -m "promote schema <type>@<date>"`.
  - Print: `PR ready: push this branch and open a PR titled 'promote schema <type>@<date>'`. Do not push; do not `gh pr create`.
  - Errors: validation fails, target stable dir already exists (immutability), dirty working tree, not a git repo.
- Both commands go through the same `parseCommonFlags` helper in `bin.ts`. `--source-root` allows the tests (and hypothetical future reuse) to point at a fixture dir instead of the real `api/schemas/`.

**Patterns to follow:**
- `api/cli/commands/build.ts` for command shape (result object, error propagation, stdout/stderr conventions).
- `api/cli/lib/yaml-reader.ts` for YAML parsing; reuse rather than re-implement.
- `api/test/cli/cli-build.test.ts` for test structure (tmpdir setup, fixture copy, capture stdout/stderr, assert filesystem + exit code).

**Test scenarios:**
- Happy path (`new`): `schema:new ai 2026-05-01-beta` against a fixture with only `ai/2026-04-16-beta/` → target dir exists, `meta.yaml` has new version/created_at, `content_hash` is sentinel, all element/category files copied.
- Happy path (`new` with stable source): fixture has both `ai/2026-04-16-beta/` and `ai/2026-04-16/` → source resolution prefers the stable.
- Edge case (`new`): target version without `-beta` suffix → error, exit 2, clear message.
- Edge case (`new`): target version already exists → error, exit 2, clear message, no files written.
- Edge case (`new`): unknown `<type>` with no versions → error, exit 2.
- Happy path (`promote`): `schema:promote ai@2026-05-01-beta` against fixture → beta dir renamed, `meta.yaml` status: stable, new branch created with the rename staged/committed, exit 0.
- Error path (`promote`): beta fails semantic validation → no rename, no branch, exit 1, same pretty-printed error format as `validate`.
- Error path (`promote`): target stable directory already exists → exit 2, clear message, no rename, no commit.
- Error path (`promote`): dirty working tree → exit 2, clear message, no changes.
- Integration (`promote`): after successful run, `git log -1 --name-status` shows the rename as a single commit on the new branch.

**Verification:**
- `pnpm --filter ./api schema:new ai 2026-05-01-beta` produces an editable copy under `api/schemas/ai/2026-05-01-beta/` and `pnpm --filter ./api schema:validate ai@2026-05-01-beta` succeeds on the copy without further edits.
- `pnpm --filter ./api schema:promote` on a hand-built fixture produces a clean branch diff that an engineer can push + PR manually.
- `api --help` output describes both commands and does not mention "not yet implemented".

---

- [ ] **Unit 2: Preview deployment workflow + noindex middleware**

**Goal:** Automate beta content pushes to `api-preview.dtpr.io` on PRs labeled `schema:preview`, and ensure preview traffic carries a `noindex` header so in-flight taxonomy is not indexed.

**Requirements:** R24

**Dependencies:** parent plan Unit 6 (complete); Cloudflare preview env + R2 bucket + custom domain (already provisioned).

**Prerequisites (pre-ship checklist, confirm before merging):**
- `CLOUDFLARE_API_TOKEN_PREVIEW` GitHub Actions secret populated (scope documented in `api/docs/deploy-tokens.md`).
- `R2_ACCESS_KEY_ID_PREVIEW` + `R2_SECRET_ACCESS_KEY_PREVIEW` populated for atomic R2 uploads to `dtpr-api-preview`.
- Parent plan's Unit 6 `deploy-tokens.md` confirms the `_PREVIEW` token scope matches this workflow's needs (deploy + R2-write only; no prod permissions).

**Files:**
- Create: `.github/workflows/api-preview-deploy.yaml` — new workflow, label-gated, mirrors `api-deploy.yaml` but uses the preview token, preview bucket, and `wrangler deploy --env preview`.
- Create: `api/src/middleware/noindex.ts` — tiny Hono middleware that reads `c.env.ENVIRONMENT` at request time and sets `X-Robots-Tag: noindex, nofollow` only when the value is `"preview"`. No-ops when the var is absent or any other value.
- Modify: `api/src/app.ts` — register the noindex middleware **unconditionally** in `createApp()`. The branch on `ENVIRONMENT` lives inside the handler, not at registration time — `c.env` is request-scoped, not module-scoped, so a registration-site branch on `c.env` is not implementable.
- Modify: `api/wrangler.jsonc` — add `vars: { ENVIRONMENT: "preview" }` to the `env.preview` block. No change to prod bindings (prod responses never see the header because `ENVIRONMENT` is undefined there).
- Modify: `api/worker-configuration.d.ts` — regenerate via `pnpm --filter ./api exec wrangler types` so `ENVIRONMENT: string | undefined` shows up on `Cloudflare.Env`. Without the regen, `c.env.ENVIRONMENT` is a TypeScript error in prod-typed handlers.
- Create: `api/docs/preview-deployments.md` — documents the workflow: label, secrets, what gets deployed, how to smoke-test.
- Test: `api/test/unit/noindex-middleware.test.ts` — unit test the middleware in isolation.
- Test (manual, documented): label a PR, watch workflow succeed, `curl -sI https://api-preview.dtpr.io/api/v2/schemas | grep x-robots-tag`.

**Approach:**
- Preview workflow `on: pull_request` with `types: [labeled, synchronize]`; guard every job with `if: contains(github.event.pull_request.labels.*.name, 'schema:preview')`. Reuse the same build-and-upload steps from `api-deploy.yaml`, parameterized on env.
- Uses `CLOUDFLARE_API_TOKEN_PREVIEW` + `R2_ACCESS_KEY_ID_PREVIEW` / `R2_SECRET_ACCESS_KEY_PREVIEW` (parent plan Unit 6 docs already name these).
- The noindex middleware is a small Hono handler placed after request-id but before the main route mount, so every response (including errors) gets the header when running under the preview env.
- **Environment detection** happens inside the handler: the middleware reads `c.env.ENVIRONMENT` at request time and returns early (no header) when undefined. The `ENVIRONMENT` binding is set only in the `env.preview` block of `wrangler.jsonc`. Production never sets it, so production responses never carry the header. A test asserts production responses have no `X-Robots-Tag`.
- Atomic R2 upload uses the same `api/scripts/r2-upload.ts` helper from Unit 6, pointed at `dtpr-api-preview`.
- Smoke test at workflow end: `curl -sI https://api-preview.dtpr.io/healthz` → 200 with the noindex header.

**Patterns to follow:**
- `.github/workflows/api-deploy.yaml` for job shape (checkout, pnpm setup, typecheck+test, build schema, upload R2, `wrangler deploy`, smoke test).
- `api/src/middleware/` for Hono middleware structure (existing `cors.ts`, `request-id.ts`, etc.).

**Test scenarios:**
- Happy path (middleware): request passes through middleware → response has `X-Robots-Tag: noindex, nofollow`.
- Edge case (middleware): preview middleware must not leak into production by default — a second unit test with `ENVIRONMENT` absent from `c.env` shows no `X-Robots-Tag` header.
- Integration (workflow, manual verification): open a throwaway PR with the `schema:preview` label → preview-deploy workflow succeeds → `curl -sI https://api-preview.dtpr.io/api/v2/schemas/ai@2026-04-16-beta` shows `x-robots-tag: noindex, nofollow` and the correct `content-hash`.
- Integration (workflow, negative): a PR *without* the label → workflow does not run any deploy job.
- Integration (workflow, prod isolation): the prod smoke test continues to show no `x-robots-tag` header on `api.dtpr.io/healthz`.

**Verification:**
- A labeled PR triggers preview deploy; unlabeled PRs do not.
- `curl -sI https://api-preview.dtpr.io/api/v2/schemas` returns `X-Robots-Tag: noindex, nofollow`.
- `curl -sI https://api.dtpr.io/api/v2/schemas` does **not** include `X-Robots-Tag`.
- `api/docs/preview-deployments.md` describes the end-to-end flow clearly enough for a new teammate to trigger and verify a preview deploy without pairing.

---

- [ ] **Unit 3: Plugin scaffold + marketplace manifest**

**Goal:** Create the `plugin/dtpr/` directory structure that makes the DTPR MCP installable as a Claude Code plugin. This unit is prerequisites-only — no skill logic yet.

**Requirements:** Foundation for the revised Unit 15 (agent skill plugin).

**Dependencies:** parent plan Unit 10 (MCP server live at `api.dtpr.io/mcp`); parent plan Unit 6 (custom domain live).

**Files:**
- Create: `plugin/dtpr/.claude-plugin/plugin.json` — plugin manifest (name, description, version, author, homepage).
- Create: `plugin/dtpr/.mcp.json` — MCP registration: `{ "dtpr": { "type": "http", "url": "https://api.dtpr.io/mcp" } }`.
- Create: `plugin/dtpr/README.md` — install instructions, one-paragraph summary of each skill, link to `api.dtpr.io` and `docs.dtpr.io` (or wherever canonical docs live).
- Create: `.claude-plugin/marketplace.json` (repo root) — marketplace manifest that lists `plugin/dtpr/` as a local-path plugin, so `/plugin marketplace add helpful-places/dtpr` against this GitHub repo surfaces the plugin.
- Modify: `.gitignore` — ensure `plugin/` is not ignored (check it isn't already; add an explicit negative pattern if needed).
- Modify: root `README.md` — add a short "Claude Code plugin" section linking to `plugin/dtpr/README.md`.

**Approach:**
- Follow the Anthropic-official marketplace layout verbatim (see `~/.claude/plugins/marketplaces/claude-plugins-official/`).
- `plugin.json` uses the current plugin schema. Start with: `name: "dtpr"`, `description`, `version: "0.1.0"`, `author: "Helpful Places"`. Authoritative schema URL goes in `$schema` so editors validate it.
- `.mcp.json` is a minimal remote-HTTP registration — `type`, `url`, and a static `headers.User-Agent: "dtpr-claude-plugin/<version>"`. No auth header (public unauth API per parent R28). The User-Agent exists so the Worker can log/rate-limit plugin traffic separately from generic MCP clients without a breaking plugin re-release.
- `marketplace.json` uses `source: "./plugin/dtpr"` (relative path inside the marketplace repo) so the marketplace repo *is* the DTPR repo.
- **Workspace posture:** `plugin/dtpr/` is **not** a pnpm workspace package (no `package.json` there, not added to `pnpm-workspace.yaml`). Offline conformance tests (`plugin/dtpr/evals/verify.mjs`) run via a repo-root `test:plugin` npm script invoked from a new `.github/workflows/plugin-test.yaml` workflow. The api workspace's vitest config is not reached across the package boundary.
- README includes an "Install" section with the two user commands (`/plugin marketplace add`, `/plugin install`) and a "Troubleshoot" section with common-issue pointers (MCP not responding → check `https://api.dtpr.io/healthz`; skill not triggering → `/plugin list` to confirm it's installed).

**Patterns to follow:**
- `~/.claude/plugins/marketplaces/claude-plugins-official/external_plugins/linear/.mcp.json` — closest match for remote-HTTP-no-auth MCP registration.
- `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/skill-creator/` — example of a plugin that ships skills.
- `~/.claude/plugins/marketplaces/claude-plugins-official/.claude-plugin/marketplace.json` — authoritative marketplace manifest format.

**Test scenarios:**
- Happy path (offline): `node -e "JSON.parse(fs.readFileSync('plugin/dtpr/.claude-plugin/plugin.json'))"` succeeds; same for `.mcp.json` and `marketplace.json`. Each file conforms to its published JSON Schema (pipe through `ajv` or equivalent in CI — one-line in `api/vitest.cli.config.ts`-style test).
- Happy path (live, manual): `/plugin marketplace add <this-repo-url>` + `/plugin install dtpr` succeeds locally; `/plugin list` shows `dtpr` as installed; `/mcp` shows `dtpr` as a registered server.
- Edge case: a version bump in `plugin.json` triggers a marketplace refresh on the user side (`/plugin update`).
- Test expectation (offline-only): JSON parse + basic schema conformance. No behavioral assertion beyond "files exist and are valid".

**Verification:**
- `/plugin install dtpr` against the marketplace-added repo URL succeeds end-to-end on at least one clean Claude Code install.
- `/mcp call dtpr list_schema_versions` returns the current versions list from production.

---

- [ ] **Unit 4: `dtpr-describe-system` skill**

**Goal:** Ship a skill that takes a natural-language description of an AI system and drives the MCP tools to produce a validated DTPR datachain. This is the canonical consumer use and the north-star acceptance test for the read-side API.

**Requirements:** Revised Unit 15 (primary consumer front-door).

**Dependencies:** Unit 3 (plugin scaffold).

**Files:**
- Create: `plugin/dtpr/skills/dtpr-describe-system/SKILL.md` — skill definition with frontmatter (`name`, `description`) and body (workflow, tool references, output shape).
- Create: `plugin/dtpr/evals/describe-system.evals.json` — baseline eval set compatible with `skill-creator`'s `run_loop.py`. Start with 5 should-trigger prompts (varied domains — parking, library, 311 chatbot, etc.) and 5 should-not-trigger prompts (unrelated code help).
- Create: `plugin/dtpr/evals/verify.mjs` — Node script (shared across Units 4 and 5) that (a) validates each SKILL.md has required frontmatter (`name`, `description`) and valid markdown body, (b) greps skill-body tool-name references against a committed snapshot of the MCP tool registry (read from `api/src/mcp/tools.ts` at CI time), failing when a referenced tool is no longer registered. Catches skill-body drift when MCP tools are renamed.

**Approach:**
- **Frontmatter.** Description must be pushy and name the trigger context: e.g., "Describe an AI system, algorithm, or automated decision process as a DTPR (Digital Trust for Places and Routines) AI datachain. Use when a user wants to document, disclose, or audit how an AI system makes decisions — including inputs, outputs, risks, and rights. Produces a machine-validated JSON datachain conforming to the DTPR schema."
- **Body workflow** (5 phases, named, short):
  1. **Understand the system** — prompt user for what/where/who/decision/data if not provided.
  2. **Load the schema** — `list_schema_versions` (pick the current status=beta or stable), `get_schema` (`include: "manifest"`), capture locales and categories.
  3. **Find relevant elements** — call `list_elements` with category filter or `query` (BM25 search) for each datachain category; use `get_elements` (bulk) to fetch chosen element bodies.
  4. **Construct the datachain** — assemble the JSON matching the schema's datachain-type structure.
  5. **Validate + iterate** — `validate_datachain`; if `ok: false`, apply the `fix_hint` on each returned error and retry up to 3 times.
- **Output section** defines what the agent returns to the user: the validated datachain JSON + a short narrative paragraph per category explaining the choices. This keeps the skill's value visible to a non-technical reader.
- **Tool reference table.** A single table mapping each workflow step to its MCP tool (columns: Step, Tool, Why). Does **not** duplicate tool parameters — that's the MCP's JSON Schema's job.
- **Security framing.** One paragraph noting that text-field content returned by the MCP is taxonomy content (not user input) but narrative answers the agent writes should be presented to the user for review before any downstream action.

**Patterns to follow:**
- `~/.claude/plugins/cache/claude-plugins-official/sentry/1.0.0/skills/sentry-fix-issues/SKILL.md` — phase-by-phase workflow + tool-mapping table; same "front door for an MCP" shape.
- `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/skill-creator/skills/skill-creator/SKILL.md` — progressive-disclosure body shape; keep under ~300 lines.

**Test scenarios:**
- Happy path (offline, deterministic — smoke only): the SKILL.md parses as valid markdown + YAML frontmatter with required fields (`name`, `description`). A Node script in `plugin/dtpr/evals/verify.mjs` validates this; runs in CI.
- Happy path (live, manual): given "describe the facial-recognition parking kiosk at the downtown garage," Claude completes the flow, produces a datachain that `validate_datachain` accepts, and narrates the choices. Record output to `plugin/dtpr/evals/baseline-outputs/describe-system-2026-04-17.md` for regression tracking.
- Happy path (live, 3 domains): run the same flow against 3 committed `evals.json` should-trigger prompts (parking, library, 311). Expect ≥2/3 to produce validated datachains on first try; at most one needs a retry.
- Edge case (live): prompt where no matching elements exist (e.g., "describe a thermostat") → skill should conclude "no applicable DTPR elements found" rather than invent IDs.
- Trigger test (live): 5 should-not-trigger prompts (general code help, other MCPs) do **not** invoke the skill.

**Verification:**
- `/plugin install dtpr` followed by the facial-recognition-parking prompt produces a datachain that `validate_datachain` accepts without manual iteration.
- Baseline eval outputs are committed and reviewable in PRs when the skill or schema changes.
- **Inherited soft thresholds from parent plan Unit 15** (carried forward as verification targets, not CI gates): agent completes the flow without user intervention; elapsed time < 60 s; < 20 tool calls per prompt; no hallucinated element IDs (every ID present in `list_elements` output). Used for regression judgment and PR review; no strict latency SLO is enforced at this phase.

---

- [ ] **Unit 5: `dtpr-schema-brainstorm` skill**

**Goal:** Ship a skill Jonathan (and later others) use to iterate on DTPR itself — identify gaps in the taxonomy, propose new elements/categories, sanity-check candidate changes. Output is a concrete schema edit proposal, ready to apply with `schema:new`.

**Requirements:** Revised Unit 15 (meta-use; feeds the drafting CLI from Unit 1).

**Dependencies:** Unit 3 (plugin scaffold), Unit 1 (`schema:new`) for the handoff path.

**Files:**
- Create: `plugin/dtpr/skills/dtpr-schema-brainstorm/SKILL.md`.
- Create: `plugin/dtpr/evals/schema-brainstorm.evals.json` — 5 should-trigger prompts (e.g., "help me think through whether DTPR covers generative-AI output disclosure") + 5 should-not-trigger prompts.
- Modify: `plugin/dtpr/evals/verify.mjs` (created in Unit 4) — extend to cover this skill's tool-name references too.

**Approach:**
- **Frontmatter.** Description: "Brainstorm and critique the structure of the DTPR (Digital Trust for Places and Routines) schema itself — its AI datachain categories, elements, variables, and locale coverage. Use when iterating on DTPR taxonomy, identifying gaps for new AI patterns, or evaluating whether the current schema captures a novel scenario. Output is a concrete schema-edit proposal."
- **Body workflow** (4 phases):
  1. **Load the current schema** — `list_schema_versions`, `get_schema` (`include: "full"`), capture all categories + elements + variables.
  2. **Frame the scenario** — user describes a real or hypothetical AI system that the schema may not cover well. Skill asks clarifying questions along DTPR axes (purpose, inputs, decisions, outputs, rights).
  3. **Gap analysis** — for each DTPR category, identify whether the current elements cover the scenario. Surface missing concepts, ambiguous boundaries, or elements that would need new `variables`.
  4. **Draft the proposal** — produce a structured Markdown proposal: which elements to add/edit/retire, which categories need widening, and optional diff-style YAML snippets. End with the `schema:new` command line to run to start the draft.
- **Handoff.** The skill emits a concrete shell command line (e.g., `pnpm --filter ./api schema:new ai 2026-05-01-beta`) at the end of its proposal, which the user copies and runs themselves. The skill does **not** invoke the CLI, modify files under `api/schemas/`, or shell out — the edit cycle is human-driven. It writes the proposal to a user-visible location (standard Claude Code convention: print + offer to save to a file the user chooses).
- **Non-goal.** The skill does *not* modify `api/schemas/` files directly. That edit cycle is human-driven (edit → `schema:validate` → PR).
- **MCP tool usage.** Primarily `list_schema_versions`, `get_schema(include: "full")`, `list_elements`, `list_categories`. `validate_datachain` is secondary here but useful when the user wants to sanity-check that a proposed revision still validates the current beta as a regression canary.

**Patterns to follow:**
- Same SKILL.md structure as Unit 4 (frontmatter + phased body + tool-reference table). Use the parallel skill's layout for consistency.
- Output format: Markdown proposal with a "Proposed changes" section and a "Validation check" section.

**Test scenarios:**
- Happy path (offline): SKILL.md parses; frontmatter validates.
- Happy path (live, meta-scenario): "DTPR doesn't say anything about LLM hallucination disclosure — propose changes" → skill produces a proposal naming at least one new element or element-field, with a `schema:new` command line at the end.
- Happy path (live, bounded-scope): "walk me through the accountable category for a library self-checkout kiosk" → skill explores that one category in depth rather than drafting new elements.
- Edge case (live): user asks a consumer question ("describe our facial-recognition kiosk") → this skill defers to `dtpr-describe-system` (body includes an explicit "if the user wants to describe a system, use `dtpr-describe-system` instead" line).
- Trigger test (live): 5 should-trigger prompts all fire; 5 should-not (including should-trigger prompts for the sibling skill) do not fire this one.

**Verification:**
- Running the skill on a real gap (Jonathan's choice — likely LLM-related, given current focus) produces a usable schema-edit proposal that can be handed to `schema:new` to begin a beta draft.
- The two skills route correctly: `describe` prompts go to `describe-system`, `brainstorm` prompts go to `schema-brainstorm`, without confusion.

## System-Wide Impact

- **Interaction graph:** The plugin is an external consumer of the DTPR API and MCP. It does not import from `api/`, `app/`, `docs-site/`, or `studio/`. The only cross-cutting code is the preview noindex middleware (Unit 2), which is a single new file registered conditionally in `api/src/app.ts`.
- **Error propagation:** Skill-level errors surface to the user through Claude's standard chat UI. MCP errors continue to flow through the typed `{ok, errors, isError}` envelope from parent plan Unit 10. `validate_datachain` returns `ok:false` with a `fix_hint` on each error entry — the describe-system skill's workflow explicitly handles this.
- **State lifecycle risks:** `schema:new` copies directories atomically (write to the new dir, no partial state in the old). `schema:promote` renames the directory + updates `meta.yaml` + commits to git — all three together, or none (check-then-rollback if any step fails). The preview deploy is idempotent: re-running overwrites the preview R2 content but never touches prod.
- **API surface parity:** No changes to the public REST v2 or MCP wire contracts. The plugin consumes the same surfaces Unit 12's tests cover.
- **Integration coverage:** The skills' live verification (Unit 4 and 5 verification sections) exercises the full read-side MCP flow against production (`api.dtpr.io/mcp`), parallel to parent plan Unit 12's Miniflare coverage.
- **Unchanged invariants:** The existing MCP tool set (7 tools), their descriptions, and their wire shapes are unchanged. The schema directory structure (`api/schemas/<type>/<version>/{meta.yaml, datachain-type.yaml, categories/, elements/}`) is unchanged. `wrangler.jsonc` prod bindings are unchanged.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| **Claude Code plugin schema changes.** The plugin + skills format is still evolving (elicitation, MCP apps, marketplace schema recently updated). A schema change could break `plugin.json` or `.mcp.json` after we ship. | Validate all plugin manifests against the published `$schema` URL in CI. Pin to schemas available at ship time; revisit on each Claude Code minor version. The marketplace manifest is the most likely to move — document the pinning decision in `plugin/dtpr/README.md`. |
| **Skill descriptions collide** (both skills mention "DTPR"; model picks the wrong one). | Run the committed eval sets as part of verification in Unit 4 and 5. If collision is observed, add a router skill (documented in Key Technical Decisions as a deferred option); iterate descriptions first. |
| **`schema:promote` git operation corrupts the user's working tree.** | Hard precondition check: refuse to run if working tree is dirty. All file ops are contained in the target schemas directory. Tests cover the dirty-tree abort path. |
| **Preview deploy workflow fires on unrelated PRs**, chewing Cloudflare Workers invocations. | Label-gated `if: contains(github.event.pull_request.labels.*.name, 'schema:preview')`. The label is the gate, not the file-path filter. |
| **Users install the plugin but the MCP is unreachable** (e.g., DNS issue, Worker down). | `plugin/dtpr/README.md` has a Troubleshoot section linking to `https://api.dtpr.io/healthz` as the first check. Skill bodies mention the same check when a tool call fails. |
| **Eval prompts become stale** as the schema evolves. | Baseline outputs under `plugin/dtpr/evals/baseline-outputs/` are dated; rerunning on a schema update is a one-line `run_loop.py` command. Regeneration on schema changes is a PR-review checklist item. |
| **The describe-system skill invents element IDs under pressure** (model hallucination). | Skill body explicitly says "only use element IDs returned by `list_elements` or `get_elements`." Secondary mitigation: `validate_datachain` already catches unknown IDs with `fix_hint: "id '<...>' is not in schema ai@<version>"`. |

## Documentation / Operational Notes

- `plugin/dtpr/README.md` — install, skills summary, troubleshoot. Linked from repo-root `README.md`.
- `api/docs/preview-deployments.md` — new. Preview-deploy trigger label, required secrets, verification steps.
- `api/docs/deploy-tokens.md` — already exists from parent plan Unit 6; no changes expected, but confirm the `_PREVIEW` token scope matches the new workflow's needs before shipping Unit 2.
- No runbook changes for prod; this plan adds no alerts, no dashboards, no rotations.

## Sources & References

- **Origin plan:** [docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md](2026-04-16-001-feat-dtpr-api-mcp-plan.md) — Units 13, 14, 15 superseded by this plan.
- **CLI template:** `api/cli/commands/build.ts`, `api/cli/bin.ts`, `api/test/cli/cli-build.test.ts`.
- **Preview template:** `.github/workflows/api-deploy.yaml`, `api/wrangler.jsonc` (env.preview block).
- **Plugin / skills references:**
  - `~/.claude/plugins/marketplaces/claude-plugins-official/plugins/skill-creator/skills/skill-creator/SKILL.md` — skill shape authority.
  - `~/.claude/plugins/marketplaces/claude-plugins-official/external_plugins/linear/.mcp.json` — minimal remote-HTTP MCP registration.
  - `~/.claude/plugins/cache/claude-plugins-official/sentry/1.0.0/skills/sentry-workflow/SKILL.md` — closest pattern-match for an MCP-front-door skill collection.
  - `~/.claude/plugins/marketplaces/claude-plugins-official/.claude-plugin/marketplace.json` — marketplace format authority.
- **External docs:** Claude Code plugin + skill docs (anthropic.com/claude-code/marketplace.schema.json referenced in marketplace manifests).
