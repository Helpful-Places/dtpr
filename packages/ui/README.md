# @dtpr/ui

Presentation library for the [DTPR standard](https://dtpr.io) — a shared component library for rendering DTPR taxonomies and datachains across web apps, server-rendered MCP App iframes, and future surfaces.

> **Status:** v1 (internal, `workspace:*` only). Not published to npm.

## Packages

`@dtpr/ui` ships three subpath exports. There is no root export — consumers pick a subpath so layered separation is preserved.

| Subpath | Consumer | Ships |
|---|---|---|
| `@dtpr/ui/core` | Anyone (framework-neutral) | Locale extraction, variable interpolation, category grouping, element display derivation, datachain validation, hexagon fallback icon |
| `@dtpr/ui/vue` | Vue 3 apps | Vue 3 SFC primitives (`<DtprIcon>`, `<DtprElement>`, `<DtprElementDetail>`, `<DtprCategorySection>`, `<DtprDatachain>`, `<DtprElementGrid>`) |
| `@dtpr/ui/vue/styles.css` | Vue 3 apps | Default stylesheet (tokens + layout) |
| `@dtpr/ui/html` | Server-side (Cloudflare Workers) | `renderDatachainDocument` — full `<!doctype html>` document for MCP App iframes, built on the same Vue SFCs via `@vue/server-renderer` |

## Usage

### Vue app

```ts
import { DtprDatachain } from '@dtpr/ui/vue'
import '@dtpr/ui/vue/styles.css'
```

Host Tailwind utilities win over library styles by default CSS-layer ordering. See Theming below to customize.

### Server-side (MCP App, Cloudflare Workers)

```ts
import { renderDatachainDocument } from '@dtpr/ui/html'

const html = await renderDatachainDocument(sections, { locale: 'en' })
// register html as MCP UI resource
```

### Framework-neutral helpers

```ts
import { extract, interpolate, deriveElementDisplay } from '@dtpr/ui/core'
```

## Theming

Styles live in the `dtpr` cascade layer and use CSS custom properties for brand tokens. Override on any wrapper element:

```css
.my-app {
  --dtpr-color-accent: #0f5153;
  --dtpr-color-border: rgba(0, 0, 0, 0.1);
  --dtpr-font-heading: 'Red Hat Text', sans-serif;
  --dtpr-font-body: 'Red Hat Text', sans-serif;
}
```

Token reference is in `src/vue/styles.css`.

### Cascade-layer ordering

Library styles are wrapped in `@layer dtpr { ... }`. If your host app uses Tailwind or another layer system, declare the layer order in your global CSS to control precedence:

```css
@layer dtpr, tailwind-base, tailwind-components, app, tailwind-utilities;
```

## R2 Neutrality Governance

> The library must not bake in proprietary behavior specific to any single consumer. Compositions that are specific to one product (Clarable, `admin`, etc.) live in the consumer, not in this library.

**Rule:** every new public export to `@dtpr/ui` (symbol, prop name, slot name, CSS custom property, data attribute) requires a one-line justification of generic applicability in the PR description.

**Template:**

> `<SymbolName>` is generic because *…*. It composes with consumer-specific behavior via *…*.

**Mechanical check:** `pnpm --filter @dtpr/ui check:neutrality` greps `src/**` for `clarable`, `pinia`, or `admin-` tokens and fails if any are found. This catches the obvious violations; humans enforce the justification rule in review.

## Layering

```
@dtpr/api/schema  ──►  @dtpr/ui/core  ──►  @dtpr/ui/vue
                                      └──►  @dtpr/ui/html  (uses /vue via @vue/server-renderer)
```

- `@dtpr/ui/core` has zero framework dependencies.
- `@dtpr/ui/vue` and `@dtpr/ui/html` both import from `/core`, never from each other.
- `/html` uses `/vue`'s SFCs as the single source of truth (SSR'd via `@vue/server-renderer`).

## Scripts

- `pnpm --filter @dtpr/ui build` — emits `dist/{core,vue,html}/*` + `dist/vue/styles.css`
- `pnpm --filter @dtpr/ui test` — runs vitest
- `pnpm --filter @dtpr/ui typecheck` — `vue-tsc --noEmit`
- `pnpm --filter @dtpr/ui check:neutrality` — R2 grep check
