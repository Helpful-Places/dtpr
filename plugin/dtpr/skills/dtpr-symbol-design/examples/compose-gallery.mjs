#!/usr/bin/env node
// Offline DTPR icon gallery composer.
//
// Reads every element + category from a DTPR schema directory and writes
// a single static HTML file that shows each element's composed icon
// (shape + symbol + every variant) at 36×36 — the same output the
// production API serves at `/api/v2/schemas/:version/elements/:id/icon.svg`.
//
// Composition logic mirrors `api/src/icons/compositor.ts`:
//   shape primitive path + WCAG-0.179 luminance threshold for inner color.
//
// USAGE
//   node compose-gallery.mjs [<schema-dir>] [<out-html>]
//
//   <schema-dir>  Path to a versioned schema directory containing
//                 `categories/`, `elements/`, and `symbols/`. Defaults
//                 to `./api/schemas/ai/<latest-beta>` resolved from the
//                 current working directory.
//   <out-html>    Output HTML path. Defaults to `./icon-gallery.html`.
//
// EXAMPLE
//   node compose-gallery.mjs \\
//     api/schemas/ai/2026-05-06-beta \\
//     .context/dtpr-symbols/icon-gallery.html
//
// DEPENDENCIES
//   `js-yaml` (Node, runtime). The script resolves it via createRequire
//   from a handful of common locations so it works whether yaml is in
//   the workspace root, the `api/` package, or globally installed.

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve, isAbsolute } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CWD = process.cwd()

// ---- args ---------------------------------------------------------

function toAbs(p) {
  return isAbsolute(p) ? p : resolve(CWD, p)
}

function findDefaultSchema() {
  // Try `<cwd>/api/schemas/ai/<latest>` then `<cwd>` itself.
  const aiDir = resolve(CWD, 'api/schemas/ai')
  if (existsSync(aiDir)) {
    const versions = readdirSync(aiDir).filter((v) => existsSync(join(aiDir, v, 'meta.yaml')))
    if (versions.length > 0) {
      // pick the lexicographically last (works for date-prefixed ids)
      versions.sort()
      return join(aiDir, versions[versions.length - 1])
    }
  }
  if (existsSync(resolve(CWD, 'meta.yaml'))) return CWD
  throw new Error(
    'No schema directory provided and could not auto-detect one. Pass the path as the first argument.',
  )
}

const SCHEMA_DIR = toAbs(process.argv[2] ?? findDefaultSchema())
const OUT_PATH = toAbs(process.argv[3] ?? './icon-gallery.html')

if (!existsSync(join(SCHEMA_DIR, 'meta.yaml'))) {
  throw new Error(`schema dir missing meta.yaml: ${SCHEMA_DIR}`)
}

// ---- js-yaml resolution -------------------------------------------

function loadJsYaml() {
  // Try a handful of resolution roots so the script works whether yaml
  // is hoisted to the workspace root, nested under api/, or globally
  // installed. The first successful require wins.
  const candidates = [
    () => createRequire(join(SCHEMA_DIR, '..', '..', '..', 'package.json'))('js-yaml'),
    () => createRequire(join(CWD, 'package.json'))('js-yaml'),
    () => createRequire(join(CWD, 'api/package.json'))('js-yaml'),
    () => createRequire(import.meta.url)('js-yaml'),
  ]
  for (const tryLoad of candidates) {
    try {
      return tryLoad()
    } catch {
      // try next
    }
  }
  throw new Error(
    "Could not resolve `js-yaml`. Install it (`pnpm add -D js-yaml`) or run this script from a directory where it's already a dep.",
  )
}

const yaml = loadJsYaml()

// ---- shapes (lifted from api/src/icons/shapes.ts) -----------------

