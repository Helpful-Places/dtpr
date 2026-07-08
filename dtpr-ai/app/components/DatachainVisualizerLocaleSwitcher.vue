<script setup lang="ts">
// Chip row above the rendered chain that lists every locale the chain
// actually carries (per `collectPresentLocales`). Switching emits
// `update:locale`; the parent rebinds the render component and Vue's
// reactivity reruns `buildResolvedSections` without a refetch.

interface Props {
  available: readonly string[]
  locale: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:locale': [value: string]
}>()

function localeLabel(code: string): string {
  try {
    const dn = new Intl.DisplayNames([code, 'en'], { type: 'language' })
    const label = dn.of(code)
    if (label && label.toLowerCase() !== code.toLowerCase()) return label
  } catch {
    // Intl.DisplayNames not available or rejects the tag — fall through.
  }
  return code
}

function onClick(code: string) {
  if (code === props.locale) return
  emit('update:locale', code)
}
</script>

<template>
  <div v-if="props.available.length > 1" class="dcv-locale-switcher">
    <span class="dcv-locale-switcher__label">Locale</span>
    <div class="dcv-locale-switcher__chips" role="radiogroup" aria-label="Render locale">
      <button
        v-for="code in props.available"
        :key="code"
        type="button"
        role="radio"
        :aria-checked="code === props.locale"
        class="dcv-locale-switcher__chip"
        :class="{ 'dcv-locale-switcher__chip--active': code === props.locale }"
        @click="onClick(code)"
      >
        <span class="dcv-locale-switcher__code">{{ code }}</span>
        <span class="dcv-locale-switcher__name">{{ localeLabel(code) }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.dcv-locale-switcher {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.dcv-locale-switcher__label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
}

.dcv-locale-switcher__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.dcv-locale-switcher__chip {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  border: 1px solid var(--ui-border, rgb(229, 231, 235));
  border-radius: 999px;
  background: var(--ui-bg, white);
  cursor: pointer;
  font-size: 0.8125rem;
  color: var(--ui-text, inherit);
  transition: background-color 0.1s ease, border-color 0.1s ease;
}

.dcv-locale-switcher__chip:hover {
  background: var(--ui-bg-elevated, rgb(249, 250, 251));
}

.dcv-locale-switcher__chip--active {
  background: color-mix(in srgb, var(--ui-primary, #10b981) 12%, transparent);
  border-color: var(--ui-primary, #10b981);
  color: var(--ui-primary, #10b981);
  font-weight: 600;
}

.dcv-locale-switcher__code {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.75rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.dcv-locale-switcher__name {
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
  font-size: 0.75rem;
}

.dcv-locale-switcher__chip--active .dcv-locale-switcher__name {
  color: inherit;
}
</style>
