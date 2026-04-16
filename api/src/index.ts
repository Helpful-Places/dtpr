import { createApp } from './app.ts'

const app = createApp()

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>
