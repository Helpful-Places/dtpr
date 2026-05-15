import { defineConfig } from 'vitest/config'

// dtpr-ai's app/ tsconfig extends `.nuxt/tsconfig.json`, which only
// exists after `nuxt prepare`/`nuxt dev` has run. Vitest does not need
// the Nuxt-generated paths or types for these unit tests (they cover
// pure helpers, not Nuxt runtime), so we override the esbuild
// `tsconfigRaw` to a minimal config and skip tsconfig discovery
// entirely. This keeps `pnpm --filter dtpr-ai test` runnable from a
// cold checkout without first booting Nuxt.
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
  },
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        target: 'esnext',
        module: 'esnext',
        moduleResolution: 'bundler',
        useDefineForClassFields: true,
      },
    },
  },
})
