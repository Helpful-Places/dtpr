<script setup lang="ts">
// Object reference page — displays the JSON Schema for every top-level
// DTPR schema directly from `api/src/schema/`. The build script
// `scripts/emit-object-reference.ts` runs `emitAllContentSchemas()`
// from the api package and writes the full set to
// `.data/object-reference.json` before `nuxt dev` / `nuxt build` —
// so this page stays in lockstep with the runtime contract.
import schemas from '../../.data/object-reference.json'
import {
  DTPR_API_BASE,
  DTPR_FETCH_TIMEOUT_MS,
  useDtprState,
} from '../composables/useDtprState'

const {
  activeVersion,
  activeLocale,
} = useDtprState()

interface CategoriesResponse {
  ok: boolean
  version: string
  categories: unknown[]
}

interface ElementsResponse {
  ok: boolean
  version: string
  elements: unknown[]
}

interface ManifestResponse {
  ok: boolean
  version: string
  manifest: unknown
}

const categoriesUrl = computed(() =>
  activeVersion.value
    ? `${DTPR_API_BASE}/schemas/${activeVersion.value}/categories?locales=${activeLocale.value},en`
    : null,
)

const elementsUrl = computed(() =>
  activeVersion.value
    ? `${DTPR_API_BASE}/schemas/${activeVersion.value}/elements?fields=all&limit=200&locales=${activeLocale.value},en`
    : null,
)

const manifestUrl = computed(() =>
  activeVersion.value
    ? `${DTPR_API_BASE}/schemas/${activeVersion.value}/manifest`
    : null,
)

const { data: liveManifest } = await useAsyncData<ManifestResponse | undefined>(
  'object-reference-manifest',
  () =>
    manifestUrl.value
      ? $fetch<ManifestResponse>(manifestUrl.value, { timeout: DTPR_FETCH_TIMEOUT_MS })
      : Promise.resolve(undefined),
  { watch: [activeVersion] },
)

const { data: liveCategories } = await useAsyncData<CategoriesResponse | undefined>(
  'object-reference-categories',
  () =>
    categoriesUrl.value
      ? $fetch<CategoriesResponse>(categoriesUrl.value, { timeout: DTPR_FETCH_TIMEOUT_MS })
      : Promise.resolve(undefined),
  { watch: [activeVersion, activeLocale] },
)

const { data: liveElements } = await useAsyncData<ElementsResponse | undefined>(
  'object-reference-elements',
  () =>
    elementsUrl.value
      ? $fetch<ElementsResponse>(elementsUrl.value, { timeout: DTPR_FETCH_TIMEOUT_MS })
      : Promise.resolve(undefined),
  { watch: [activeVersion, activeLocale] },
)

const liveManifestValue = computed(() => liveManifest.value?.manifest ?? null)
const liveCategoriesValue = computed(() => liveCategories.value?.categories ?? [])
const liveElementsValue = computed(() => liveElements.value?.elements ?? [])

useHead({
  title: 'Object reference — DTPR for AI',
  meta: [
    {
      name: 'description',
      content:
        'JSON Schema reference for every top-level DTPR object (Manifest, DatachainType, Category, Element, DatachainInstance, ResolvedDatachainInstance, AuthoringProvenance), generated from the canonical Zod sources.',
    },
  ],
})

type JsonSchema = Record<string, any>

interface ObjectEntry {
  name: string
  group: 'definitions' | 'instances'
  blurb: string
  schema: JsonSchema
}

