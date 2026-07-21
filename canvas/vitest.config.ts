import { defineConfig } from 'vitest/config'

// Unit tests cover pure helpers (grammar, feedback validation/aggregation,
// respondent identity) — not the Nuxt runtime — so we skip tsconfig
// discovery (the app/ tsconfig extends `.nuxt/tsconfig.json`, which only
// exists after `nuxt prepare`) and run against a minimal esbuild config.
// Mirrors dtpr-ai/vitest.config.ts.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
  },
  resolve: {
    alias: {
      '~': new URL('./app', import.meta.url).pathname,
      '@': new URL('./app', import.meta.url).pathname,
    },
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
