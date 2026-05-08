#!/usr/bin/env -S tsx
/**
 * Build-time emit of JSON Schema for the two datachain wire forms
 * rendered on `/object-reference`. Reads directly from the canonical
 * Zod source in `api/src/schema` so this page cannot drift from the
 * runtime contract — the same emitter produces the worker bundle's
 * `schema.json` and the MCP tool descriptors.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { emitAllContentSchemas } from '../../api/src/schema/emit-json-schema.ts'

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, '../.data/object-reference.json')

const all = emitAllContentSchemas()
// Note: the canonical key in `emitAllContentSchemas()` is
// `ResolvedDatachain` (matching the type alias in
// `api/src/schema/datachain-instance-resolved.ts`). This page renders
// the two wire forms under display names that mirror each other
// (`*Instance`), so we re-key here without touching the api emitter
// (which is also consumed by the worker `schema.json` bundle and MCP
// tool descriptors — those should keep the canonical key).
const subset = {
  DatachainInstance: all.DatachainInstance,
  ResolvedDatachainInstance: all.ResolvedDatachain,
}

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(subset, null, 2))
console.log(`[emit-object-reference] wrote ${out}`)
