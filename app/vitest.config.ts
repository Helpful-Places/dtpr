import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['test/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'api',
          include: ['test/api/**/*.test.ts'],
          setupFiles: ['test/api/setup.ts'],
          testTimeout: 60_000,
        },
      },
    ],
  },
})
