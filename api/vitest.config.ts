import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

/**
 * Runs under workerd via @cloudflare/vitest-pool-workers. CLI tests
 * that depend on node:os / node:fs live in test/cli/ and run via the
 * sibling `vitest.cli.config.ts` (standard Node runner).
 */
export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.jsonc' },
      },
    },
    include: ['test/unit/**/*.test.ts', 'test/api/**/*.test.ts'],
  },
})
