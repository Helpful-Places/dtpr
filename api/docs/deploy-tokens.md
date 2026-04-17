# Deploy tokens

The CI pipeline (`.github/workflows/api-deploy.yaml`) needs two distinct credential types per environment, six secrets total. All live as GitHub Actions repository secrets on `Helpful-Places/dtpr`.

## Account ID

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | `f978769622a3e15ad770688a80811aa8` |

## Cloudflare API tokens (used by `wrangler deploy`)

Create at <https://dash.cloudflare.com/profile/api-tokens> → **Create Token** → **Custom token**.

### `CLOUDFLARE_API_TOKEN_PROD`

| Permission | Resource |
| --- | --- |
| Account → Workers Scripts → **Edit** | Specific account `It-admin@helpfulplaces.com's Account` |
| Account → Workers R2 Storage → **Edit** | Specific account `It-admin@helpfulplaces.com's Account` |
| Zone → Workers Routes → **Edit** | Specific zone `dtpr.io` (needed for custom domain attach) |

> Cloudflare API tokens cannot scope `Workers Scripts: Edit` to a single Worker name; account-level scope is the tightest available today. Mitigate by isolating credentials per environment (prod token cannot edit preview Workers because it's a separate token, even though both have account-wide scope on paper — keep prod and preview as separate tokens so a leak only burns one environment).

### `CLOUDFLARE_API_TOKEN_PREVIEW`

Same permissions as above, separate token. Used by the preview deploy workflow (Unit 15).

## R2 S3 access keys (used by `scripts/r2-upload.ts`)

Create at <https://dash.cloudflare.com/?to=/:account/r2/api-tokens> → **Manage R2 API Tokens** → **Create API token** → choose **Object Read & Write**.

### `R2_ACCESS_KEY_ID_PROD` / `R2_SECRET_ACCESS_KEY_PROD`

- TTL: longest available
- Permissions: **Object Read & Write**
- Bucket scope: **Apply to specific buckets only** → `dtpr-api`

### `R2_ACCESS_KEY_ID_PREVIEW` / `R2_SECRET_ACCESS_KEY_PREVIEW`

Same as above, scoped to `dtpr-api-preview`.

## Rotation

| Trigger | Action |
| --- | --- |
| Quarterly (recommended) | Re-create both Cloudflare API tokens and both R2 access key pairs; update the GitHub secrets. |
| Suspected leak | Revoke the matching token immediately at the Cloudflare dashboard (URLs above). The dashboard shows last-used time per token to help triage scope. |
| Contributor offboarding | If the offboarded contributor created any of these tokens, rotate that token. |

## Why two layers of credentials?

Wrangler authenticates against the Cloudflare control plane (Workers, bindings, custom domains, R2 metadata) using API tokens. The data plane (object PUT/GET against the bucket from arbitrary code) goes through R2's S3-compatible endpoint, which only accepts S3 access keys. The two systems share no credential format, so CI carries both.

## Verification

After provisioning, smoke-test from a workstation:

```bash
# Wrangler API token works:
CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN_PROD pnpm --filter ./api exec wrangler whoami

# R2 access key works:
R2_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID \
R2_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID_PROD \
R2_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY_PROD \
R2_BUCKET=dtpr-api \
pnpm --filter ./api exec tsx -e \
  "import {S3Client,ListObjectsV2Command} from '@aws-sdk/client-s3';\
   const c=new S3Client({region:'auto',endpoint:\`https://\${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com\`,credentials:{accessKeyId:process.env.R2_ACCESS_KEY_ID!,secretAccessKey:process.env.R2_SECRET_ACCESS_KEY!}});\
   c.send(new ListObjectsV2Command({Bucket:process.env.R2_BUCKET})).then(r=>console.log(r.KeyCount,'objects'));"
```

Both commands should succeed with no errors.
