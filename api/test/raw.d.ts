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
