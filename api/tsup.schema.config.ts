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
 */
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
