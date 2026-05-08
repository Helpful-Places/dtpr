<script setup lang="ts">
// Inline type indicator used by SchemaTree. Pulls the "label" out of a
// JSON Schema fragment — handles `$ref` -> `$defs` name, primitive
// `type`, `array<...>`, unions, enums, and consts. The same logic
// lives near the top of SchemaTree but is duplicated here so the row
// header stays terse without recursing into the fragment.
import { computed } from 'vue'

type JsonSchema = Record<string, any>

interface Props {
  node: JsonSchema
  defs: Record<string, JsonSchema>
}

const props = defineProps<Props>()

function refName(ref: string): string | null {
  const m = ref.match(/^#\/\$defs\/(.+)$/)
  return m ? m[1]! : null
}

const label = computed<string>(() => {
  const n = props.node
  if (typeof n.$ref === 'string') return refName(n.$ref) ?? n.$ref
  if (n.type === 'array') {
    const items = n.items
    if (items?.$ref) return `array<${refName(items.$ref) ?? items.$ref}>`
    if (items?.type) return `array<${items.type}>`
    if (items?.anyOf) return 'array<union>'
    return 'array'
  }
  if (Array.isArray(n.type)) return n.type.join(' | ')
  if (n.type === 'object' && !n.properties && n.additionalProperties && typeof n.additionalProperties === 'object') {
    const ap = n.additionalProperties
    if (ap.$ref) return `record<${refName(ap.$ref) ?? ap.$ref}>`
    if (ap.type) return `record<${ap.type}>`
    return 'record'
  }
  if (n.type) return n.type as string
  if (Array.isArray(n.anyOf)) return 'union'
  if (Array.isArray(n.oneOf)) return 'oneOf'
  if (Array.isArray(n.allOf)) return 'allOf'
  if (Array.isArray(n.enum)) return `enum<${n.enum.length}>`
  if (n.const !== undefined) return 'const'
  return 'any'
})
</script>

<template>
  <code class="schema-type-badge">{{ label }}</code>
</template>

<style scoped>
.schema-type-badge {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.75rem;
  background: var(--ui-bg-muted, rgb(243, 244, 246));
  color: var(--ui-text-primary, rgb(31, 41, 55));
  padding: 0.05rem 0.4rem;
  border-radius: 0.25rem;
  border: 1px solid var(--ui-border, rgb(229, 231, 235));
}
</style>
