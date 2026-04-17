/// <reference types="@cloudflare/vitest-pool-workers" />

// Augment the generated Env with the rate-limit bindings declared in
// wrangler.jsonc's `unsafe.bindings`. `wrangler types` does not emit
// types for `unsafe.bindings`, so we declare them here by hand.
declare global {
  namespace Cloudflare {
    interface Env {
      RL_READ?: RateLimit
      RL_VALIDATE?: RateLimit
    }
  }
}

declare module 'cloudflare:test' {
  interface ProvidedEnv extends Env {}
}

export {}
