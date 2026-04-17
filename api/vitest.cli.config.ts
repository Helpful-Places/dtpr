import { defineConfig } from 'vitest/config'

/**
 * Dedicated vitest config for CLI end-to-end tests that need the real
 * Node runtime (fs, os, tmpdir). The default `vitest.config.ts` runs
 * everything under `@cloudflare/vitest-pool-workers`, which cannot load
 * `node:os` via workerd's module fallback.
 */
export default defineConfig({
  test: {
    include: ['test/cli/**/*.test.ts', 'test/schema/**/*.test.ts'],
  },
})
