<script setup lang="ts">
// Recursive renderer for a JSON Schema (Draft 2020-12) document. Used
// by the /object-reference page to display the DTPR datachain wire
// shapes inline, walking `properties`, `items`, `anyOf`, `$ref` (via
// `$defs` on the root), `enum`, and `const` so authors can browse the
// shape without opening the api source.
//
// The tree is intentionally read-only and presentation-focused: it
// shows a field's name, type, required-ness, description, default,
// constraints, and nested children. It does not validate, edit, or
// resolve external `$ref` URIs.
import { computed } from 'vue'

type JsonSchema = Record<string, any>

interface Props {
  // The full JSON Schema document for one top-level object.
  schema: JsonSchema
  // A schema fragment to render. Defaults to `schema` (the root).
  // Children pass sub-fragments; the root passes nothing.
  node?: JsonSchema
  // Used for recursion to look up `$ref` against the root document's
  // `$defs`. Children inherit this from the parent.
  defs?: Record<string, JsonSchema>
  // Indentation depth — drives left-padding only.
  depth?: number
}

const props = withDefaults(defineProps<Props>(), {
  node: undefined,
  defs: undefined,
  depth: 0,
})

const rootDefs = computed<Record<string, JsonSchema>>(
  () => props.defs ?? props.schema.$defs ?? {},
)

const node = computed<JsonSchema>(() => props.node ?? props.schema)

