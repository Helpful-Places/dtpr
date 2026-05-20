<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { DtprElement } from '@dtpr/ui/vue'
import { deriveElementDisplay } from '@dtpr/ui/core'
import type { Element, Category, InstanceElement } from '@dtpr/ui/core'

// Renders one placement of a DTPR element via <DtprElement>. The
// element id, its category, and the chosen `context_type_id` together
// drive the render — the context tag's name and hex color come from
// the schema's `category.element_context.values`, NOT from the
// caller. That's the same path the live taxonomy site uses
// (deriveElementDisplay merges the element with an InstanceElement
// against the category to resolve display strings + the context
// value). The caller only commits to the data identifiers; the
// schema owns the labels and colors.
interface Props {
  elementId: string
  // Optional — when set, the resolved display will carry a
  // `contextValue` resolved against the category's `element_context.values`
  // (e.g. 'identifiable' on input_dataset, 'human_executes' on
  // functional_modes, 'deployer' on accountable).
  contextTypeId?: string
  // Optional — instance-level description override. When provided,
  // this becomes the placement's `additional_description` variable
  // value, exposed to the element's description template. When the
  // element's description template doesn't reference variables, the
  // override is rendered via the slot path below instead.
  descriptionOverride?: string
  // Optional — instance-level title override. The schema-side element
  // title is the *type* ("Institution"), which is correct for taxonomy
  // views but wrong for a placement where the audience needs the
  // specific actor ("NYC Dept of Education"). Overrides the rendered
  // `display.title` without touching the upstream element record.
  titleOverride?: string
  schemaVersion?: string
  locale?: string
  iconSize?: number
  showDescription?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  schemaVersion: 'ai@2026-05-06-beta',
  locale: 'en',
  iconSize: 56,
  showDescription: true,
  contextTypeId: undefined,
  descriptionOverride: undefined,
  titleOverride: undefined,
})

const API_BASE = 'https://api.dtpr.io/api/v2'

const element = ref<Element | null>(null)
const category = ref<Category | null>(null)
const error = ref<string | null>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  error.value = null
  try {
    const elURL = `${API_BASE}/schemas/${props.schemaVersion}/elements/${encodeURIComponent(props.elementId)}?fields=all&locales=${encodeURIComponent(props.locale)}`
    const elRes = await fetch(elURL)
    if (!elRes.ok) throw new Error(`element HTTP ${elRes.status}`)
    const elJson = (await elRes.json()) as { ok: boolean; element: Element }
    if (!elJson.ok) throw new Error('element API ok=false')
    element.value = elJson.element

    const categoryId = (elJson.element as Element & { category_id?: string }).category_id
    if (categoryId) {
      const catURL = `${API_BASE}/schemas/${props.schemaVersion}/categories?locales=${encodeURIComponent(props.locale)}`
      const catRes = await fetch(catURL)
      if (!catRes.ok) throw new Error(`categories HTTP ${catRes.status}`)
      const catJson = (await catRes.json()) as { ok: boolean; categories: Category[] }
      if (!catJson.ok) throw new Error('categories API ok=false')
      category.value = catJson.categories.find((c) => c.id === categoryId) ?? null
    }
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

// Compose the icon URL against the REST `icon[.<variant>].svg` route.
// When the placement carries a `contextTypeId`, the variant URL pre-
// composes the icon with the context value's color (e.g.
// `icon.identifiable.svg` fills the shape with the PII colour, with
// auto-contrasting inner symbol; `icon.identifiable.dark.svg` is the
// dark companion). When no context type is selected, fall back to
// the plain `icon.svg` / `icon.dark.svg` pair.
//
// Tag-style context values (color: null — e.g. accountable's
// `deployer` / `vendor`) resolve to the same bytes as `default` on
// the server, so the URL is still safe to request.
function iconUrl(variant: 'default' | 'dark') {
  const ctx = props.contextTypeId
  const segment = ctx
    ? variant === 'dark'
      ? `icon.${ctx}.dark.svg`
      : `icon.${ctx}.svg`
    : variant === 'dark'
      ? 'icon.dark.svg'
      : 'icon.svg'
  return `${API_BASE}/schemas/${props.schemaVersion}/elements/${encodeURIComponent(props.elementId)}/${segment}`
}

// Build a minimal InstanceElement so `deriveElementDisplay` can
// resolve the chosen context value against the category's
// `element_context.values`. The override (when set) flows in as the
// instance-side description variable.
const instance = computed<InstanceElement | undefined>(() => {
  if (!props.contextTypeId && !props.descriptionOverride) return undefined
  const inst: InstanceElement = {
    element_id: props.elementId,
    priority: 0,
    variables: props.descriptionOverride
      ? [
          {
            id: 'additional_description',
            value: [{ locale: props.locale, value: props.descriptionOverride }],
          },
        ]
      : [],
    actions: [],
    sources: [],
    ...(props.contextTypeId ? { context_type_id: props.contextTypeId } : {}),
  }
  return inst
})

const display = computed(() => {
  if (!element.value) return null
  const derived = deriveElementDisplay(element.value, instance.value, props.locale, {
    iconUrl: iconUrl('default'),
    iconUrlDark: iconUrl('dark'),
    category: category.value ?? undefined,
  })
  if (props.titleOverride) {
    return { ...derived, title: props.titleOverride }
  }
  return derived
})
</script>

<template>
  <div class="dtpr-placement">
    <div v-if="loading" class="dtpr-placement__status">Loading {{ elementId }}…</div>
    <div v-else-if="error" class="dtpr-placement__status dtpr-placement__status--err">
      Failed to load {{ elementId }}: {{ error }}
    </div>
    <DtprElement
      v-else-if="display"
      :display="display"
      :icon-size="iconSize"
      :show-description="showDescription"
    />
  </div>
</template>

<style scoped>
.dtpr-placement {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.dtpr-placement :deep(.dtpr-element) {
  height: 100%;
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
  color: var(--dtpr-color-warning, #f04a4a);
  opacity: 1;
}
</style>
