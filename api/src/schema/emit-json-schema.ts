import { z } from 'zod'
import { CategorySchema } from './category.ts'
import { DatachainTypeSchema } from './datachain-type.ts'
import { DatachainInstanceSchema } from './datachain-instance.ts'
import { ElementSchema } from './element.ts'
import { SchemaManifestSchema } from './manifest.ts'

/**
 * Canonical options for z.toJSONSchema. `io: 'input'` emits the pre-
 * transform shape (what callers must supply), `draft-2020-12` matches
 * what modern MCP clients expect (the spec pins draft-07 historically;
 * 2020-12 works for both in practice). `unrepresentable: 'any'` avoids
 * throws on features Zod can't faithfully represent in JSON Schema.
 */
export const JSON_SCHEMA_OPTIONS = {
  target: 'draft-2020-12',
  io: 'input',
  unrepresentable: 'any',
} as const

/**
 * Emit the JSON Schema for a given Zod schema using the canonical
 * options. Always use this helper so emission stays consistent across
 * CLI (schema:build), REST (/schema.json), and MCP tool descriptors.
 */
export function emitJsonSchema<T extends z.ZodType>(
  schema: T,
  name?: string,
): Record<string, unknown> {
  // z.toJSONSchema returns a plain JS object structured per the target draft.
  const emitted = z.toJSONSchema(schema, JSON_SCHEMA_OPTIONS)
  if (name) {
    ;(emitted as Record<string, unknown>).title = name
  }
  return emitted as Record<string, unknown>
}

/**
 * Emit JSON Schema for every top-level content schema. Consumed by
 * `schema:build` (writes `schema.json` to the emitted bundle) and by
 * MCP tool registration (tool input/output schemas).
 */
export function emitAllContentSchemas(): Record<string, Record<string, unknown>> {
  return {
    Manifest: emitJsonSchema(SchemaManifestSchema, 'Manifest'),
    DatachainType: emitJsonSchema(DatachainTypeSchema, 'DatachainType'),
    Category: emitJsonSchema(CategorySchema, 'Category'),
    Element: emitJsonSchema(ElementSchema, 'Element'),
    DatachainInstance: emitJsonSchema(DatachainInstanceSchema, 'DatachainInstance'),
  }
}
