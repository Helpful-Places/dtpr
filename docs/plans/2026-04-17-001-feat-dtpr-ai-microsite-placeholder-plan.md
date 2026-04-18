---
title: "feat: dtpr.ai microsite placeholder (Nuxt 4 + Docus on Cloudflare Workers)"
type: feat
status: active
date: 2026-04-17
---

# feat: dtpr.ai microsite placeholder (Nuxt 4 + Docus on Cloudflare Workers)

## Overview

Stand up a minimal, deployable Nuxt 4 + Docus site at `dtpr.ai` as a new pnpm workspace package under `dtpr-ai/`. Scope is strictly a placeholder — default Docus starter with title, logo, and a single index page — with Cloudflare Worker deployment wired up so future content work has a live target. A follow-up round will flesh out landing copy and the `/docs` surface.

## Problem Frame

The project is introducing a DTPR-for-AI microsite at the `dtpr.ai` domain. Today, the only web surface is the broader documentation site at `docs.dtpr.io` (`docs-site/`), which covers the full DTPR standard. The AI-focused microsite needs its own URL and its own narrow surface so the team can iterate on AI-specific positioning and, eventually, AI-specific reference docs under `/docs`, without distorting the main documentation IA.

Getting the skeleton deployed *now* — even empty — removes the ambiguity around infrastructure, DNS, and build pipelines before any content effort begins.

## Requirements Trace

- R1. Create a new pnpm workspace package at `dtpr-ai/` that builds a Nuxt 4 + Docus site.
- R2. The site renders the default Docus starter (title, logo, one index page) — no custom landing layout or docs content yet.
- R3. The site is deployable as a Cloudflare Worker (via `wrangler` / the `cf` CLI the user has locally).
- R4. The Worker is configured to serve the `dtpr.ai` custom domain in production.
- R5. `pnpm install` + `pnpm dev:dtpr-ai` runs the site locally with no extra setup.
- R6. The existing `docs-site/` (deployed at `docs.dtpr.io`) is not modified.

## Scope Boundaries

- No custom landing page, branding, or marketing copy beyond Docus defaults.
- No `/docs` content tree, navigation structure, or MDC components.
- No R2, KV, or Queues bindings. A D1 binding **is** required — `@nuxt/content` (shipped with Docus) auto-switches to D1 on the `cloudflare-module` preset and expects binding `DB` at runtime.
- No GitHub Actions deploy workflow in this plan (see Deferred below).
- No analytics, SEO tuning, sitemap, or OG image work.
- No i18n, theming, or typography customization.

### Deferred to Separate Tasks

- **Landing page design + copy**: future brainstorm + plan once positioning for "DTPR for AI" is clear.
- **`/docs` content authoring**: future content pass; the Docus content tree is ready to receive it.
- **CI/CD for `dtpr-ai/` deploys**: Cloudflare Workers Builds (configured in the CF dashboard) is the established pattern for `docs-site/` — mirror that in a follow-up, or add a GH Actions workflow modeled on `.github/workflows/api-deploy.yaml` if Workers Builds isn't viable.
- **Eventual merge into `docs-site/`**: explicitly acknowledged as a possible future state, not in this scope.

## Context & Research

### Relevant Code and Patterns

- `docs-site/package.json` — exact Nuxt 4 + Docus dependency set to mirror (`nuxt@^4.0.0`, `docus@latest`, `@nuxt/ui@^4.5.1`), plus `wrangler` as devDep.
- `docs-site/nuxt.config.ts` — `extends: ['docus']`, `site.name`, and the `$production` Nitro preset block with `cloudflare-module` and the `agents/mcp` stub rollup plugin. The stub is required because Docus pulls in `@nuxtjs/mcp-toolkit`, whose Cloudflare provider imports `agents/mcp`, which is not available in Workers Builds. The new site must carry the same stub.
- `docs-site/wrangler.toml` — reference shape for `name`, `account_id`, `main`, `compatibility_date`, `compatibility_flags`, `routes` (with `custom_domain = true`), and `[assets]` directory pointing at `.output/public`. The new Worker uses the same shape minus the `[[d1_databases]]` block.
- `docs-site/app.config.ts` — `defineAppConfig` shape for `header`, `seo`, `socials`, and `github` (branch + `rootDir`). Mirror this pattern, pointed at `dtpr-ai`.
- `docs-site/content/index.md` — pattern for the root content page with frontmatter (`title`, `description`, `navigation`). New site's index can be drastically simpler (one line of copy).
- `pnpm-workspace.yaml` — workspace registration lists each top-level package explicitly (`app`, `api`, `docs-site`, `studio`, `packages/*`). Must add `dtpr-ai`.
- Root `package.json` — scripts follow the `dev:<pkg>` / `build:<pkg>` convention using `pnpm --filter ./<pkg>`. Add `dev:dtpr-ai` and `build:dtpr-ai` in the same style.
- `docs-site/.gitignore` — ignores `node_modules`, `.nuxt`, `.nitro`, `.cache`, `.output`, `.env`, `dist`, `.data`, `.DS_Store`. Copy as-is.