// Authored ordering — matches the on-page diagram and walks definition
// schemas first, then instance schemas. Each blurb is a one-liner that
// frames the object before the JSON Schema details below it.
const objects: ObjectEntry[] = [
  {
    name: 'Manifest',
    group: 'definitions',
    blurb:
      'Per-version metadata served at /api/v2/schemas/:version/manifest. Pins the version string, status (beta/stable), content hash, and locale allow-list for one schema release.',
    schema: (schemas as any).Manifest,
  },
  {
    name: 'DatachainType',
    group: 'definitions',
    blurb:
      'Top-level grouping such as `ai`. Declares the ordered category list, optional subchains, and the locale allow-list mirrored onto the Manifest.',
    schema: (schemas as any).DatachainType,
  },
  {
    name: 'Category',
    group: 'definitions',
    blurb:
      'A bucket of elements within a datachain type (e.g. `accountable`). Owns variables that elements inherit and an optional context dimension.',
    schema: (schemas as any).Category,
  },
  {
    name: 'Element',
    group: 'definitions',
    blurb:
      'A reusable tile placed in a category via `category_id`. Carries localized title/description, an icon symbol, materialized variables, and optional element-level context.',
    schema: (schemas as any).Element,
  },
  {
    name: 'DatachainInstance',
    group: 'instances',
    blurb:
      'A concrete authored disclosure (e.g. "Worcester license plate reader"). Pins a `schema_version` and references elements by id. The raw, pre-resolution wire form.',
    schema: (schemas as any).DatachainInstance,
  },
  {
    name: 'ResolvedDatachainInstance',
    group: 'instances',
    blurb:
      'Strict superset of DatachainInstance with a frozen `schema_snapshot` (full DatachainType + Category + Element definitions), optional AI-suggested elements, and optional authoring provenance.',
    schema: (schemas as any).ResolvedDatachainInstance,
  },
  {
    name: 'AuthoringProvenance',
    group: 'instances',
    blurb:
      'Discriminated union (`human` | `ai_generated`) attached to a ResolvedDatachainInstance. The AI variant carries per-element rationale, confidence buckets, cited quotes, and optional model metadata.',
    schema: (schemas as any).AuthoringProvenance,
  },
]
</script>

<template>
  <main class="object-reference">
    <header class="object-reference__header">
      <h1>Object reference</h1>
      <p class="object-reference__lede">
        JSON Schema for every top-level DTPR object, generated from the
        canonical Zod definitions in
        <code>api/src/schema/</code>. Field names, types, required-ness,
        defaults, and descriptions reflect the runtime contract — they
        regenerate on every build, so this page cannot drift.
      </p>
      <p class="object-reference__meta">
        Emitter:
        <code>z.toJSONSchema</code>, draft-2020-12,
        <code>io: 'input'</code> (pre-transform shape — what callers must
        supply).
      </p>
    </header>

    <section class="object-reference__map">
      <h2 class="object-reference__map-title">How they fit together</h2>
      <SchemaRelationshipDiagram />
    </section>

    <nav class="object-reference__toc" aria-label="Schemas on this page">
      <span class="object-reference__toc-label">Jump to</span>
      <ul>
        <li v-for="obj in objects" :key="obj.name">
          <a :href="`#${obj.name}`"><code>{{ obj.name }}</code></a>
        </li>
        <li>
          <a href="#live-data">Live data</a>
        </li>
      </ul>
    </nav>

    <section
      v-for="obj in objects"
      :key="obj.name"
      class="object-reference__section"
      :id="obj.name"
      :data-group="obj.group"
    >
      <h2>
        <code>{{ obj.name }}</code>
        <span
          class="object-reference__pill"
          :data-group="obj.group"
        >{{ obj.group === 'definitions' ? 'definition' : 'instance' }}</span>
      </h2>
      <p class="object-reference__blurb">{{ obj.blurb }}</p>
      <p
        v-if="obj.schema.description && obj.schema.description !== obj.blurb"
        class="object-reference__intro"
      >
        {{ obj.schema.description }}
      </p>
      <SchemaTree :schema="obj.schema" />
    </section>

    <section class="object-reference__live" id="live-data">
      <h2 class="object-reference__live-title">Live data</h2>
      <p class="object-reference__live-hint">
        Real payloads from the active schema version
        (<code>{{ activeVersion || '…' }}</code>) at locale
        <code>{{ activeLocale }}</code>. These are the same responses the
        renderer and MCP tools receive — every field maps to the schema
        breakdowns above.
      </p>
      <div class="object-reference__live-list">
        <JsonViewer
          :value="liveManifestValue"
          :label="`GET /schemas/${activeVersion || ':version'}/manifest`"
        />
        <JsonViewer
          :value="liveCategoriesValue"
          :label="`GET /schemas/${activeVersion || ':version'}/categories — ${liveCategoriesValue.length} categor${liveCategoriesValue.length === 1 ? 'y' : 'ies'}`"
        />
        <JsonViewer
          :value="liveElementsValue"
          :label="`GET /schemas/${activeVersion || ':version'}/elements — ${liveElementsValue.length} element${liveElementsValue.length === 1 ? '' : 's'}`"
        />
      </div>
    </section>
  </main>
