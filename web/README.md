# dtpr-web

Candidate replacement for [`app/`](../app). Vendored from
[Helpful-Places/DTPR-Website-Refresh](https://github.com/Helpful-Places/DTPR-Website-Refresh)
(the prototyping repo) at commit `a64717c`, then wired into this monorepo.

Nuxt 4 + `@nuxt/content` v3 + `@nuxt/ui` v4, edited through Nuxt Studio, deployed
as a Cloudflare Worker.

## Commands

From the repo root:

```bash
pnpm dev:web       # nuxt dev on http://localhost:3000
pnpm build:web     # production build (Cloudflare preset)
pnpm deploy:web    # wrangler deploy — build first
```

## Deployment

Worker `dtpr-web` on the `helpfulplaces` Cloudflare account
(`f978769622a3e15ad770688a80811aa8`), currently on the workers.dev subdomain:
<https://dtpr-web.it-admin-f97.workers.dev>. No custom domain yet — add a
`routes` entry with `custom_domain: true` in `wrangler.jsonc` when it takes over
a hostname from `app/`.

`@nuxt/content` stores its parsed content in D1 (`dtpr-web-content`, bound as
`DB`) and seeds it from `dump.<collection>.sql` in the deployed assets on first
request, which is why `wrangler.jsonc` also declares `assets.binding: "ASSETS"`.

## Nuxt Studio

`nuxt.config.ts` points Studio at `helpful-places/dtpr` with `rootDir: web`, so
edits commit into this monorepo rather than back to the prototyping repo. The
editor UI needs the `STUDIO_*` secrets in `.env.example` — set locally in `.env`,
and in production via `npx wrangler secret put <NAME>`. Until those are set,
Studio is unavailable but the site renders normally.

## Local deltas from upstream

Re-apply these when syncing from the prototyping repo:

- `package.json` — name `dtpr-web`, monorepo scripts, `@nuxt/icon` pinned to
  `^2.5.0` (pnpm's hoisted store otherwise leaks `1.15.0` from `app/`),
  `@tailwindcss/vite` declared (`nuxt.config.ts` imports it), `wrangler` devDep.
- `nuxt.config.ts` — Studio repo pointer, `compatibilityDate: '2025-01-01'`.
- `wrangler.jsonc` — not in upstream.
- Deleted `app/pages/taxonomy.vue` (empty file, fails the SFC compiler) and
  `app/pages/[...slug].vue` (queries a `content` collection that
  `content.config.ts` doesn't define; hung the worker on every unmatched URL).
