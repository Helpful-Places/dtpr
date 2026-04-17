# Nuxt Studio Setup Runbook (docs.dtpr.io)

Operational runbook for the Nuxt Studio editor at `https://docs.dtpr.io/_studio`. Maintainers use this to add/remove moderators, rotate credentials, and debug auth failures.

**Never commit real credentials, client IDs, account names, or email addresses to this file.** This repository is public — anything committed here is crawlable and cached forever. All sensitive and semi-sensitive values (OAuth client IDs, PAT owners, moderator lists, bot account names) live in the team password manager and in Cloudflare Workers secrets. Refer to the password-manager entry **"DTPR Nuxt Studio"** for the canonical values.

## How it fits together

Nuxt Studio runs on the `docs-site/` Nuxt app and writes edits directly back to this repo on branch `main`, rooted at `docs-site/`. Editors authenticate via one of two providers:

| Sign-in path | Moderator check | Commit authorship |
|---|---|---|
| **Google OAuth** | `STUDIO_GOOGLE_MODERATORS` | Shared bot PAT (`STUDIO_GITHUB_TOKEN`) |
| **GitHub OAuth** | `STUDIO_GITHUB_MODERATORS` | The signed-in user's own GitHub identity (OAuth token) |

Audit-trail implication: commits from Google-path editors are all attributed to the bot identity; commits from GitHub-path editors are attributed to the individual user. If you need per-editor attribution, require the GitHub path.

Studio commits land on `main` and trigger the existing Cloudflare Workers deploy. There is no staging branch.

## Google OAuth client

- **GCP project, client ID, client secret, project owner:** password manager ("DTPR Nuxt Studio" → Google OAuth section).
- **Redirect URIs registered:**
  - `http://localhost:3000/__nuxt_studio/auth/google` (dev)
  - `https://docs.dtpr.io/__nuxt_studio/auth/google` (prod)

## GitHub OAuth App

Two OAuth Apps owned by the `helpful-places` org — one for prod, one for dev. App names, client IDs, and client secrets live in the password manager ("DTPR Nuxt Studio" → GitHub OAuth section).

- **Prod callback URL:** `https://docs.dtpr.io/__nuxt_studio/auth/github`
- **Dev callback URL:** `http://localhost:3000/__nuxt_studio/auth/github`
- **Homepage URLs:** `https://docs.dtpr.io` (prod) / `http://localhost:3000` (dev)

GitHub OAuth Apps allow only one callback URL each, which is why we run two apps.

## GitHub bot PAT (Google-path commits only)

- **Bot account, token value, PAT owner:** password manager.
- **Token type:** fine-grained (not classic).
- **Repository scope:** `helpful-places/dtpr` only.
- **Permissions:** `Contents: Read and write` only — nothing else.
- **Expiration:** GitHub fine-grained PATs require an expiration (max 1 year). Set **90 days** at issuance and record the renewal date in the password-manager entry. A calendar reminder on that date is required — there is no automatic rotation.
- **Rotation cadence:** every 90 days; absolute maximum 1 year from issuance.

GitHub-OAuth-path commits do **not** use this PAT — they use the user's OAuth token. If this PAT expires, Google-path saves fail; GitHub-path saves keep working.

## Moderator list

One canonical comma-separated email list, stored in **two** Cloudflare secrets (Google + GitHub). **Both must stay in sync** — updating one without the other means a moderator can sign in via one provider but not the other.

The list itself is stored in the password manager entry. The current member count (as of the most recent rotation) is recorded there. **Do not commit email addresses to this repo.**

`STUDIO_GITHUB_MODERATORS` is technically optional for the module, but leaving it unset lets any GitHub user on the internet reach the editor UI. **We always set it.**

### Updating moderators (safe pattern)

Always set both secrets in the same shell session so they can't drift apart:

```sh
# Paste the full, updated comma-separated list here. No spaces.
MODS="alice@example.com,bob@example.com"
echo -n "$MODS" | pnpm -F dtpr-docs exec wrangler secret put STUDIO_GOOGLE_MODERATORS
echo -n "$MODS" | pnpm -F dtpr-docs exec wrangler secret put STUDIO_GITHUB_MODERATORS
# Then redeploy so the Worker picks up the new secrets.
```

