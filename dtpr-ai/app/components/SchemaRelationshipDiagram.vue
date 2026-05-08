<script setup lang="ts">
// Mermaid-rendered map of how the seven DTPR top-level schemas
// reference each other. Mermaid handles auto-layout; the source string
// is the single thing to edit when relationships change. Rendered
// client-side (`onMounted`) because mermaid touches the DOM/window.
import { onMounted, ref, watch } from 'vue'
import { useColorMode } from '#imports'

const colorMode = useColorMode()

// Two-column flowchart: schema definitions on the left (purple),
// instance forms on the right (green). Solid arrows = structural
// composition; dashed arrows = reference by id.
const diagramSource = `
flowchart LR
  subgraph defs["Schema definitions"]
    direction TB
    Manifest["Manifest"]
    DatachainType["DatachainType"]
    Category["Category"]
    Element["Element"]
    Manifest -- "version + locales" --> DatachainType
    DatachainType -- "categories[]" --> Category
    Category -- "datachain_type" --> Element
  end

  subgraph instances["Instance forms"]
    direction TB
    DatachainInstance["DatachainInstance"]
    ResolvedDatachainInstance["ResolvedDatachainInstance"]
    AuthoringProvenance["AuthoringProvenance"]
    ResolvedDatachainInstance -- "extends (superset)" --> DatachainInstance
    ResolvedDatachainInstance -- "authoring_provenance" --> AuthoringProvenance
  end

  DatachainInstance -- "schema_version pins" --> Manifest
  DatachainInstance -. "elements[].element_id" .-> Element
  ResolvedDatachainInstance -- "schema_snapshot (full pin)" --> DatachainType

  click Manifest "#Manifest" "Jump to Manifest schema"
  click DatachainType "#DatachainType" "Jump to DatachainType schema"
  click Category "#Category" "Jump to Category schema"
  click Element "#Element" "Jump to Element schema"
  click DatachainInstance "#DatachainInstance" "Jump to DatachainInstance schema"
  click ResolvedDatachainInstance "#ResolvedDatachainInstance" "Jump to ResolvedDatachainInstance schema"
  click AuthoringProvenance "#AuthoringProvenance" "Jump to AuthoringProvenance schema"

  classDef definition fill:#eef2ff,stroke:#6366f1,stroke-width:1.5px,color:#1e1b4b;
  classDef instance fill:#ecfdf5,stroke:#10b981,stroke-width:1.5px,color:#022c22;
  class Manifest,DatachainType,Category,Element definition;
  class DatachainInstance,ResolvedDatachainInstance,AuthoringProvenance instance;
`

const container = ref<HTMLDivElement | null>(null)
const renderError = ref<string | null>(null)
let renderToken = 0

async function renderDiagram() {
  if (!container.value) return
  const myToken = ++renderToken
  try {
    const mermaid = (await import('mermaid')).default
    mermaid.initialize({
      startOnLoad: false,
      // 'loose' is required for `click X "#anchor"` navigation; the
      // diagram source is authored in this file so we trust it.
      securityLevel: 'loose',
      theme: colorMode.value === 'dark' ? 'dark' : 'default',
      flowchart: {
        htmlLabels: true,
        curve: 'basis',
      },
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    })
    const id = `schema-rel-${Date.now()}`
    const { svg, bindFunctions } = await mermaid.render(id, diagramSource.trim())
    if (myToken !== renderToken || !container.value) return
    container.value.innerHTML = svg
    bindFunctions?.(container.value)
    renderError.value = null
  } catch (err) {
    renderError.value = err instanceof Error ? err.message : String(err)
  }
}

onMounted(renderDiagram)
watch(() => colorMode.value, renderDiagram)
</script>

<template>
  <figure class="schema-rel">
    <div ref="container" class="schema-rel__diagram" aria-label="DTPR schema relationship diagram" />
    <p v-if="renderError" class="schema-rel__error">
      Failed to render diagram: {{ renderError }}
    </p>
    <figcaption class="schema-rel__legend">
      <span><span class="schema-rel__swatch schema-rel__swatch--solid" /> structural composition</span>
      <span><span class="schema-rel__swatch schema-rel__swatch--dashed" /> reference by id</span>
      <span class="schema-rel__legend-hint">Click any node to jump to its schema below.</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.schema-rel {
  margin: 0 0 2.5rem;
  padding: 1rem;
  background: var(--ui-bg, white);
  border: 1px solid var(--ui-border, rgb(229, 231, 235));
  border-radius: 0.5rem;
  overflow-x: auto;
}

.schema-rel__diagram {
  display: flex;
  justify-content: center;
  min-height: 200px;
}

.schema-rel__diagram :deep(svg) {
  max-width: 100%;
  height: auto;
}

.schema-rel__diagram :deep(.node) {
  cursor: pointer;
}

.schema-rel__error {
  color: var(--ui-color-error-700, rgb(190, 18, 60));
  font-size: 0.85rem;
  margin: 0.5rem 0 0;
}

.schema-rel__legend {
  margin-top: 0.75rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  font-size: 0.8rem;
  color: var(--ui-text-muted, rgb(107, 114, 128));
  align-items: center;
  justify-content: center;
}

.schema-rel__swatch {
  display: inline-block;
  width: 22px;
  height: 0;
  border-top: 2px solid #475569;
  vertical-align: middle;
  margin-right: 0.4rem;
}

.schema-rel__swatch--dashed {
  border-top-style: dashed;
  border-top-color: #94a3b8;
}

.schema-rel__legend-hint {
  font-style: italic;
}
</style>
