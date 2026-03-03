import { setup } from '@nuxt/test-utils/e2e'

const host = process.env.NUXT_TEST_HOST || 'http://localhost:3000'

await setup({ host })