### Institutional Learnings

- Recent commits `d7e619a` ("Fix docs-site Cloudflare Workers deploy failure") and `ca22ebd` ("Fix docs-site Cloudflare Workers build failure") produced the `agents/mcp` stub and the `NODE_OPTIONS=--max-old-space-size=4096` build flag. Both must be inherited verbatim in `dtpr-ai/` — without them, Docus's production build fails on Cloudflare.
- `docs-site/` is deployed via Cloudflare Workers Builds (no workflow under `.github/workflows/` matches it). The `cf` CLI + `wrangler deploy` is the local escape hatch.

### External References

- Docus starter docs — the `extends: ['docus']` pattern is the canonical way to bootstrap a Docus app; the rest is standard Nuxt 4.
- Cloudflare Workers custom-domain routing requires the apex zone (`dtpr.ai`) to be in the target Cloudflare account before `wrangler deploy` can attach the route. If the zone is not yet added, the deploy succeeds but the route binding will fail — verify zone presence before the first production deploy.

## Key Technical Decisions

- **New workspace package, not a route inside `docs-site/`**: the user intent is a distinct microsite with its own domain and its own editorial surface. A sub-route under `docs.dtpr.io` would conflate the AI-focused narrative with the broader standard's docs. A separate package also makes it trivial to merge later if priorities shift.
- **Mirror `docs-site/` structure**: proven pattern, proven build pipeline, proven production quirks (the `agents/mcp` stub). Deviating would risk re-discovering the same bugs.
- **`wrangler.jsonc`, not `wrangler.toml`**: the newer JSONC config is what `api/` already uses (`api/wrangler.jsonc`). `docs-site/wrangler.toml` predates that decision. Standardize new packages on JSONC.
- **D1 binding for content storage**: discovered during `nuxt prepare` — `@nuxt/content` emits `WARN Deploying to Cloudflare requires using D1 database, switching to D1 database with binding DB`. This is an automatic switch on the `cloudflare-module` preset; there is no way to deploy `@nuxt/content` on Workers without a `DB`-bound D1. Named the database `dtpr-ai-content` to mirror `docs-site/`'s `dtpr-docs-content`.
- **Default Docus starter, no landing customization**: the user explicitly chose the default Docus starter for this scope. Avoid pre-building landing structure that will be replaced once positioning is defined.
- **Apex `dtpr.ai` via custom domain route**: consistent with `docs.dtpr.io`. No need for `www` redirect in placeholder scope.
- **Default `assets.directory` = `.output/public`**: matches `docs-site/` and is what Nuxt's cloudflare-module preset emits.

## Open Questions

### Resolved During Planning

- *Should the new site live inside `docs-site/` as a route group?* — No. User directive was a new `dtpr-ai/` folder.
- *Should content render anything beyond the Docus default?* — No. User selected "Docus default — just the Docus starter with a title, logo, and one index page".
- *Do we need D1, R2, or KV?* — **Yes, D1 is required.** Discovered at implementation time via a `nuxt prepare` warning: `@nuxt/content` auto-switches to D1 on the `cloudflare-module` preset and requires a `DB` binding. No R2 or KV needed.
- *Is `dtpr.ai` already a zone in the target Cloudflare account?* — Yes (confirmed by user at implementation time). Custom-domain route will bind on first deploy.
- *TOML or JSONC for the Worker config?* — JSONC. Matches `api/wrangler.jsonc`; `docs-site/wrangler.toml` is the only outlier and predates the standardization.

