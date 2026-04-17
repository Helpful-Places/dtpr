import path from 'node:path'
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

/**
 * Runs under workerd via @cloudflare/vitest-pool-workers. CLI tests
 * that depend on node:os / node:fs live in test/cli/ and run via the
 * sibling `vitest.cli.config.ts` (standard Node runner).
 *
 * The `resolve.alias` block swaps `ajv` + `ajv-formats` for test-only
 * stubs. The older workerd bundled with the test pool cannot load
 * ajv's transitive `require('./refs/data.json')` (it serves JSON as
 * raw CJS, which fails to parse). Our MCP tool uses Zod schemas
 * exclusively, so the ajv validation path is never exercised; the
 * stub keeps the module graph resolvable. Production (wrangler
 * deploy) bundles ajv through esbuild natively, so the alias is
 * test-only.
 */
export default defineWorkersConfig({
  resolve: {
    alias: {
      ajv: path.resolve(__dirname, './test/stubs/ajv-stub.mjs'),
      'ajv-formats': path.resolve(__dirname, './test/stubs/ajv-formats-stub.mjs'),
    },
  },
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
      },
    },
    include: ['test/unit/**/*.test.ts', 'test/api/**/*.test.ts'],
  },
})
