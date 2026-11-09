# Vision microsite

Microsite giving the vision of DTPR. Live at https://vision.dtpr.io.

## Build

Builds to static HTML with webpack 4 into `_build/`. It is its own pnpm root
(`pnpm-workspace.yaml`, `pnpm-lock.yaml` imported from the original
`yarn.lock`), so its dependencies stay out of the monorepo's lockfile.

```sh
pnpm install --frozen-lockfile
pnpm build   # or: pnpm start, for webpack-dev-server on :9000
```

The scripts set `NODE_OPTIONS=--openssl-legacy-provider`: webpack 4 hashes with
MD4, which Node 17+ only provides through the legacy OpenSSL provider. Tested on
Node 22.
