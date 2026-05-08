<script setup lang="ts">
// Object reference page — displays the JSON Schema for the two
// datachain wire forms (`DatachainInstance` and `ResolvedDatachain`)
// directly from `api/src/schema/`. The build script
// `scripts/emit-object-reference.ts` runs `emitAllContentSchemas()`
// from the api package and writes a slim subset to
// `.data/object-reference.json` before `nuxt dev` / `nuxt build` —
// so this page stays in lockstep with the runtime contract.
import schemas from '../../.data/object-reference.json'

useHead({
  title: 'Object reference — DTPR for AI',
  meta: [
    {
      name: 'description',
      content:
        'JSON Schema reference for the DTPR datachain wire forms (DatachainInstance and ResolvedDatachain), generated from the canonical Zod sources.',
    },
  ],
})

type JsonSchema = Record<string, any>

interface ObjectEntry {
  name: 'DatachainInstance' | 'ResolvedDatachain'
  schema: JsonSchema
}

const objects: ObjectEntry[] = [
  { name: 'DatachainInstance', schema: (schemas as any).DatachainInstance },
  { name: 'ResolvedDatachain', schema: (schemas as any).ResolvedDatachain },
]
</script>

<template>
  <main class="object-reference">
    <header class="object-reference__header">
      <h1>Object reference</h1>
      <p class="object-reference__lede">
        JSON Schema for the two datachain wire forms, generated from the
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

    <section
      v-for="obj in objects"
      :key="obj.name"
      class="object-reference__section"
      :id="obj.name"
    >
      <h2>
        <code>{{ obj.name }}</code>
      </h2>
      <p
        v-if="obj.schema.description"
        class="object-reference__intro"
      >
        {{ obj.schema.description }}
      </p>
      <SchemaTree :schema="obj.schema" />
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
  margin-bottom: 2.5rem;
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

.object-reference__section {
  margin-bottom: 3rem;
  scroll-margin-top: calc(var(--ui-header-height, 0) + 1rem);
}

.object-reference__section h2 {
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0 0 0.75rem;
  border-bottom: 1px solid var(--ui-border, rgb(229, 231, 235));
  padding-bottom: 0.5rem;
}

.object-reference__section h2 code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.4rem;
}

.object-reference__intro {
  font-size: 0.95rem;
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

.object-reference__lede code,
.object-reference__meta code {
  font-size: 0.85em;
}
</style>