### Deferred to Implementation

- **Worker name collision**: confirm the name `dtpr-ai` is not already in use on the account before the first deploy.
- **Content routing for the eventual `/docs` prefix**: Docus treats the whole `content/` tree as docs by default. Once docs content starts landing, we will need to decide whether to move docs under `content/docs/` (so landing can live at `content/index.md` without nav) or restructure with a custom layout. Out of scope here — flagged so the placeholder index doesn't accidentally foreclose either option.
- **Deploy pipeline choice**: local build is blocked on Node 25 + a `nuxt-og-image`/`nuxt-site-config` version skew (same failure as `docs-site/` on this machine), so the first deploy cannot come from the local Mac. Since `docs-site/` is deployed via Cloudflare Workers Builds with no GH Actions workflow, replicate that: configure a Workers Build in the CF dashboard pointed at this repo, build command `pnpm install --frozen-lockfile && pnpm --filter ./dtpr-ai build`, build output `dtpr-ai/.output`. Alternatively, add a GH Actions workflow modeled on `.github/workflows/api-deploy.yaml`.

## Implementation Units

- [x] **Unit 1: Scaffold `dtpr-ai/` workspace package**

**Goal:** Create a new pnpm workspace package at `dtpr-ai/` containing the Nuxt 4 + Docus skeleton, mirroring `docs-site/`'s proven structure minus D1 and content.

**Requirements:** R1, R2, R5, R6

**Dependencies:** None

**Files:**
- Create: `dtpr-ai/package.json`
- Create: `dtpr-ai/nuxt.config.ts`
- Create: `dtpr-ai/app.config.ts`
- Create: `dtpr-ai/tsconfig.json`
- Create: `dtpr-ai/.gitignore`
- Create: `dtpr-ai/content/index.md`
- Create: `dtpr-ai/public/.gitkeep`

**Approach:**
- `package.json`: `name: "dtpr-ai"`, `private: true`, `scripts` matching `docs-site/` (`build` uses the same `NODE_OPTIONS=--max-old-space-size=4096 nuxt build` invocation), same dependency versions (`nuxt ^4.0.0`, `docus latest`, `@nuxt/ui ^4.5.1`), `wrangler` as devDependency. Omit `better-sqlite3` — no D1.
- `nuxt.config.ts`: `extends: ['docus']`, `site.name: 'DTPR for AI'` (placeholder name — refine in content pass), `$production.nitro.preset: 'cloudflare-module'` with the `agents/mcp` stub rollup plugin copied verbatim from `docs-site/nuxt.config.ts`, same `compatibilityDate`.
- `app.config.ts`: minimal `defineAppConfig` with `header.title`, `seo.title`, `seo.description`, `socials.github`, and `github.rootDir: 'dtpr-ai'` — otherwise identical shape to `docs-site/app.config.ts`.
- `tsconfig.json`: `{ "extends": "./.nuxt/tsconfig.json" }` — same as `docs-site/`.
- `.gitignore`: copy of `docs-site/.gitignore`.
- `content/index.md`: frontmatter with `title` and `description` plus one short paragraph of placeholder copy. Do not include any `::card-group` or rich MDC — just prose. This keeps the first deploy visually equivalent to the Docus default, and the page will be replaced wholesale in the content pass.
- `public/.gitkeep`: placeholder so the directory exists for Nuxt's static asset pipeline.

**Patterns to follow:**
- `docs-site/package.json`, `docs-site/nuxt.config.ts`, `docs-site/app.config.ts` — mirror structure verbatim where possible; the `agents/mcp` stub is mandatory.

**Test scenarios:**
- Happy path: `pnpm install` at repo root completes without errors once the package is registered (Unit 2).
- Happy path: `pnpm dev:dtpr-ai` starts the Nuxt dev server on localhost and `GET /` returns the Docus default layout with the placeholder index copy.
- Integration: `pnpm build:dtpr-ai` produces `.output/server/index.mjs` and `.output/public/` without errors, with the `agents/mcp` stub active under the `$production` Nitro config (verify by inspecting the build log for the rollup plugin name or by confirming no `agents/mcp` resolution error appears).

