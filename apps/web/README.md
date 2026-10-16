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

Worker `dtpr-website` on the `helpfulplaces` Cloudflare account
(`f978769622a3e15ad770688a80811aa8`), on the custom domain `dev.dtpr.io`.
Cloudflare Workers Builds deploys it: the Worker's Git connection points at
`helpful-places/dtpr` with root directory `apps/web`. `main` deploys to
production and other branches get preview versions; `nuxt.config.ts` reads
`WORKERS_CI_BRANCH` to leave Nuxt Studio out of preview builds.

`@nuxt/content` stores parsed content in D1 bound as `DB`, seeded from
`dump.<collection>.sql` in the deployed assets on first request (hence
`assets.binding: "ASSETS"`). Production uses `dtpr-web-content`; previews use
`dtpr-web-content-preview` so a branch's dump never overwrites production's.

## Nuxt Studio

`nuxt.config.ts` points Studio at `helpful-places/dtpr` with `rootDir: apps/web`,
so content edits commit to this monorepo's `main`. The editor needs the secrets
listed in `.env.example`: set them locally in `.env`, and in production with
`npx wrangler secret put <NAME>`. `STUDIO_GITHUB_TOKEN` must be a fine-grained
PAT with Contents read/write on `helpful-places/dtpr`.

## Dependencies

Nuxt and its modules are pinned to exact versions (the ones `dev.dtpr.io` ran
from the old repo). Caret ranges let pnpm pull a newer Nuxt and Vite, which
moves the shared Vite peer for every other workspace package. `@nuxt/icon` is
declared at `^2.5.0` because pnpm's hidden hoisted store otherwise hands
`@nuxt/ui` the 1.x copy that `app/` depends on.
