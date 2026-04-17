---
title: Add Nuxt Studio to docs-site with Google + GitHub OAuth
type: feat
status: active
date: 2026-04-17
---

# Add Nuxt Studio to docs-site with Google + GitHub OAuth

## Overview

Install the self-hosted `nuxt-studio` module on `docs-site/` so a small internal team can edit content at `docs.dtpr.io` through a visual editor. Enable **both Google OAuth and GitHub OAuth** as editor login options — developers who already have GitHub accounts use GitHub (commits authored by them), while non-technical editors use Google (commits authored by a shared bot PAT). Both providers gate UI access with an explicit moderator email whitelist.

## Problem Frame

Nuxt Studio is **not currently set up** on `docs-site/` — verified by inspecting `docs-site/package.json`, `docs-site/nuxt.config.ts`, `docs-site/app.config.ts`, and searching for any `@nuxthq/studio`/`nuxt-studio`/`studio` references in `docs-site/`. (The `studio/` directory at the repo root is a separate symbol-generation app, unrelated to Nuxt Studio.)

Content lives in `docs-site/content/` as markdown. Today the only way to edit pages is to open a PR against `helpful-places/dtpr` on GitHub. The DTPR team wants a web-based editor that doesn't require editors to create GitHub accounts. A small internal team (<10 known emails) needs access.

## Requirements Trace

- R1. Install and configure `nuxt-studio` in `docs-site/` so the editor loads at `/_studio` in dev and production.
- R2. Offer **two** editor login options — **Google OAuth** (for non-technical editors; no GitHub account required) and **GitHub OAuth** (for developer editors; commits authored by them). Both providers must be gated by a moderator email whitelist so the UI is not open to the public.
- R3. Studio must commit edits back to the `helpful-places/dtpr` repo on branch `main`, rooted at `docs-site/`. Google-path commits go through a single bot GitHub PAT; GitHub-OAuth-path commits go through the signed-in user's own OAuth token.
- R4. Deploy must continue to succeed on Cloudflare Workers (current preset, current custom domain, current D1 binding).
- R5. Document the operational setup (Google Cloud OAuth client, GitHub OAuth App, GitHub bot PAT, Cloudflare Workers secrets) so the team can rotate credentials and add moderators later.

## Scope Boundaries

- Editor UX customization (custom field editors, validation rules) — out of scope; use Studio defaults.
- Internationalization / per-locale content collections — out of scope; the old `docs/plans/2026-02-06-feat-cms-editable-markdown-pages-plan.md` covered that for a different app directory and is orthogonal to this work.
- Migrating existing content structure — out of scope. Content already lives in `docs-site/content/` in the shape Studio expects.
- Adding additional auth providers (GitLab, Nuxt Studio SSO) — out of scope. Google OAuth is the chosen provider.
- Per-editor audit logs / role-based permissions — Studio treats every moderator equally; if richer RBAC is needed, handle in a follow-up.
- Changes to the separate `studio/` symbol-generation app — unrelated to this plan.

### Deferred to Separate Tasks

- Expanding moderator list for community contributors — this plan scopes to the internal team only.
- Switching to custom auth (email/password, Clerk, etc.) — keep Google OAuth as the starting point; revisit only if it proves insufficient.

## Context & Research

### Relevant Code and Patterns

- `docs-site/nuxt.config.ts` — currently `extends: ['docus']` with a Cloudflare-specific rollup stub for `agents/mcp` under `$production`. The `studio` config block will live here.
- `docs-site/wrangler.toml` — Cloudflare Workers config with custom domain `docs.dtpr.io` and D1 binding. No env vars set today; secrets will be added via `wrangler secret put`.
- `docs-site/package.json` — Nuxt 4 + `docus@latest` + `@nuxt/ui@^4.5.1`. Studio is additive here.
- `docs-site/app.config.ts` — already declares `github.url`, `github.branch`, `github.rootDir` for docs — useful reference for the Studio `repository` fields but they are distinct config and don't carry over automatically.
- `docs-site/content/` — flat-ish folder tree (e.g. `1.getting-started/1.introduction.md`) using standard Nuxt Content frontmatter + markdown, which Studio's MDC editor handles natively.
- `.github/workflows/` and `docs-site` CI — previous commits (`d7e619a`, `ca22ebd`) show recent Cloudflare Workers build fixes; Studio's Cloudflare compatibility is handled at the module version level (see Key Decisions).

