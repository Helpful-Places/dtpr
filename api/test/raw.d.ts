// Vite's `?raw` suffix: import the raw text contents of a file.
// Used by the icon compositor tests to pull in SVG fixtures and
// symbol sources at bundle time (there's no filesystem inside
// workerd).
//
// Kept in its own ambient .d.ts (no imports/exports) so the wildcard
// module declaration is picked up under `moduleResolution: "Bundler"`.
declare module '*.svg?raw' {
  const content: string
  export default content
}

// Same, for JSON. The legacy capture fixtures are JSON documents that
// tests must see as their exact stored bytes, so they are imported as
// text rather than through `resolveJsonModule` (which would hand back
// a parsed object and lose the byte-level fidelity the conformance
// suite asserts on). Without this declaration the import is an error
// at typecheck time, before any test runs (KTD11).
declare module '*.json?raw' {
  const content: string
  export default content
}

// Vite's compile-time glob import, narrowed to the single form the
// legacy fixture helper uses. The worker test pool has no filesystem,
// so a 148-file icon set can only reach the test runtime by being
// inlined at bundle time; enumerating those imports by hand is not
// workable, hence the glob.
//
// Hand-written rather than pulled in via `"types": ["vite/client"]`
// because `vite` is not a dependency of this package and does not
// resolve from here — that tsconfig entry would fail to resolve and
// break the typecheck it was added to satisfy. The signature is
// deliberately narrow: only the eager, raw, default-import form
// typechecks, so a lazy or parsed variant fails loudly rather than
// silently returning the wrong type.
interface ImportMeta {
  glob(
    pattern: string | readonly string[],
    options: { query: '?raw'; import: 'default'; eager: true },
  ): Record<string, string>
}
