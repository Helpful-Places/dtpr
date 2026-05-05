<script setup lang="ts">
// Sticky header strip shared across DTPR-derived surfaces (catalog,
// element pages, category pages). Owns the version + locale selectors
// and the version-missing alert; each surface composes its own
// heading, search bar, and right-rail actions via slots.
import type { SupportedLocale, SchemaVersion } from '../composables/useDtprState'

interface Props {
  activeVersion: string
  activeLocale: SupportedLocale
  selectedVersion: string
  selectedLocale: SupportedLocale
  availableVersions: SchemaVersion[]
  availableLocales: readonly SupportedLocale[]
  versionMissing?: boolean
  requestedVersion?: string | null
  latestVersion?: string
}

const props = withDefaults(defineProps<Props>(), {
  versionMissing: false,
  requestedVersion: null,
  latestVersion: '',
})

const emit = defineEmits<{
  'update:selectedVersion': [value: string]
  'update:selectedLocale': [value: SupportedLocale]
}>()

const versionItems = computed(() =>
  props.availableVersions.map((v) => ({
    label: v.id,
    description: v.status === 'stable' ? 'stable' : 'beta',
    value: v.id,
  })),
)

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  km: 'ខ្មែរ',
  pt: 'Português',
  tl: 'Tagalog',
}

const localeItems = computed(() =>
  props.availableLocales.map((l) => ({
    label: LOCALE_LABELS[l] ?? l,
    description: l,
    value: l,
  })),
)

const versionModel = computed({
  get: () => props.selectedVersion,
  set: (v: string) => emit('update:selectedVersion', v),
})

const localeModel = computed({
  get: () => props.selectedLocale,
  set: (v: SupportedLocale) => emit('update:selectedLocale', v),
})
</script>

<template>
  <header class="dtpr-page-header">
    <div class="dtpr-page-header__inner">
      <div class="dtpr-page-header__heading">
        <slot name="heading" />
      </div>
      <div class="dtpr-page-header__search">
        <slot name="search" />
      </div>
      <USelectMenu
        v-if="versionItems.length > 1"
        v-model="versionModel"
        :items="versionItems"
        value-key="value"
        class="dtpr-page-header__select dtpr-page-header__select--version"
        aria-label="Schema version"
      />
      <USelectMenu
        v-model="localeModel"
        :items="localeItems"
        value-key="value"
        class="dtpr-page-header__select dtpr-page-header__select--locale"
        aria-label="Locale"
      />
      <div class="dtpr-page-header__actions">
        <slot name="actions" />
      </div>
    </div>
    <UAlert
      v-if="versionMissing"
      class="dtpr-page-header__alert"
      color="warning"
      variant="subtle"
      icon="i-heroicons-exclamation-triangle"
      title="Unknown schema version"
      :description="`The version &quot;${requestedVersion}&quot; is not registered. Showing &quot;${latestVersion}&quot; instead.`"
    />
  </header>
</template>

<style scoped>
.dtpr-page-header {
  border-bottom: 1px solid var(--ui-border, rgb(229, 231, 235));
  background: var(--ui-bg, white);
  padding: 1rem 0;
  position: sticky;
  top: var(--ui-header-height, 0);
  z-index: 30;
  backdrop-filter: blur(8px);
}

.dtpr-page-header__inner {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 2rem;
}

.dtpr-page-header__heading {
  flex: 0 0 auto;
}

.dtpr-page-header__search {
  flex: 1 1 16rem;
  min-width: 12rem;
  max-width: 28rem;
}

.dtpr-page-header__search:empty {
  display: none;
}

.dtpr-page-header__select {
  flex: 0 0 auto;
}

.dtpr-page-header__select--version {
  min-width: 14rem;
}

.dtpr-page-header__select--locale {
  min-width: 9rem;
}

.dtpr-page-header__actions {
  flex: 0 0 auto;
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.dtpr-page-header__actions:empty {
  display: none;
}

.dtpr-page-header__alert {
  margin-top: 0.75rem;
  max-width: 80rem;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
}
</style>