// Resolve a `$ref` like `#/$defs/Foo` against the root document.
function resolveRef(ref: string): JsonSchema | null {
  const m = ref.match(/^#\/\$defs\/(.+)$/)
  if (!m) return null
  return rootDefs.value[m[1]!] ?? null
}

const resolved = computed<JsonSchema>(() => {
  if (typeof node.value.$ref === 'string') {
    const r = resolveRef(node.value.$ref)
    if (r) return r
  }
  return node.value
})

const refLabel = computed<string | null>(() => {
  if (typeof node.value.$ref !== 'string') return null
  const m = node.value.$ref.match(/^#\/\$defs\/(.+)$/)
  return m ? m[1]! : node.value.$ref
})

// Display string for the "type" cell. Handles unions, arrays, enums,
// const, and $ref names.
const typeLabel = computed<string>(() => {
  const r = resolved.value
  if (refLabel.value) return refLabel.value
  if (Array.isArray(r.type)) return r.type.join(' | ')
  if (r.type === 'array') {
    const items = r.items
    if (!items) return 'array'
    if (items.$ref) {
      const m = items.$ref.match(/^#\/\$defs\/(.+)$/)
      return `array<${m ? m[1] : items.$ref}>`
    }
    if (items.type) return `array<${items.type}>`
    if (items.anyOf) return 'array<union>'
    return 'array'
  }
  if (r.type) return r.type as string
  if (Array.isArray(r.anyOf)) return 'union'
  if (Array.isArray(r.oneOf)) return 'oneOf'
  if (Array.isArray(r.allOf)) return 'allOf'
  if (Array.isArray(r.enum)) return 'enum'
  if (r.const !== undefined) return `const`
  return 'any'
})

const enumValues = computed<string[] | null>(() => {
  const r = resolved.value
  return Array.isArray(r.enum) ? r.enum.map((v) => JSON.stringify(v)) : null
})

const constValue = computed<string | null>(() => {
  const r = resolved.value
  return r.const !== undefined ? JSON.stringify(r.const) : null
})

const defaultValue = computed<string | null>(() => {
  const r = resolved.value
  if (r.default === undefined) return null
  try {
    return JSON.stringify(r.default)
  } catch {
    return String(r.default)
  }
})

const constraints = computed<string[]>(() => {
  const r = resolved.value
  const out: string[] = []
  if (typeof r.minimum === 'number') out.push(`min ${r.minimum}`)
  if (typeof r.maximum === 'number') out.push(`max ${r.maximum}`)
  if (typeof r.minLength === 'number') out.push(`minLength ${r.minLength}`)
  if (typeof r.maxLength === 'number') out.push(`maxLength ${r.maxLength}`)
  if (typeof r.minItems === 'number') out.push(`minItems ${r.minItems}`)
  if (typeof r.maxItems === 'number') out.push(`maxItems ${r.maxItems}`)
  if (typeof r.pattern === 'string') out.push(`pattern /${r.pattern}/`)
  if (r.format) out.push(`format ${r.format}`)
  return out
})

// Children to render for this node.
const objectProps = computed<{ name: string; required: boolean; child: JsonSchema }[]>(() => {
  const r = resolved.value
  if (r.type !== 'object' || !r.properties) return []
  const required = new Set<string>(Array.isArray(r.required) ? r.required : [])
  return Object.entries(r.properties).map(([name, child]) => ({
    name,
    required: required.has(name),
    child: child as JsonSchema,
  }))
})

const arrayItems = computed<JsonSchema | null>(() => {
  const r = resolved.value
  return r.type === 'array' && r.items ? r.items : null
})

// Record / map objects emitted by `z.record(z.string(), Schema)` —
// `{ type: 'object', additionalProperties: <Schema>, propertyNames }`
// with no `properties`. We render the value shape under a `<key>`
// label so authors can see what each entry carries.
const recordValue = computed<JsonSchema | null>(() => {
  const r = resolved.value
  if (r.type !== 'object') return null
  if (r.properties) return null
  const ap = r.additionalProperties
  if (!ap || typeof ap !== 'object') return null
  return ap as JsonSchema
})

const unionVariants = computed<JsonSchema[]>(() => {
  const r = resolved.value
  return (r.anyOf ?? r.oneOf ?? []) as JsonSchema[]
})
</script>

<template>
  <div class="schema-tree" :data-depth="depth">
    <!-- Object: list of named properties. -->
    <div v-if="objectProps.length" class="schema-tree__props">
      <div
        v-for="prop in objectProps"
        :key="prop.name"
        class="schema-tree__prop"
      >
        <div class="schema-tree__row">
          <code class="schema-tree__name">{{ prop.name }}</code>
          <span class="schema-tree__type">
            <SchemaTypeBadge :node="prop.child" :defs="rootDefs" />
          </span>
          <span
            v-if="prop.required"
            class="schema-tree__required"
            title="Required"
          >required</span>
        </div>
        <p
          v-if="prop.child.description"
          class="schema-tree__description"
        >{{ prop.child.description }}</p>
        <SchemaTree
          :schema="schema"
          :node="prop.child"
          :defs="rootDefs"
          :depth="depth + 1"
        />
      </div>
    </div>

    <!-- Array: render the items shape inline. -->
    <div v-else-if="arrayItems" class="schema-tree__nested">
      <div class="schema-tree__nested-label">items</div>
      <SchemaTree
        :schema="schema"
        :node="arrayItems"
        :defs="rootDefs"
        :depth="depth + 1"
      />
    </div>

    <!-- Record / map: object whose entries are all the same shape. -->
    <div v-else-if="recordValue" class="schema-tree__nested">
      <div class="schema-tree__nested-label">&lt;key&gt;</div>
      <SchemaTree
        :schema="schema"
        :node="recordValue"
        :defs="rootDefs"
        :depth="depth + 1"
      />
    </div>

    <!-- Union: render each variant. -->
    <div v-else-if="unionVariants.length" class="schema-tree__nested">
      <div
        v-for="(variant, idx) in unionVariants"
        :key="idx"
        class="schema-tree__variant"
      >
        <div class="schema-tree__nested-label">variant {{ idx + 1 }}</div>
        <SchemaTree
          :schema="schema"
          :node="variant"
          :defs="rootDefs"
          :depth="depth + 1"
        />
      </div>
    </div>

    <!-- Leaf: type + constraints + default + enum/const. -->
    <div
      v-else-if="depth > 0 && (defaultValue || enumValues || constValue || constraints.length)"
      class="schema-tree__leaf"
    >
      <div v-if="enumValues" class="schema-tree__leaf-row">
        <span class="schema-tree__leaf-key">enum</span>
        <code class="schema-tree__leaf-value">{{ enumValues.join(' | ') }}</code>
      </div>
      <div v-if="constValue" class="schema-tree__leaf-row">
        <span class="schema-tree__leaf-key">const</span>
        <code class="schema-tree__leaf-value">{{ constValue }}</code>
      </div>
      <div v-if="defaultValue" class="schema-tree__leaf-row">
        <span class="schema-tree__leaf-key">default</span>
        <code class="schema-tree__leaf-value">{{ defaultValue }}</code>
      </div>
      <div v-if="constraints.length" class="schema-tree__leaf-row">
        <span class="schema-tree__leaf-key">constraints</span>
        <code class="schema-tree__leaf-value">{{ constraints.join(', ') }}</code>
      </div>
    </div>
  </div>
</template>

<style scoped>
.schema-tree {
  /* Recursive nodes inherit indentation via padding-left on .prop. */
}

.schema-tree__props {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schema-tree__prop {
  border-left: 2px solid var(--ui-border, rgb(229, 231, 235));
  padding-left: 0.875rem;
}

.schema-tree__row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.schema-tree__name {
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  color: var(--ui-text-primary, inherit);
}

.schema-tree__type {
  display: inline-flex;
  align-items: center;
}

.schema-tree__required {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
  color: var(--ui-color-warning-700, rgb(180, 83, 9));
  background: var(--ui-color-warning-100, rgb(254, 243, 199));
  border-radius: 0.25rem;
  padding: 0.05rem 0.4rem;
}

.schema-tree__description {
  margin: 0.25rem 0 0.5rem;
  font-size: 0.85rem;
  color: var(--ui-text-muted, rgb(75, 85, 99));
  line-height: 1.4;
}

.schema-tree__nested {
  margin-top: 0.5rem;
  padding-left: 0.875rem;
  border-left: 2px dashed var(--ui-border, rgb(229, 231, 235));
}

.schema-tree__nested-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted, rgb(107, 114, 128));
  margin-bottom: 0.25rem;
}

.schema-tree__variant + .schema-tree__variant {
  margin-top: 0.5rem;
}

.schema-tree__leaf {
  margin-top: 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.schema-tree__leaf-row {
  font-size: 0.8rem;
  display: flex;
  gap: 0.5rem;
}

.schema-tree__leaf-key {
  color: var(--ui-text-muted, rgb(107, 114, 128));
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  min-width: 5.5rem;
}

.schema-tree__leaf-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8rem;
  color: var(--ui-text-primary, inherit);
}
</style>
