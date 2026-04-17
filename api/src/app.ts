import { Hono } from 'hono'

export type AppEnv = {
  Bindings: Env
}

export function createApp() {
  const app = new Hono<AppEnv>()

  app.get('/healthz', (c) => c.json({ ok: true, service: 'dtpr-api' }))

  return app
}
