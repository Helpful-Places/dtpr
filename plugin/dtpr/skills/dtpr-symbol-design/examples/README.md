# Symbol-design examples

Helper scripts that complement the per-symbol preview emitted in Phase 3 of `dtpr-symbol-design`.

## `compose-gallery.mjs` — version-wide composed gallery

The skill's own Phase 3 preview shows three variants of **one** symbol at multiple sizes. This script does the complementary job: it composes **every element** in a schema version (shape + symbol + every variant) into a single static HTML page — the same output the production API serves at `/api/v2/schemas/:version/elements/:id/icon.svg`, but rendered offline against the live working tree.

Use it when you want to see how a symbol edit lands across the whole version, sanity-check a batch of symbol redesigns, or audit category-wide visual coherence before opening a PR.

### Run it

```bash
# from a DTPR monorepo root with api/schemas/ai/<version>/
node plugin/dtpr/skills/dtpr-symbol-design/examples/compose-gallery.mjs

# explicit schema dir + output path
node plugin/dtpr/skills/dtpr-symbol-design/examples/compose-gallery.mjs \
  api/schemas/ai/2026-05-06-beta \
  .context/dtpr-symbols/icon-gallery.html
```

Both arguments are optional. With no arguments it auto-detects the latest `api/schemas/ai/<version>/` under the current working directory and writes `./icon-gallery.html`.

### What it does

1. Reads `meta.yaml`, every `categories/*.yaml`, and every `elements/*.yaml` from the chosen schema directory.
2. For each element, looks up its category (for the shape primitive + any colored context values) and its `symbol_id.svg`.
3. Composes the final 36×36 SVG using the same logic as `api/src/icons/compositor.ts`:
   - shape primitive injected as a `<path>` with the variant's fill/stroke,
   - symbol's inner markup wrapped in `<g color="…inner…">`,
   - inner color picked via the WCAG-0.179 luminance threshold from `api/src/icons/color.ts` for colored variants.
4. Groups the result by category (ordered by `category.order`) and writes a static HTML file with default + dark + each colored variant per element.

### Dependencies

- Node.js (≥18 recommended for ESM + native `node:` imports).
- `js-yaml` — resolved via `createRequire` from a handful of common locations (workspace root, `api/` package, the script's own directory). If your repo has `js-yaml` installed somewhere reachable, it Just Works; otherwise install it (`pnpm add -D js-yaml` at the workspace root).

### Scope

This is an **example / dev tool**, not a skill output. The skill itself still produces per-symbol previews (Phase 3). This script exists for the rarer "show me the whole version" case and is intentionally standalone — no MCP calls, no R2, no Workers runtime.