### Institutional Learnings

- Previous plan `docs/plans/2026-02-06-feat-cms-editable-markdown-pages-plan.md` assumed Nuxt Studio would be set up later and called it out as "Future work: Studio production config". This plan delivers that for the new `docs-site/` app.
- Recent commits show active Cloudflare Workers deploy fragility (`d7e619a Fix docs-site Cloudflare Workers deploy failure`) — treat deploy verification as a first-class acceptance gate, not an afterthought.

### External References

- [Nuxt Studio setup](https://nuxt.studio/setup) — current install command is `npx nuxt module add nuxt-studio`; legacy `@nuxthq/studio` is deprecated.
- [Nuxt Studio auth providers](https://nuxt.studio/auth-providers) — Google OAuth env vars and moderator whitelist mechanics.
- [Nuxt Studio git providers](https://nuxt.studio/git-providers) — bot PAT requirements and `studio.repository` schema.
- [nuxt-content/nuxt-studio PR #404](https://github.com/nuxt-content/nuxt-studio/pull/404) — `ipx` moved to `optionalDependencies` in v1.6.0 (2026-04-09), fixing Cloudflare Workers `@img/sharp-wasm32/versions` build failure. Media thumbnails fall back to full-size originals on Workers — acceptable for a docs site.
- [Docus v5 + Studio](https://docus.dev/en/getting-started/studio) — Docus does **not** auto-enable Studio; it must be added explicitly. Docus' MDC components render in the Studio editor.
- [Nuxt Content v3 on Cloudflare Workers](https://content.nuxt.com/docs/deploy/cloudflare-workers) — confirms the current deploy preset is the right one.

## Key Technical Decisions

- **Module: `nuxt-studio` pinned `>=1.6.0`** — v1.6.0 is the first release that builds on Cloudflare Workers (ipx is optional). Pin with `^1.6.0` to allow non-breaking upgrades.
- **Auth: enable both Google OAuth and GitHub OAuth simultaneously** — Studio fully supports multi-provider setups, each with its own callback path (`/__nuxt_studio/auth/google` and `/__nuxt_studio/auth/github`). The docs explicitly endorse this pattern: *"use GitHub OAuth for developers and Google OAuth for non-technical content editors."*
- **Moderator whitelist on BOTH providers** — `STUDIO_GOOGLE_MODERATORS` is **required** by Studio ("Without moderators, no one can access Studio"). `STUDIO_GITHUB_MODERATORS` is technically optional, **but we set it anyway** — without it, any GitHub user on the internet who completes OAuth can reach the Studio UI. The same comma-separated email list is used for both env vars.
- **Commit authorship differs by login path:**
  - *Google OAuth login* → commits authored by the shared bot PAT (`STUDIO_GITHUB_TOKEN`).
  - *GitHub OAuth login* → commits authored by the signed-in user's own GitHub identity via their OAuth token; the bot PAT is not used.
  - This is fine for an internal team, but note the audit-trail split in the runbook.
- **Bot PAT: one GitHub fine-grained PAT** scoped to `helpful-places/dtpr` with `Contents: Read and write`. Stored as `STUDIO_GITHUB_TOKEN`. Used only for Google-path commits.
- **Repository config in `nuxt.config.ts`** — set `studio.repository` explicitly (provider, owner, repo, branch, rootDir). Auto-detection exists but is brittle on Cloudflare Workers; explicit config is more durable.
  - `rootDir: 'docs-site'` — Studio only writes inside this subtree, matching the existing repo layout.
  - `branch: 'main'` — matches the live deploy branch.
- **Editor route: default `/_studio`** — no reason to relocate for a small internal team.
- **Callback URLs (Studio defaults):** `/__nuxt_studio/auth/google` and `/__nuxt_studio/auth/github`. Register the dev (`http://localhost:3000/...`) and prod (`https://docs.dtpr.io/...`) URIs for each in the respective OAuth app.
- **Secret management: `wrangler secret put` for production, `docs-site/.dev.vars` (gitignored) for local dev** — matches the standard Cloudflare Workers pattern and avoids committing secrets. No new Nuxt runtime-config plumbing is needed; Studio reads these env vars directly.
- **Dev-only first, then production** — land dev-mode editing first and validate locally before flipping production on. Minimizes blast radius if Workers-specific issues surface.
- **No session-secret env var configured** — the Studio docs do not document a `STUDIO_SECRET`-style variable, and the module manages sessions internally. If one is required later, we'll add it when the module surfaces the requirement.

## Open Questions

### Resolved During Planning

- **Which auth provider(s)?** → Google OAuth **and** GitHub OAuth, both enabled simultaneously with a shared moderator whitelist (user-confirmed).
- **Who gets access?** → Small internal team, <10 known emails (user-confirmed). Collect the actual address list from the team lead during Unit 2.
- **Does GitHub OAuth need its own moderator list?** → Yes, we set one. Omitting `STUDIO_GITHUB_MODERATORS` would let any GitHub user sign in to the editor UI; push authorization still happens via OAuth scopes, but we don't want random GitHub users inside our editor at all.
- **Is Nuxt Studio already installed?** → No — confirmed by inspection of `docs-site/` contents and `grep`.
- **Should Studio write to a separate branch?** → No — write to `main` for now (matches current content editing flow). Revisit if editor velocity warrants a staging/preview branch.
- **Does Docus auto-include Studio?** → No — must add `nuxt-studio` to `modules` explicitly.

### Deferred to Implementation

- **Exact Google Cloud project to use** — whether to reuse an existing Helpful Places GCP project or create a new one (`dtpr-docs-studio`). Decide during Unit 2 based on who owns the DNS/org.
- **GitHub OAuth App owner** — organization-level OAuth App on `helpful-places` (preferred, survives personnel changes) vs. a maintainer's personal GitHub. Decide during Unit 2 based on org admin availability.
- **Bot account identity for the GitHub PAT** — whether to use a personal account, a machine user, or a GitHub App. For <10 internal editors, a fine-grained PAT on an existing maintainer account is the simplest choice, but the team may prefer a dedicated `dtpr-bot` machine user. Decide during Unit 3.
- **PAT rotation cadence** — fine-grained PATs expire at most 1 year out. Document the rotation owner and renewal date during Unit 5 documentation.

## Implementation Units

- [ ] **Unit 1: Install `nuxt-studio` module and wire up repository config**

**Goal:** Add the module to `docs-site/`, declare the `studio.repository` block in `nuxt.config.ts`, and confirm the editor route loads (unauthenticated) in dev.

**Requirements:** R1, R4

**Dependencies:** None

**Files:**
- Modify: `docs-site/package.json` (add `nuxt-studio` to dependencies — pin `^1.6.0`)
- Modify: `docs-site/nuxt.config.ts` (add `modules: ['nuxt-studio']` and a `studio` block)
- Modify: `pnpm-lock.yaml` (lockfile update from `pnpm install`)

**Approach:**
- Use `pnpm -F dtpr-docs add nuxt-studio@^1.6.0` so the workspace scoping stays correct (the repo has a `pnpm-workspace.yaml`).
- In `nuxt.config.ts`, add `modules: ['nuxt-studio']` and a `studio` object with `repository: { provider: 'github', owner: 'helpful-places', repo: 'dtpr', branch: 'main', rootDir: 'docs-site' }`.
- Leave the existing `$production` cloudflare-module rollup config and `extends: ['docus']` untouched. Studio is additive.
- Do not hardcode any secrets in `nuxt.config.ts`; everything sensitive reads from env.

**Patterns to follow:**
- Existing `$production` block in `docs-site/nuxt.config.ts` is the reference for Cloudflare-specific config shape.
- `docs-site/app.config.ts` already has a `github` block — note that it is **separate** from `studio.repository` and both should exist side-by-side.

**Test scenarios:**
- Happy path — Run `pnpm -F dtpr-docs dev`, open `http://localhost:3000/_studio` in a browser → editor shell loads, prompts for login. Studio UI chrome renders.
- Happy path — Run `pnpm -F dtpr-docs build` → build succeeds with no `@img/sharp-wasm32/versions` or `ipx` resolution errors, confirming the v1.6.0 pin is working under the Cloudflare preset.
- Edge case — Open `http://localhost:3000/` (a regular docs page) → site still renders normally. Adding Studio does not break the public site.

**Verification:**
- `pnpm-lock.yaml` diff shows exactly one new root dependency (`nuxt-studio`) plus its transitive graph; no duplicated or downgraded packages.
- `pnpm -F dtpr-docs build` output contains no Workers-incompatible module warnings.

- [ ] **Unit 2: Create Google + GitHub OAuth apps and define the shared moderator list**

**Goal:** Produce a Google OAuth 2.0 client and a GitHub OAuth App, both configured for Studio's callback URLs, and lock in the shared moderator email whitelist. No code changes in this unit — this is environment setup plus documentation capture.

**Requirements:** R2, R5

**Dependencies:** Unit 1 (need the callback URL shape confirmed)

**Files:**
- Create: `docs-site/docs/studio-setup.md` (internal setup runbook — see Unit 5 for full content; Unit 2 adds the Google + GitHub OAuth sections)

**Approach:**
- **Google OAuth:** In Google Cloud Console, create or reuse a project, enable the OAuth 2.0 Web Application client, and register both redirect URIs:
  - `http://localhost:3000/__nuxt_studio/auth/google` (dev)
  - `https://docs.dtpr.io/__nuxt_studio/auth/google` (prod)
- **GitHub OAuth App:** Under the `helpful-places` GitHub org settings (preferred) — or a maintainer's personal account if org admin isn't available — create a new OAuth App with:
  - Homepage URL: `https://docs.dtpr.io`
  - Dev callback: `http://localhost:3000/__nuxt_studio/auth/github`
  - Prod callback: `https://docs.dtpr.io/__nuxt_studio/auth/github`
  - (If GitHub's UI requires a single callback field, register the prod URL and use a second OAuth App for dev. The docs don't specify current GitHub OAuth App capabilities — decide at creation time.)
- Capture `client_id` + `client_secret` for each provider. Store all four values in the team password manager; they'll feed `.dev.vars` in Unit 4 and Cloudflare Workers secrets in Unit 6.
- Confirm the final moderator email list with the team lead (<10 addresses). The **same** list is used for both `STUDIO_GOOGLE_MODERATORS` and `STUDIO_GITHUB_MODERATORS`.
- Record the GCP project ID, Google client ID, GitHub OAuth App name/ID, and all redirect URIs in `docs-site/docs/studio-setup.md`. Client secrets and the moderator list live only in the secret store.

**Patterns to follow:**
- No existing code pattern — first OAuth integrations in this repo.

**Test scenarios:**
- Test expectation: none — this is external service configuration. Functional proof comes in Unit 4 (first successful login via each provider).

**Verification:**
- Google OAuth client is listed in GCP Console with both redirect URIs visible.
- GitHub OAuth App is listed under the owning org/account with the correct callback URL(s).
- All four credentials are captured in the team password manager (nothing committed).
- Moderator list is confirmed in writing with the team lead and is identical for both providers.

- [ ] **Unit 3: Create and scope the GitHub bot PAT**

**Goal:** Issue a fine-grained Personal Access Token that Studio will use to commit edits back to `helpful-places/dtpr` **when a user has signed in via Google OAuth**. Users who sign in via GitHub OAuth commit under their own identity and don't use this PAT.

**Requirements:** R3, R5

**Dependencies:** None (can run in parallel with Unit 2)

**Files:**
- Modify: `docs-site/docs/studio-setup.md` (append GitHub PAT section once created — see Unit 5)

**Approach:**
- Decide bot identity with the team: personal maintainer PAT vs. dedicated `dtpr-bot` machine user. Default to a dedicated machine user if the team already has one; otherwise start with a maintainer PAT and migrate later.
- Create a **fine-grained** PAT (not classic) scoped to **only** `helpful-places/dtpr`, with `Contents: Read and write` and nothing else.
- Set expiration to the team's rotation standard (recommend 90 days for fine-grained tokens; at most 1 year).
- Store as `STUDIO_GITHUB_TOKEN` — record the expiration date and owner in `docs-site/docs/studio-setup.md`.

**Patterns to follow:**
- No existing PAT-based integrations in this repo to mirror.

**Test scenarios:**
- Test expectation: none — token validity is proven by Unit 4's end-to-end edit-and-commit flow. Unit 6 re-verifies in production.

**Verification:**
- Token is scoped only to `helpful-places/dtpr` (confirmed in the PAT's repository-access setting).
- Token is stored in the team password manager with its expiration date noted.

- [ ] **Unit 4: Wire secrets for local dev and prove BOTH login + edit flows**

**Goal:** Configure local env vars so Studio works end-to-end on `localhost:3000` for both providers: a Google moderator can edit (bot-authored commit), a GitHub OAuth moderator can edit (user-authored commit), and non-moderators are rejected on both paths.

**Requirements:** R1, R2, R3

**Dependencies:** Units 1, 2, 3

**Files:**
- Create: `docs-site/.dev.vars` (gitignored — local-only env file consumed by wrangler dev)
- Modify: `docs-site/.gitignore` (ensure `.dev.vars` is ignored — check current state; add if missing)

**Approach:**
- Populate `docs-site/.dev.vars` with all six vars:
  - `STUDIO_GOOGLE_CLIENT_ID`, `STUDIO_GOOGLE_CLIENT_SECRET`, `STUDIO_GOOGLE_MODERATORS`
  - `STUDIO_GITHUB_CLIENT_ID`, `STUDIO_GITHUB_CLIENT_SECRET`, `STUDIO_GITHUB_MODERATORS` (same list as Google)
  - `STUDIO_GITHUB_TOKEN` (bot PAT, used by Google-path only)
- Start dev server. Visit `/_studio` — both "Sign in with Google" and "Sign in with GitHub" buttons should be visible.
- **Google path test:** sign in with a whitelisted Google address. Make a one-character edit to `docs-site/content/1.getting-started/1.introduction.md`, save, confirm commit on `main` authored by the **bot** identity.
- **GitHub path test:** sign out, sign in with a whitelisted GitHub account. Make another one-character edit, save, confirm commit on `main` authored by the **signed-in user's** GitHub identity (not the bot).
- Revert test edits via Studio saves (keeps history clean) or squash-revert locally.
- **Rejection tests:** confirm a non-whitelisted Google account is rejected, and a non-whitelisted GitHub account is rejected.

**Patterns to follow:**
- Cloudflare Workers projects in this repo (`api/`, `studio/`) already use the wrangler secrets pattern for production; `.dev.vars` is the conventional local counterpart.

**Test scenarios:**
- Happy path (Google) — Moderator signs in with Google → editor renders; edit + save produces a commit on `main` authored by the bot PAT identity. Verifies `STUDIO_GOOGLE_CLIENT_ID/SECRET`, `STUDIO_GOOGLE_MODERATORS`, `STUDIO_GITHUB_TOKEN`, and `studio.repository` end-to-end.
- Happy path (GitHub) — Moderator signs in with GitHub → editor renders; edit + save produces a commit on `main` authored by **the signed-in user's** GitHub identity (not the bot). Verifies `STUDIO_GITHUB_CLIENT_ID/SECRET`, `STUDIO_GITHUB_MODERATORS`, and the OAuth-scope commit path.
- Happy path (multi-provider UI) — The `/_studio` login screen shows both buttons; each routes to its own callback path without collision.
- Error path (Google whitelist) — Non-whitelisted Google account is rejected at login. **Blocking check** — must pass before production rollout.
- Error path (GitHub whitelist) — Non-whitelisted GitHub account is rejected at login. **Blocking check** — without this, any GitHub user on the internet could reach the editor UI.
- Edge case — Remove one of the seven env vars and re-run `pnpm -F dtpr-docs dev` → Studio surfaces a clear configuration error on `/_studio`, not a silent 500. (If unclear, that's a documentation signal for Unit 5, not a blocker.)

**Verification:**
- One Google-path test commit on `main` authored by the bot; one GitHub-path test commit on `main` authored by the signed-in user.
- Both non-moderator rejections confirmed.
- `docs-site/.dev.vars` is confirmed gitignored (via `git check-ignore docs-site/.dev.vars`).

- [ ] **Unit 5: Document the setup and operational runbook**

**Goal:** Leave a runbook future maintainers can follow to add moderators, rotate credentials, and debug Studio auth failures.

**Requirements:** R5

**Dependencies:** Units 2, 3, 4 (need the real configured values and the proven flow)

**Files:**
- Create: `docs-site/docs/studio-setup.md` (if Units 2/3 haven't started it already) — single runbook with sections:
  - Overview of how editor auth + git writes fit together (Google path → bot PAT; GitHub path → user's OAuth token; audit-trail implication)
  - Google OAuth client details (project, client ID, redirect URIs, who owns it)
  - GitHub OAuth App details (org or owner, app name, client ID, redirect URIs)
  - GitHub bot PAT details (owner, scope, expiration, rotation cadence — used for Google-path commits only)
  - Moderator list management (single canonical list used for both `STUDIO_GOOGLE_MODERATORS` and `STUDIO_GITHUB_MODERATORS`; how to add/remove; reminder to update BOTH secrets)
  - Cloudflare Workers secrets (all seven names + `wrangler secret put` commands; do **not** record values)
  - Local dev setup (what goes in `.dev.vars`)
  - Troubleshooting: "editor won't load", "one provider works but the other doesn't", "login rejected despite being on the list", "commits not appearing", "commit authored by wrong identity"

**Approach:**
- Record only non-secret metadata in the doc (names, IDs, expirations, owners). Secrets live in the password manager and Cloudflare Workers, never in the repo.
- Link from `docs-site/README.md` or the repo-root `README.md` if there's a natural spot, so maintainers discover it.

**Patterns to follow:**
- Existing `README.md` at repo root and `docs/` conventions.

**Test scenarios:**
- Test expectation: none — this is documentation. Sanity-check it by having a second team member read through without prior context and confirm they could execute a moderator add and a PAT rotation from the doc alone.

**Verification:**
- All non-secret config is captured; no secret values appear in the committed file.
- Document is reachable from at least one existing README.

- [ ] **Unit 6: Configure production secrets on Cloudflare Workers and verify live editing**

**Goal:** Promote the proven dev setup to production — secrets live in Cloudflare Workers, a moderator can sign in at `https://docs.dtpr.io/_studio` and commit an edit to `main` via the bot.

**Requirements:** R1, R2, R3, R4

**Dependencies:** Units 1–5

**Files:**
- Modify: `docs-site/docs/studio-setup.md` (fill in the Cloudflare Workers secrets section after setting them)

**Approach:**
- From `docs-site/`, run `npx wrangler secret put` for each of the seven secrets:
  - `STUDIO_GOOGLE_CLIENT_ID`, `STUDIO_GOOGLE_CLIENT_SECRET`, `STUDIO_GOOGLE_MODERATORS`
  - `STUDIO_GITHUB_CLIENT_ID`, `STUDIO_GITHUB_CLIENT_SECRET`, `STUDIO_GITHUB_MODERATORS`
  - `STUDIO_GITHUB_TOKEN`
- Trigger a production deploy (whichever mechanism the repo currently uses — likely CI on merge to `main`, based on recent commits).
- Verify `/_studio` loads on `https://docs.dtpr.io/_studio` after deploy and shows both login buttons.
- Perform one moderator edit-and-save round-trip **per provider** on production, reverting each test change immediately.

**Patterns to follow:**
- Recent commit `d7e619a Fix docs-site Cloudflare Workers deploy failure` is a signal that Workers deploys have been fragile — keep a close eye on the post-deploy logs and be ready to roll back by reverting the merge if `/_studio` 500s.

**Test scenarios:**
- Happy path (Google) — Moderator signs in on `https://docs.dtpr.io/_studio` with Google and saves a trivial edit → commit appears on `main` authored by the bot, production redeploys, change is live within the normal deploy window.
- Happy path (GitHub) — Moderator signs in on production with GitHub and saves a trivial edit → commit authored by the signed-in user's GitHub identity, redeploys, change visible.
- Happy path — Regular visitors hitting `https://docs.dtpr.io/` see no regression. Homepage, any nested content page, and the existing D1-backed content still render correctly.
- Error path — Non-moderator rejection re-validated in production for **both** providers.
- Edge case — Studio's commit triggers the existing CI / deploy pipeline. Confirm the loop closes (commit → deploy → change visible) and that both authorship patterns (bot vs. user) are acceptable in the audit trail.

**Verification:**
- Production `/_studio` returns the editor shell with both login buttons.
- One Google-path and one GitHub-path round-trip commit are both visible on `main` with the expected authorship.
- Non-moderator rejection re-confirmed on production for both providers.
- No regression in `https://docs.dtpr.io/` normal browsing.

## System-Wide Impact

- **Interaction graph:** Studio adds a `/_studio` route (editor UI), a `/__nuxt_studio/*` API surface (auth + publish endpoints), and a git commit side-channel via the bot PAT. The public site routes are untouched.
- **Error propagation:** Misconfigured env vars should surface at `/_studio` load time (editor prompts a config error) rather than as a 500 on public routes. Confirm in Unit 4's edge-case scenario.
- **State lifecycle risks:** Studio writes directly to `main` with every save. No staging branch, no preview. That's acceptable for a small internal team but is the single biggest blast-radius risk; documented in the runbook.
- **API surface parity:** None — no public API is added or changed.
- **Integration coverage:** The most important integration point is "edit in Studio → commit appears on GitHub → deploy publishes to docs.dtpr.io". Verified end-to-end in Units 4 and 6; unit tests alone cannot prove this.
- **Unchanged invariants:** The `docus` theme, D1 content binding, Cloudflare `cloudflare-module` preset, custom domain routing, and the `agents/mcp` rollup stub all continue to work exactly as they do today. Studio is strictly additive.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `nuxt-studio` < 1.6.0 gets pulled in via a transitive resolution or a bad pin, breaking Workers build | Pin `^1.6.0`; Unit 1 includes a Workers build verification. Revisit if the module's range semantics change. |
| OAuth redirect URI mismatch (dev works, prod fails) for either provider | Register dev + prod redirect URIs up front in Unit 2 for **both** providers; Unit 6 validates each on production explicitly. |
| `STUDIO_GITHUB_MODERATORS` forgotten → any GitHub user on the internet can access the editor UI | Unit 4 includes an explicit **blocking** rejection test with a non-whitelisted GitHub account. Unit 6 re-runs the same test on production. |
| Moderator list drift — someone updates `STUDIO_GOOGLE_MODERATORS` but forgets `STUDIO_GITHUB_MODERATORS` (or vice versa) | Runbook documents that both must be updated together; consider a small shell helper in the runbook that sets both in one invocation. |
| PAT expires silently and Studio's Google-path saves start failing | Runbook (Unit 5) records expiration date + rotation owner. Note that GitHub-path saves are unaffected by PAT expiry — they use the user's OAuth token. |
| Editor accidentally commits a broken build to `main` | Small internal team + low volume makes this acceptable; mitigations (staging branch, required review) are deferred. |
| Someone adds a secret to the committed runbook by accident | Document explicitly says "never record values here"; `.gitignore` keeps `.dev.vars` out. |
| Cloudflare Workers cold-start or KV limits break Studio's session handling | Studio docs don't call out any Workers-specific session storage config; if issues appear, escalate to maintainers rather than patching blindly (per researcher's flagged unknown). |
| Docus theme upgrade changes MDC component contracts that Studio renders | Out of scope for this plan; watch Docus release notes in normal upgrade cycles. |

## Documentation / Operational Notes

- `docs-site/docs/studio-setup.md` is the canonical runbook — created in Unit 5, referenced from Units 2, 3, 4, 6.
- Moderator list is stored in **two** Cloudflare Workers secrets (`STUDIO_GOOGLE_MODERATORS` and `STUDIO_GITHUB_MODERATORS`). To add or remove a moderator, run `npx wrangler secret put` for BOTH secrets with the updated comma-separated list — they must stay in sync.
- PAT rotation is manual — the runbook records expiration and owner; the owning maintainer sets their own reminder. Only affects Google-path commits; GitHub-path users keep working during a PAT outage.
- After a secret change, a redeploy is required for Workers to pick it up.

## Sources & References

- [Nuxt Studio setup](https://nuxt.studio/setup)
- [Nuxt Studio auth providers](https://nuxt.studio/auth-providers)
- [Nuxt Studio git providers](https://nuxt.studio/git-providers)
- [nuxt-content/studio module repo](https://github.com/nuxt-content/studio)
- [PR #404 — ipx optional for Cloudflare Workers (v1.6.0)](https://github.com/nuxt-content/nuxt-studio/pull/404)
- [Nuxt Content v3 on Cloudflare Workers](https://content.nuxt.com/docs/deploy/cloudflare-workers)
- [Docus + Studio guide](https://docus.dev/en/getting-started/studio)
- Related plan (different app, orthogonal work): `docs/plans/2026-02-06-feat-cms-editable-markdown-pages-plan.md`
- Current config: `docs-site/nuxt.config.ts`, `docs-site/wrangler.toml`, `docs-site/app.config.ts`, `docs-site/package.json`
