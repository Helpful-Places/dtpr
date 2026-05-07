<script setup lang="ts">
// Shared "View element/category →" affordance used in card and section
// footers across the taxonomy catalog and category-detail pages.
// Consolidates the markup + styling so both pages stay visually
// synchronized (color, focus ring, icon nudge) automatically.

interface Props {
  to: string
  label: string
}

defineProps<Props>()
</script>

<template>
  <NuxtLinkLocale :to="to" class="taxonomy-view-link">
    <span>{{ label }}</span>
    <UIcon name="i-heroicons-arrow-right" class="taxonomy-view-link__icon" />
  </NuxtLinkLocale>
</template>

<style scoped>
/*
 * Always-visible bottom-right action. Accent color on hover, with a
 * small arrow nudge.
 */
.taxonomy-view-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
  text-decoration: none;
  transition: color 0.15s ease;
}

.taxonomy-view-link:hover,
.taxonomy-view-link:focus-visible {
  color: var(--ui-primary, #10b981);
  outline: 0;
}

.taxonomy-view-link:focus-visible {
  outline: 2px solid var(--ui-primary, #10b981);
  outline-offset: 2px;
  border-radius: 0.25rem;
}

.taxonomy-view-link__icon {
  width: 0.875rem;
  height: 0.875rem;
  transition: transform 0.15s ease;
}

.taxonomy-view-link:hover .taxonomy-view-link__icon,
.taxonomy-view-link:focus-visible .taxonomy-view-link__icon {
  transform: translateX(2px);
}
</style>
