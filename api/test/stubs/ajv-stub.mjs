// Test-only stub for `ajv`. The older workerd bundled with
// `@cloudflare/vitest-pool-workers` cannot load ajv's transitive
// `require('./refs/data.json')` (it serves JSON as raw CJS, which
// fails to parse). Tests never exercise the ajv validation path —
// our MCP tool uses Zod schemas exclusively — so this stub keeps
// the module graph resolvable without changing runtime behavior.
//
// Production (wrangler deploy) bundles ajv through esbuild which
// handles JSON-as-CJS natively, so this alias is test-only.

class Ajv {
  constructor(_options) {}
  compile(_schema) {
    return () => true
  }
  getSchema(_id) {
    return undefined
  }
  errorsText(_errors) {
    return ''
  }
}

export default Ajv
export { Ajv }
