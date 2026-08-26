/// <reference types="@cloudflare/vitest-pool-workers" />

// Re-declare the `unsafe.bindings` rate limiters as optional. The
// generated `worker-configuration.d.ts` types them as required, but
// tests routinely build envs that provision only the bucket under
// test — and the middleware is a documented no-op when a binding is
// absent, so those envs are legitimate.
declare global {
  namespace Cloudflare {
    interface Env {
      RL_READ?: RateLimit
      RL_VALIDATE?: RateLimit
      RL_RESOLVE?: RateLimit
      RL_ICONS?: RateLimit
    }
  }
}

declare module 'cloudflare:test' {
  interface ProvidedEnv extends Env {}
}

export {}
