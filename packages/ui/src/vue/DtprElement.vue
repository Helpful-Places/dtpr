<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type { ElementDisplay } from '../core/index.js'
import DtprIcon from './DtprIcon.vue'

interface Props {
  // Pre-derived display data (use `deriveElementDisplay` from `@dtpr/ui/core`).
  display: ElementDisplay
  // Icon size in pixels. Defaults to 48.
  iconSize?: number
  // When true and `display.description` is non-empty, render the description
  // inline beneath the title. Defaults to false to preserve compact icon+title
  // cards for datachain/SSR consumers.
  showDescription?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  iconSize: 48,
  showDescription: false,
})

const slots = useSlots()

const hasDescription = computed(
  () => props.showDescription && props.display.description.length > 0,
)
const hasFooter = computed(() => !!slots.footer)
</script>

<template>
  <article
    class="dtpr-element"
    :class="{
      'dtpr-element--has-footer': hasFooter,
      'dtpr-element--proposed': display.proposed === true,
    }"
  >
    <div class="dtpr-element__main">
      <div class="dtpr-element__header">
        <DtprIcon
          class="dtpr-element__icon"
          :src="display.icon.url"
          :dark-src="display.icon.urlDark"
          :alt="display.icon.alt"
          :size="iconSize"
        />
        <div class="dtpr-element__title-block">
          <span class="dtpr-element__title">{{ display.title }}</span>
          <!--
            R15b: AI-proposed indicator. Visible by default whenever
            `display.proposed === true` (set by `buildResolvedSections`
            for elements drawn from `suggested_elements`). The compact
            view surfaces ONLY this badge — no provenance detail
            (R15c is reserved for the detail surface).
          -->
          <span
            v-if="display.proposed === true"
            class="dtpr-element__proposed-badge"
            data-dtpr-proposed="true"
          >Proposed</span>
          <span
            v-if="display.contextValue"
            class="dtpr-element__context-tag"
            :class="display.contextValue.color
              ? 'dtpr-element__context-tag--colored'
              : 'dtpr-element__context-tag--neutral'"
            :style="display.contextValue.color
              ? { backgroundColor: display.contextValue.color, color: '#fff' }
              : undefined"
          >{{ display.contextValue.name }}</span>
        </div>
      </div>
      <p v-if="hasDescription" class="dtpr-element__description">
        {{ display.description }}
      </p>
    </div>
    <div v-if="hasFooter" class="dtpr-element__footer">
      <slot name="footer" />
    </div>
  </article>
</template>