const SHAPES = {
  circle:
    'M18 2C26.8366 2 34 9.16344 34 18C34 26.8366 26.8366 34 18 34C9.16344 34 2 26.8366 2 18C2 9.16344 9.16344 2 18 2Z',
  hexagon:
    'M31.8564 8.8453L19 1.42265C18.3812 1.06538 17.6188 1.06538 17 1.42265L4.14359 8.8453C3.52479 9.20257 3.14359 9.86282 3.14359 10.5774V25.4226C3.14359 26.1372 3.52479 26.7974 4.14359 27.1547L17 34.5774C17.6188 34.9346 18.3812 34.9346 19 34.5774L31.8564 27.1547C32.4752 26.7974 32.8564 26.1372 32.8564 25.4226V10.5774C32.8564 9.86282 32.4752 9.20256 31.8564 8.8453Z',
  octagon:
    'M24.1191 1.41309L24.3174 1.42285C24.7751 1.46907 25.2056 1.6733 25.5332 2.00195L34.0898 10.585C34.4172 10.9135 34.6183 11.3442 34.6631 11.8018L34.6729 11.999L34.6533 24.1191C34.6526 24.5833 34.4914 25.0313 34.1992 25.3867L34.0654 25.5332L25.4824 34.0898C25.1538 34.4173 24.7224 34.6183 24.2646 34.6631L24.0674 34.6729L11.9473 34.6533C11.4171 34.6524 10.9085 34.4409 10.5342 34.0654L1.97754 25.4824C1.60327 25.1069 1.39281 24.5976 1.39355 24.0674L1.41309 11.9482C1.41392 11.4178 1.62629 10.9087 2.00195 10.5342L10.585 1.97754L10.7314 1.84473C11.0876 1.55395 11.5352 1.39299 11.999 1.39355L24.1191 1.41309Z',
  'rounded-square':
    'M6 3H30C31.6569 3 33 4.34315 33 6V30C33 31.6569 31.6569 33 30 33H6C4.34315 33 3 31.6569 3 30V6C3 4.34315 4.34315 3 6 3Z',
}

// ---- color (WCAG luminance threshold 0.179) -----------------------

function parseHex(hex) {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex ?? '')
  if (!m) return null
  const d = m[1]
  return {
    r: parseInt(d.slice(0, 2), 16),
    g: parseInt(d.slice(2, 4), 16),
    b: parseInt(d.slice(4, 6), 16),
  }
}

function linearize(c) {
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function innerColorForShape(hex) {
  const rgb = parseHex(hex)
  if (!rgb) throw new Error(`bad hex: ${hex}`)
  const l =
    0.2126 * linearize(rgb.r / 255) +
    0.7152 * linearize(rgb.g / 255) +
    0.0722 * linearize(rgb.b / 255)
  return l >= 0.179 ? '#000' : '#FFF'
}

// ---- compositor (lifted from api/src/icons/compositor.ts) ---------

function stripOuterSvg(svg) {
  const open = /^[ \t\n\r]*<svg\b[^>]*>/.exec(svg)
  if (!open) throw new Error('symbol SVG missing <svg> open tag')
  const after = svg.slice(open[0].length)
  const close = /<\/svg>[ \t\n\r]*$/.exec(after)
  if (!close) throw new Error('symbol SVG missing </svg> close tag')
  return after.slice(0, close.index).trim()
}

function resolveVariantColors(variant) {
  if (variant === 'default') return { fill: 'none', stroke: '#000', inner: '#000' }
  if (variant === 'dark') return { fill: '#000', stroke: '#000', inner: '#FFF' }
  return {
    fill: variant.color,
    stroke: variant.color,
    inner: innerColorForShape(variant.color),
  }
}

function composeIcon({ shape, symbolSvg, variant }) {
  const { fill, stroke, inner } = resolveVariantColors(variant)
  const path = SHAPES[shape]
  if (!path) throw new Error(`unknown shape: ${shape}`)
  const symbolInner = stripOuterSvg(symbolSvg)
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">' +
    `<path d="${path}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>` +
    `<g color="${inner}">${symbolInner}</g>` +
    '</svg>'
  )
}

// ---- data loading -------------------------------------------------

function loadYaml(path) {
  return yaml.load(readFileSync(path, 'utf-8'))
}

function extractEn(localized) {
  if (!Array.isArray(localized)) return ''
  return (
    localized.find((l) => l.locale === 'en')?.value ??
    localized[0]?.value ??
    ''
  ).trim()
}

const meta = loadYaml(join(SCHEMA_DIR, 'meta.yaml'))
const versionLabel = meta?.version ?? SCHEMA_DIR

const categories = readdirSync(join(SCHEMA_DIR, 'categories'))
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => loadYaml(join(SCHEMA_DIR, 'categories', f)))

const categoryById = new Map(categories.map((c) => [c.id, c]))

const elements = readdirSync(join(SCHEMA_DIR, 'elements'))
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => loadYaml(join(SCHEMA_DIR, 'elements', f)))

// ---- compose every element + variant ------------------------------

function variantsForCategory(cat) {
  const list = [
    { key: 'default', label: 'default', variant: 'default' },
    { key: 'dark', label: 'dark', variant: 'dark' },
  ]
  const values = cat?.element_context?.values ?? []
  for (const v of values) {
    if (typeof v.color === 'string' && v.color.length > 0) {
      list.push({ key: v.id, label: v.id, variant: { kind: 'colored', color: v.color } })
    }
  }
  return list
}