**Verification:**
- `dtpr-ai/` contains the seven files listed above.
- Running `pnpm dev:dtpr-ai` serves the Docus default site locally.
- Running `pnpm build:dtpr-ai` exits 0 and produces a `.output/` directory inside `dtpr-ai/`.

---

- [x] **Unit 2: Register `dtpr-ai/` with the monorepo**

**Goal:** Make `dtpr-ai/` a first-class workspace package so the root scripts, lockfile, and install graph all see it.

**Requirements:** R1, R5

**Dependencies:** Unit 1

**Files:**
- Modify: `pnpm-workspace.yaml`
- Modify: `package.json` (root)

**Approach:**
- `pnpm-workspace.yaml`: add `- 'dtpr-ai'` to the `packages` list, placed next to the other top-level package entries.
- Root `package.json`: add `dev:dtpr-ai` and `build:dtpr-ai` scripts using the same `pnpm --filter ./dtpr-ai <cmd>` form as the existing `dev:docs` / `build:docs` scripts. Do not touch the existing scripts.
- Run `pnpm install` to regenerate the lockfile.

**Patterns to follow:**
- Existing script conventions in root `package.json` (`dev:app`, `dev:docs`, `dev:api`, `build:*`).
- Existing `pnpm-workspace.yaml` formatting.

**Test scenarios:**
- Happy path: `pnpm install` resolves the new package and writes the updated `pnpm-lock.yaml` without `ERR_PNPM_NO_MATCHING_VERSION` or workspace-resolution errors.
- Happy path: `pnpm --filter ./dtpr-ai exec nuxt --version` prints a Nuxt 4 version string.
- Edge case: `pnpm --filter ./docs-site run build` still succeeds after the workspace change — confirms the new entry did not disturb the existing site's resolution.

**Verification:**
- `pnpm-workspace.yaml` lists `dtpr-ai`.
- Root `package.json` has `dev:dtpr-ai` and `build:dtpr-ai` scripts.
- `pnpm-lock.yaml` contains an entry for `dtpr-ai`.

---

- [x] **Unit 3: Add Cloudflare Worker config for `dtpr.ai`**

**Goal:** Give the site a deployable Worker configuration pinned to the `dtpr.ai` custom domain, including the D1 binding `@nuxt/content` requires.

**Requirements:** R3, R4

**Dependencies:** Unit 1

**Files:**
- Create: `dtpr-ai/wrangler.jsonc`
- External: create a D1 database via `wrangler d1 create dtpr-ai-content`; capture the generated `database_id`.

**Approach:**
- Model on `api/wrangler.jsonc` (JSONC with `$schema` pointer) rather than `docs-site/wrangler.toml`. Fields:
  - `name: "dtpr-ai"`
  - `account_id` identical to `docs-site/wrangler.toml`.
  - `main: ".output/server/index.mjs"`, `compatibility_date: "2024-09-19"`, `compatibility_flags: ["nodejs_compat"]`.
  - `routes: [{ pattern: "dtpr.ai", custom_domain: true }]`.
  - `assets: { directory: ".output/public" }`.
  - `d1_databases: [{ binding: "DB", database_name: "dtpr-ai-content", database_id: "<generated-id>" }]` — binding **must** be `DB` (what `@nuxt/content` expects on the cloudflare-module preset).

**Patterns to follow:**
- `api/wrangler.jsonc` — JSONC shape and `$schema` pointer.
- `docs-site/wrangler.toml` — field semantics (route + D1 binding name `DB`).

**Test scenarios:**
- Happy path: `wrangler d1 create dtpr-ai-content` returns a database_id.
- Happy path: `wrangler deploy --dry-run` from `dtpr-ai/` parses the JSONC successfully (may fail on missing `.output/` until Unit 4 builds; the parse success is the signal here).

**Verification:**
- `dtpr-ai/wrangler.jsonc` exists with the fields above.
- The D1 database `dtpr-ai-content` exists in the target CF account.

---

