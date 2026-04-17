# Preview deployments

Label-gated workflow that publishes a PR's schema content to `https://api-preview.dtpr.io` so reviewers can exercise in-flight taxonomy end-to-end before merging.

## What runs

`.github/workflows/api-preview-deploy.yaml` fires on `pull_request` `labeled` and `synchronize` events. Every job is additionally guarded by

```yaml
if: contains(github.event.pull_request.labels.*.name, 'schema:preview')
```

so an unlabeled PR cannot trigger a deploy even when new commits land on the branch.

On a labeled PR the workflow:

1. Installs pnpm dependencies and runs `typecheck` + `test` on the api workspace.
2. Builds the schema bundle via `pnpm --filter ./api schema:build "$SCHEMA_VERSION"` (`ai@2026-04-16-beta` today).
3. Deploys the worker to `dtpr-api-preview` with `wrangler deploy --env preview`.
4. Uploads the built bundle to the `dtpr-api-preview` R2 bucket via `scripts/r2-upload.ts` (same helper prod uses).
5. Smoke-tests `https://api-preview.dtpr.io/healthz` and asserts the response carries `X-Robots-Tag: noindex, nofollow`.

## Required secrets

Already named in `deploy-tokens.md`; populate these in GitHub Actions before the workflow can succeed:

| Secret | Scope |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Same as production. |
| `CLOUDFLARE_API_TOKEN_PREVIEW` | Account-level `Workers Scripts: Edit` + `Workers R2 Storage: Edit`; zone-level `Workers Routes: Edit` on `dtpr.io`. |
| `R2_ACCESS_KEY_ID_PREVIEW` / `R2_SECRET_ACCESS_KEY_PREVIEW` | R2 Object Read & Write scoped to bucket `dtpr-api-preview`. |

Rotate on the same quarterly cadence as the prod credentials.

## noindex

The preview Worker carries a `vars.ENVIRONMENT: "preview"` binding set in `wrangler.jsonc`'s `env.preview` block. The `noindex` middleware checks `c.env.ENVIRONMENT` at request time and adds `X-Robots-Tag: noindex, nofollow` to every preview response. Production does not set the var, so prod responses never carry the header.

## How to trigger and verify

1. Apply the `schema:preview` label to a PR that touches `api/schemas/` (or any change you want to exercise end-to-end).
2. The **API preview deploy** workflow runs. Confirm it succeeds in the PR's Checks tab.
3. Smoke-test from a terminal:

   ```bash
   curl -sI https://api-preview.dtpr.io/healthz | tr -d '\r' | grep -i x-robots-tag
   # x-robots-tag: noindex, nofollow

   curl -sI https://api-preview.dtpr.io/api/v2/schemas | tr -d '\r' | grep -iE 'content-hash|x-robots-tag'
   ```

4. Confirm the sibling prod host does *not* set the header:

   ```bash
   curl -sI https://api.dtpr.io/healthz | tr -d '\r' | grep -i x-robots-tag
   # (no output)
   ```

## Negative checks

- Open a PR without the label → the workflow should not create any deploy job runs.
- Remove the label from a PR → subsequent `synchronize` events should become no-ops.

## Related docs

- `api/docs/deploy-tokens.md` — token provisioning and rotation.
- `.github/workflows/api-deploy.yaml` — the production deploy this mirrors.
- `api/wrangler.jsonc` — `env.preview` block with bindings and the `ENVIRONMENT` var.
- `api/src/middleware/noindex.ts` — the middleware that reads `ENVIRONMENT` at request time.