const rows = []
let missing = 0
for (const el of elements) {
  const cat = categoryById.get(el.category_id)
  if (!cat) {
    console.warn(`skip ${el.id}: unknown category ${el.category_id}`)
    missing++
    continue
  }
  const symbolPath = join(SCHEMA_DIR, 'symbols', `${el.symbol_id}.svg`)
  let symbolSvg
  try {
    symbolSvg = readFileSync(symbolPath, 'utf-8')
  } catch {
    console.warn(`skip ${el.id}: missing symbol ${el.symbol_id}.svg`)
    missing++
    continue
  }
  const variants = variantsForCategory(cat)
  const composed = variants.map((v) => ({
    label: v.label,
    svg: composeIcon({ shape: cat.shape, symbolSvg, variant: v.variant }),
  }))
  rows.push({
    elementId: el.id,
    title: extractEn(el.title),
    categoryId: cat.id,
    categoryTitle: extractEn(cat.name),
    shape: cat.shape,
    symbolId: el.symbol_id,
    composed,
  })
}

const grouped = new Map()
for (const r of rows) {
  if (!grouped.has(r.categoryId)) grouped.set(r.categoryId, [])
  grouped.get(r.categoryId).push(r)
}
const sortedCategoryIds = [...grouped.keys()].sort((a, b) => {
  const oa = categoryById.get(a)?.order ?? 9999
  const ob = categoryById.get(b)?.order ?? 9999
  return oa - ob
})

// ---- emit HTML ----------------------------------------------------

const css = `
:root { color-scheme: light dark; --fg: #111; --bg: #fff; --muted: #666; --rule: #ddd; --accent: #06c; --card: #fafafa; }
@media (prefers-color-scheme: dark) { :root { --fg: #eee; --bg: #111; --muted: #999; --rule: #2a2a2a; --accent: #6af; --card: #1a1a1a; } }
* { box-sizing: border-box; }
body { font: 14px/1.5 -apple-system, system-ui, sans-serif; margin: 0; padding: 2rem; max-width: 80rem; margin-inline: auto; color: var(--fg); background: var(--bg); }
h1 { font-size: 1.3rem; margin: 0 0 0.25rem; font-weight: 700; }
.meta { color: var(--muted); margin: 0 0 2rem; font-size: 0.85rem; }
.category { margin-bottom: 3rem; }
.category h2 { font-size: 1rem; margin: 0 0 0.25rem; font-weight: 600; color: var(--accent); }
.category-meta { color: var(--muted); font-size: 0.8rem; margin: 0 0 1rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 0.75rem; }
.element { padding: 0.75rem; border: 1px solid var(--rule); border-radius: 0.5rem; background: var(--card); }
.element-title { font-size: 0.85rem; font-weight: 600; margin: 0 0 0.15rem; }
.element-id { font-size: 0.7rem; color: var(--muted); font-family: ui-monospace, monospace; margin: 0 0 0.5rem; }
.variants { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: flex-start; }
.variant { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; }
.variant svg { display: block; }
.variant-label { font-size: 0.65rem; color: var(--muted); font-family: ui-monospace, monospace; }
`

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const sections = sortedCategoryIds
  .map((cid) => {
    const cat = categoryById.get(cid)
    const items = grouped.get(cid) ?? []
    const elementsHtml = items
      .map((r) => {
        const variantsHtml = r.composed
          .map(
            (c) =>
              `<div class="variant">${c.svg}<div class="variant-label">${escapeHtml(c.label)}</div></div>`,
          )
          .join('')
        return `<div class="element"><div class="element-title">${escapeHtml(r.title || r.elementId)}</div><div class="element-id">${escapeHtml(r.elementId)} · ${escapeHtml(r.symbolId)}</div><div class="variants">${variantsHtml}</div></div>`
      })
      .join('')
    return `<section class="category"><h2>${escapeHtml(extractEn(cat.name))}</h2><p class="category-meta">${escapeHtml(cid)} · shape: ${escapeHtml(cat.shape)} · ${items.length} elements</p><div class="grid">${elementsHtml}</div></section>`
  })
  .join('')

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>DTPR icon gallery — ${escapeHtml(versionLabel)}</title>
<style>${css}</style>
</head>
<body>
<h1>DTPR icon gallery</h1>
<p class="meta">version <code>${escapeHtml(versionLabel)}</code> · ${rows.length} elements${missing ? ` · ${missing} skipped` : ''}</p>
${sections}
</body>
</html>
`

writeFileSync(OUT_PATH, html)
console.log(`wrote ${OUT_PATH}`)
console.log(`composed ${rows.length} elements${missing ? `, skipped ${missing}` : ''}`)