- [ ] **Unit 4: First production deploy to `dtpr.ai`**

**Goal:** Deploy the placeholder Worker and confirm `https://dtpr.ai` serves the Docus default page.

**Requirements:** R3, R4

**Dependencies:** Units 1–3

**Files:**
- None (operational — no source files change in this unit).

**Approach:**
- From `dtpr-ai/`, run `pnpm build` (or `pnpm --filter ./dtpr-ai build` from root) to produce `.output/`.
- Run `cf` / `wrangler deploy` from `dtpr-ai/` to publish the Worker.
- If the deploy fails because the `dtpr.ai` zone is not attached to the account:
  1. Add the zone via the CF dashboard or `cf` CLI (whichever the user prefers).
  2. Ensure the registrar's nameservers point to Cloudflare.
  3. Re-run the deploy.
- If the deploy succeeds but `https://dtpr.ai` fails to resolve, confirm: (a) the custom-domain route is attached in the CF dashboard under Workers & Pages > `dtpr-ai` > Settings > Triggers; (b) DNS is fully propagated. Do not add an A/AAAA record manually — the custom-domain route handles DNS when the zone is Cloudflare-managed.

**Execution note:** This unit is operational and not test-driven — it is a one-shot deploy validation. Treat it as the integration smoke test for Units 1–3.

**Test scenarios:**
- Integration: `curl -fsS https://dtpr.ai` returns HTTP 200 with HTML body containing the placeholder index copy and Docus default chrome (header, logo area, etc.).
- Integration: Response headers include `cf-ray` (confirms Cloudflare is serving) and `content-type: text/html`.
- Edge case: `curl -fsS https://dtpr.ai/some-missing-path` returns a Docus-rendered 404 page (not a Workers runtime error), confirming the SSR fallback is wired up.

**Verification:**
- `https://dtpr.ai` serves the placeholder site over TLS.
- The `dtpr-ai` Worker appears in the CF account's Workers & Pages list with the custom-domain route bound.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `dtpr.ai` zone not yet on Cloudflare — deploy succeeds but route binding fails silently | Unit 4 explicitly checks for zone presence and provides a remediation path; custom-domain route attaches automatically once zone is added. |
| Docus production build regresses on Cloudflare (as happened twice in `docs-site/` history) | Mirror the `agents/mcp` rollup stub and the `NODE_OPTIONS=--max-old-space-size=4096` build flag verbatim from `docs-site/` — both fixes are inherited, not re-invented. |
| `dtpr-ai` Worker name already exists in the CF account | Unit 4 checks the Workers list before first deploy; rename to `dtpr-ai-site` or similar if collision occurs (update `name` in `wrangler.toml` only). |
| Placeholder content misleadingly implies the site is "live" to external observers | Placeholder copy should state this is an early placeholder for a forthcoming DTPR-for-AI surface. Keep it one short paragraph so the replacement pass is frictionless. |

## Documentation / Operational Notes

- No README for the new package in this scope — the `docs-site/` package does not have one either. If a README is added later, it should mirror whatever convention emerges for `docs-site/`.
- CI/CD for `dtpr-ai/` is deferred. The user can either enable Cloudflare Workers Builds in the CF dashboard (pointed at this repo, build command `pnpm --filter ./dtpr-ai build`, output `dtpr-ai/.output`) or add a GH Actions workflow modeled on `.github/workflows/api-deploy.yaml`. Flag this decision when content work begins.
- If the team later decides to retire this microsite and merge into `docs-site/`, the cutover is: add a Cloudflare redirect rule from `dtpr.ai/*` to `docs.dtpr.io/ai/*` (or similar), then remove the `dtpr.ai` route from `dtpr-ai/wrangler.toml` and delete the Worker.

## Sources & References

- Related code: `docs-site/package.json`, `docs-site/nuxt.config.ts`, `docs-site/wrangler.toml`, `docs-site/app.config.ts`, `pnpm-workspace.yaml`, root `package.json`.
- Related PRs: #263 ("Fix docs-site Cloudflare Workers build failure"), #264 ("Fix docs-site Cloudflare Workers deploy failure") — established the `agents/mcp` stub and the memory flag used here.
