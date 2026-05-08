#!/usr/bin/env -S tsx
/**
 * Build-time emit of JSON Schema for the DTPR object reference page.
 * Reads directly from the canonical Zod source in `api/src/schema` so
 * the page cannot drift from the runtime contract — the same emitter
 * produces the worker bundle's `schema.json` and the MCP tool
 * descriptors.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { emitAllContentSchemas } from '../../api/src/schema/emit-json-schema.ts'

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, '../.data/object-reference.json')

const all = emitAllContentSchemas()

mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(all, null, 2))
console.log(`[emit-object-reference] wrote ${out}`)
