/**
 * Two-target esbuild.
 *
 * Figma wants exactly two files: one JS bundle for the sandbox and one
 * *self-contained* HTML file for the UI — the iframe is loaded from a
 * string (`__html__`), so it can't pull in a sibling script. The UI
 * bundle is therefore inlined into `ui.html` at the `%BUNDLE%` marker.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import * as esbuild from 'esbuild'

const watch = process.argv.includes('--watch')

/** Figma's sandbox targets a conservative baseline; keep both bundles there. */
const shared = {
  bundle: true,
  format: 'iife',
  target: 'es2017',
  logLevel: 'info',
}

/** Inline the UI bundle into the HTML shell. */
const inlineHtmlPlugin = {
  name: 'inline-html',
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length > 0) return
      const js = result.outputFiles?.[0]?.text
      if (js === undefined) return
      const shell = await readFile('src/ui/ui.html', 'utf8')
      if (!shell.includes('%BUNDLE%')) {
        throw new Error('src/ui/ui.html is missing the %BUNDLE% marker')
      }
      // `$` is special in String.replace patterns and SVG-ish bundles
      // are full of them, so use a function replacement.
      await mkdir('dist', { recursive: true })
      await writeFile('dist/ui.html', shell.replace('%BUNDLE%', () => js))
    })
  },
}

const codeConfig = {
  ...shared,
  entryPoints: ['src/code.ts'],
  outfile: 'dist/code.js',
}

const uiConfig = {
  ...shared,
  entryPoints: ['src/ui/ui.ts'],
  outfile: 'dist/ui.js',
  write: false,
  plugins: [inlineHtmlPlugin],
}

if (watch) {
  const contexts = await Promise.all([
    esbuild.context(codeConfig),
    esbuild.context(uiConfig),
  ])
  await Promise.all(contexts.map((context) => context.watch()))
  console.log('watching…')
} else {
  await Promise.all([esbuild.build(codeConfig), esbuild.build(uiConfig)])
  console.log('built dist/code.js and dist/ui.html')
}
