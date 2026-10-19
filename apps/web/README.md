# dtpr-web

The DTPR website refresh, served at <https://dev.dtpr.io> while it matures into
a replacement for [`app/`](../../app). Moved here from
[Helpful-Places/DTPR-Website-Refresh](https://github.com/Helpful-Places/DTPR-Website-Refresh)
at commit `5a574fb`; that repo is retired and this directory is the source of truth.

Nuxt 4 + `@nuxt/content` v3 + `@nuxt/ui` v4, edited through Nuxt Studio, deployed
as a Cloudflare Worker. Product, design, and domain notes live in
[`PRODUCT.md`](PRODUCT.md), [`DESIGN.md`](DESIGN.md), [`CONTEXT.md`](CONTEXT.md),
and [`docs/adr`](docs/adr).

## Commands

From the repo root:

```bash
pnpm dev:web       # nuxt dev on http://localhost:3000
pnpm build:web     # production build (cloudflare-module preset)
pnpm deploy:web    # wrangler deploy — build first
```

## Deployment

Worker `dtpr-web` on the `helpfulplaces` Cloudflare account
(`f978769622a3e15ad770688a80811aa8`), on the custom domain `dev.dtpr.io`. The
`dtpr-website` Worker that served the site from the old repo is retired; a
deploy under that name would move `dev.dtpr.io` back to it.
Cloudflare Workers Builds deploys it: the Worker's Git connection points at
`helpful-places/dtpr` with root directory `apps/web`. `main` deploys to
production and other branches get [Previews](https://developers.cloudflare.com/workers/previews/)
at `<branch>-dtpr-web.<subdomain>.workers.dev`; `nuxt.config.ts` reads
`WORKERS_CI_BRANCH` to build Nuxt Studio into the `content` Preview only.

`@nuxt/content` stores parsed content in D1 bound as `DB`, seeded from
`dump.<collection>.sql` in the deployed assets on first request (hence
`assets.binding: "ASSETS"`). Production uses `dtpr-web-content`; previews use
`dtpr-web-content-preview` so a branch's dump never overwrites production's.

## Nuxt Studio

Editors never commit to `main`. `nuxt.config.ts` points Studio at
`helpful-places/dtpr` with `rootDir: apps/web` and `branch: content`, and
builds Studio only into the `content` branch's Preview, so the editor lives at
`https://content-dtpr-web.<subdomain>.workers.dev/_studio` and shows the content
it commits on top of. Production (dev.dtpr.io) and other Previews are read-only.

1. An editor publishes in Studio, which commits to `content`.
2. Workers Builds rebuilds the `content` Preview with the edit.
3. [`web-content-pr.yaml`](../../.github/workflows/web-content-pr.yaml) opens a
   PR from `content` into `main` if none is open; later edits join that PR.
4. A maintainer reviews the PR and the Preview, then merges, and `main` deploys
   to production. On every push to `main` the same workflow merges `main` back
   into `content`; if that conflicts, resolve it by hand on `content`.

`main`'s branch protection requires a reviewed PR, but admins can bypass it.
Studio commits as the bot PAT's owner (Google sign-in) or as the signed-in
GitHub user, so keep that PAT's owner off the admin bypass, or turn on "Do not
allow bypassing the above settings", if `main` should be unreachable from Studio.

The editor needs the secrets listed in `.env.example`: set them locally in
`.env`, and on the `content` Preview, not on production or the Base
configuration. Previews don't inherit production's secrets, and secrets can't be
read back, so set each one from `apps/web` (wrangler isn't installed at the root):
`pnpm exec wrangler preview secret put <NAME> --name content --profile helpfulplaces`,
or all at once with `preview secret bulk <file>`.
`STUDIO_GITHUB_TOKEN` must be a fine-grained PAT with Contents read/write on
`helpful-places/dtpr`. The GitHub and Google OAuth apps redirect to the host
Studio runs on, so their callback URLs are
`https://content-dtpr-web.<subdomain>.workers.dev/__nuxt_studio/auth/github` and
`.../__nuxt_studio/auth/google`.

## Dependencies

Nuxt and its modules are pinned to exact versions (the ones `dev.dtpr.io` ran
from the old repo). Caret ranges let pnpm pull a newer Nuxt and Vite, which
moves the shared Vite peer for every other workspace package. `@nuxt/icon` is
declared at `^2.5.0` because pnpm's hidden hoisted store otherwise hands
`@nuxt/ui` the 1.x copy that `app/` depends on.