For GitHub OAuth: list the primary email on each moderator's GitHub account. A user's `@users.noreply.github.com` address won't match a real address.

## Cloudflare Workers secrets (production)

All seven secrets are set on the `dtpr-docs` Worker. A redeploy is required after any secret change before it takes effect.

```sh
cd docs-site
pnpm exec wrangler secret put STUDIO_GOOGLE_CLIENT_ID
pnpm exec wrangler secret put STUDIO_GOOGLE_CLIENT_SECRET
pnpm exec wrangler secret put STUDIO_GOOGLE_MODERATORS
pnpm exec wrangler secret put STUDIO_GITHUB_CLIENT_ID
pnpm exec wrangler secret put STUDIO_GITHUB_CLIENT_SECRET
pnpm exec wrangler secret put STUDIO_GITHUB_MODERATORS
pnpm exec wrangler secret put STUDIO_GITHUB_TOKEN
```

Verify what's configured (values are not shown):

```sh
pnpm exec wrangler secret list
```

Use the **prod** GitHub OAuth App credentials for `STUDIO_GITHUB_CLIENT_ID`/`_SECRET` (not the dev app's).

## Local dev setup

1. Copy `docs-site/.env.example` to `docs-site/.env`.
2. Fill in real values from the password manager. `.env` is gitignored.
3. Start the dev server: `pnpm -F dtpr-docs dev`.
4. Open `http://localhost:3000/_studio`. Both "Sign in with Google" and "Sign in with GitHub" buttons should appear.

`nuxt dev` reads `.env` automatically. Nuxt does **not** read `.dev.vars` — that file is a `wrangler dev` convention for locally running the production Workers build, which we rarely need. If you do need `wrangler dev` (e.g., to test Workers-specific behavior), copy the same values to `docs-site/.dev.vars` (also gitignored).

Any test commits made from local dev land on `main` the same way production commits do. Prefer using a sandbox file (or immediately reverting) when testing.

## Troubleshooting

**Editor won't load / blank page at `/_studio`**
- Check browser devtools network tab for `/__nuxt_studio/*` requests.
- 500s on `/__nuxt_studio/*` usually mean a missing env var. In dev, check `.env`; in prod, `pnpm exec wrangler secret list`.
- Check the Cloudflare Workers deploy logs for module init errors.

**One provider works but the other doesn't**
- Most common: that provider's `CLIENT_ID`/`CLIENT_SECRET`/redirect URI is misconfigured.
- Compare the redirect URI in the OAuth app exactly against `http(s)://<host>/__nuxt_studio/auth/<provider>`.
- Verify the other provider's three secrets are set (`wrangler secret list`).

**"You are not a moderator" despite being on the list**
- Check for typos in the moderator list (extra spaces, wrong domain).
- For GitHub OAuth: confirm the user's primary email on GitHub matches the list. A `@users.noreply.github.com` email won't match if we listed their real email.
- Confirm both `STUDIO_GOOGLE_MODERATORS` and `STUDIO_GITHUB_MODERATORS` were updated on the last moderator change.

**Commits not appearing after save**
- If Google-path: likely PAT expired or scope is wrong. Check PAT expiration in the password manager; re-verify `Contents: Read and write` on `helpful-places/dtpr`.
- If GitHub-path: the user's OAuth token may be missing repo scope. They can re-sign-in to refresh consent.
- Check the GitHub repo's audit log for blocked push events (branch protection, required reviews).

**Commit authored by the wrong identity**
- This is expected, not a bug: Google-path commits are authored by the bot PAT identity; GitHub-path commits by the signed-in user. If you want user attribution, sign in with GitHub instead of Google.

**Production deploy fails after adding Studio**
- See earlier commit `d7e619a Fix docs-site Cloudflare Workers deploy failure` for context on Workers fragility.
- Confirm `nuxt-studio` is at `>=1.6.0` (earlier versions break on Workers due to `ipx`/`sharp-wasm32`).
- Roll back by reverting the most recent merge to `main` and redeploying.
