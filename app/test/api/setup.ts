import { setup } from '@nuxt/test-utils/e2e'

const host = process.env.NUXT_TEST_HOST

if (host) {
  // Local dev: point at an already-running server
  await setup({ host })
} else {
  // CI: let @nuxt/test-utils build and start the server
  await setup({ rootDir: '.' })
}
