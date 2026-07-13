import { rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig } from 'tsup'

/**
 * Compiles the @dtpr/api `./schema` and `./validator` subpath exports.
 * Worker-side builds (wrangler) continue to compile `src/index.ts`
 * directly from `src/schema/*.ts`; this tsup pass only produces the
 * standalone `dist/schema/` + `dist/validator/` bundles consumed by
 * library packages like @dtpr/ui/core.
 *
 * Zod is bundled into the output so consumer packages that pin a
 * different Zod major (e.g. app/ on Zod 3) do not need to share a
 * ZodType value instance with api/ (Zod 4). The library boundary
 * exports only inferred TS types plus validator result envelopes.
 *
 * Pre-clean note: tsup's `clean: true` only removes files it considers
 * outputs of its own ESM/CJS pass — the `.d.ts` / `.d.cts` files emitted
 * by the dts worker are NOT in that set and survive between runs. When
 * they survive, the next dts run resolves `@dtpr/api/schema` to the
 * leftover `dist/schema/index.d.ts` (the package.json `exports` types
 * field points there), then errors with TS5055 because the file is both
 * an input and an emit target. We wipe `dist/` ourselves before tsup
 * runs to make every run behave like a fresh build.
 */
const distDir = resolve(dirname(fileURLToPath(import.meta.url)), 'dist')
rmSync(distDir, { recursive: true, force: true })

export default defineConfig({
  entry: {
    'schema/index': 'src/schema/index.ts',
    'validator/index': 'src/validator/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: false,
  clean: true,
  noExternal: ['zod'],
  outDir: 'dist',
  target: 'es2022',
  tsconfig: './tsconfig.schema.json',
})