</template>

<style scoped>
.object-reference {
  max-width: 56rem;
  margin: 0 auto;
  padding: 2rem 1.5rem 4rem;
}

.object-reference__header {
  margin-bottom: 2rem;
}

.object-reference__header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.75rem;
}

.object-reference__lede {
  font-size: 1rem;
  line-height: 1.55;
  color: var(--ui-text-primary, inherit);
  margin: 0 0 0.5rem;
}

.object-reference__meta {
  font-size: 0.85rem;
  color: var(--ui-text-muted, rgb(107, 114, 128));
  margin: 0;
}

.object-reference__map {
  margin-bottom: 2.5rem;
}

.object-reference__map-title {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  color: var(--ui-text-primary, inherit);
}

.object-reference__toc {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  padding: 0.75rem 1rem;
  margin-bottom: 2.5rem;
  border: 1px solid var(--ui-border, rgb(229, 231, 235));
  border-radius: 0.5rem;
  background: var(--ui-bg-muted, rgb(249, 250, 251));
  font-size: 0.85rem;
}

.object-reference__toc-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted, rgb(107, 114, 128));
  font-weight: 600;
  margin-right: 0.25rem;
}

.object-reference__toc ul {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.6rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.object-reference__toc a {
  text-decoration: none;
  color: inherit;
}

.object-reference__toc a:hover {
  text-decoration: underline;
}

.object-reference__section {
  margin-bottom: 3rem;
  scroll-margin-top: calc(var(--ui-header-height, 0) + 1rem);
}

.object-reference__section h2 {
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  border-bottom: 1px solid var(--ui-border, rgb(229, 231, 235));
  padding-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.object-reference__section h2 code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.4rem;
}

.object-reference__pill {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  padding: 0.1rem 0.45rem;
  border-radius: 0.375rem;
  border: 1px solid transparent;
}

.object-reference__pill[data-group='definitions'] {
  color: #4338ca;
  background: #eef2ff;
  border-color: #c7d2fe;
}

.object-reference__pill[data-group='instances'] {
  color: #047857;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.object-reference__blurb {
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 0.5rem;
  color: var(--ui-text-primary, inherit);
}

.object-reference__intro {
  font-size: 0.9rem;
  color: var(--ui-text-muted, rgb(75, 85, 99));
  line-height: 1.5;
  margin: 0 0 1.25rem;
}

.object-reference code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  background: var(--ui-bg-muted, rgb(243, 244, 246));
  padding: 0.05rem 0.3rem;
  border-radius: 0.25rem;
}

.object-reference__live {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--ui-border, rgb(229, 231, 235));
  scroll-margin-top: calc(var(--ui-header-height, 0) + 1rem);
}

.object-reference__live-title {
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.object-reference__live-hint {
  font-size: 0.9rem;
  color: var(--ui-text-muted, rgb(107, 114, 128));
  line-height: 1.5;
  margin: 0 0 1.25rem;
}

.object-reference__live-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.object-reference__lede code,
.object-reference__meta code {
  font-size: 0.85em;
}

.object-reference__toc code {
  background: transparent;
  padding: 0;
}
</style>
