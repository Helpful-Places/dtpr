<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

// Renders one placement of a DTPR element with plain markup. The
// element id, its category, and the chosen `context_type_id` together
// drive the render — the context tag's name and hex color come from
// the schema's `category.element_context.values`, NOT from the
// caller. The caller only commits to the data identifiers; the schema
// (fetched from the DTPR API) owns the labels and colors.
interface Props {
  elementId: string
  // Optional — when set, the placement carries a context tag resolved
  // against the category's `element_context.values` (e.g. 'identifiable'
  // on input_dataset, 'human_oversees' on action, 'deployer' on
  // accountable).
  contextTypeId?: string
  // Optional — instance-level description override, rendered in place
  // of the element's schema-side description.
  descriptionOverride?: string
  // Optional — instance-level title override. The schema-side element
  // title is the *type* ("Institution"), which is correct for taxonomy
  // views but wrong for a placement where the audience needs the
  // specific actor ("NYC Dept of Education"). Overrides the rendered
  // title without touching the upstream element record.
  titleOverride?: string
  schemaVersion?: string
  locale?: string
  iconSize?: number
  showDescription?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  schemaVersion: 'dtpr@2026-09-01-beta',
  locale: 'en',
  iconSize: 56,
  showDescription: true,
  contextTypeId: undefined,
  descriptionOverride: undefined,
  titleOverride: undefined,
})

const element = ref<DtprElement | null>(null)
const category = ref<DtprCategory | null>(null)
const error = ref<string | null>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  error.value = null
  try {
    const base = dtprSchemaUrl(props.schemaVersion)
    const elURL = `${base}/elements/${encodeURIComponent(props.elementId)}?fields=all&locales=${encodeURIComponent(props.locale)}`
    const elRes = await fetch(elURL)
    if (!elRes.ok) throw new Error(`element HTTP ${elRes.status}`)
    const elJson = (await elRes.json()) as { ok: boolean; element: DtprElement }
    if (!elJson.ok) throw new Error('element API ok=false')
    element.value = elJson.element

    const catURL = `${base}/categories?locales=${encodeURIComponent(props.locale)}`
    const catRes = await fetch(catURL)
    if (!catRes.ok) throw new Error(`categories HTTP ${catRes.status}`)
    const catJson = (await catRes.json()) as { ok: boolean; categories: DtprCategory[] }
    if (!catJson.ok) throw new Error('categories API ok=false')
    category.value = catJson.categories.find((c) => c.id === elJson.element.category_id) ?? null
  } catch (e) {
    error.value = (e as Error).message
    element.value = null
    category.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(
  () => [props.elementId, props.schemaVersion, props.locale],
  load,
)

// When the placement carries a `contextTypeId` whose context value has
// a colour, the variant URL pre-composes the icon with that colour
// (e.g. `icon.identifiable.svg`). Tag-style context values (color:
// null — e.g. accountable's `deployer` / `vendor`) have no variant of
// their own and fall back to the plain `icon.svg`.
const iconUrl = computed(() =>
  element.value
    ? dtprIconUrl(props.schemaVersion, props.elementId, dtprIconVariant(element.value, props.contextTypeId))
    : '',
)

const contextValue = computed(() =>
  category.value?.element_context?.values.find((v) => v.id === props.contextTypeId) ?? null,
)

const title = computed(() =>
  props.titleOverride ?? dtprFill(dtprText(element.value?.title, props.locale)),
)

const description = computed(() =>
  props.descriptionOverride ?? dtprFill(dtprText(element.value?.description, props.locale)),
)
</script>

<template>
  <div class="dtpr-placement">
    <div v-if="loading" class="dtpr-placement__status">Loading {{ elementId }}…</div>
    <div v-else-if="error" class="dtpr-placement__status dtpr-placement__status--err">
      Failed to load {{ elementId }}: {{ error }}
    </div>
    <div v-else-if="element" class="dtpr-placement__card">
      <img :src="iconUrl" alt="" :width="iconSize" :height="iconSize" class="dtpr-placement__icon" />
      <div class="dtpr-placement__title">{{ title }}</div>
      <span v-if="contextValue" class="dtpr-placement__tag">
        <span
          v-if="contextValue.color"
          class="dtpr-placement__tag-dot"
          :style="{ backgroundColor: contextValue.color }"
        />
        {{ dtprText(contextValue.name, locale) }}
      </span>
      <p v-if="showDescription && description" class="dtpr-placement__description">{{ description }}</p>
    </div>
  </div>
</template>

<style scoped>
.dtpr-placement {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.dtpr-placement__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  height: 100%;
  padding: 0.75rem;
  text-align: center;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
}
.dtpr-placement__icon {
  flex: none;
  object-fit: contain;
}
.dtpr-placement__title {
  font-weight: 600;
  line-height: 1.25;
}
.dtpr-placement__tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 999px;
}
.dtpr-placement__tag-dot {
  flex: none;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
}
.dtpr-placement__description {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.75;
}
.dtpr-placement__status {
  font-size: 0.85rem;
  opacity: 0.6;
  padding: 0.75rem;
  text-align: center;
  border: 1px dashed rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
}
.dtpr-placement__status--err {
  color: #f04a4a;
  opacity: 1;
}
</style>
