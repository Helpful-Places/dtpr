<script setup lang="ts">
// Adjacent error panel for the visualizer's input column. Lists each
// API-returned error with its `path`, `message`, and `fix_hint` so the
// user can correct in place — no per-line annotations (intentional;
// adding an editor dep was out of scope per the plan).
import type { ApiError } from '../utils/datachain-visualizer-api'

interface Props {
  errors: ApiError[]
}

const props = defineProps<Props>()
</script>

<template>
  <section v-if="props.errors.length > 0" class="dcv-errors" role="alert">
    <header class="dcv-errors__header">
      <UIcon name="i-heroicons-exclamation-triangle" class="dcv-errors__icon" />
      <h2 class="dcv-errors__title">
        {{ props.errors.length }}
        {{ props.errors.length === 1 ? 'issue' : 'issues' }} blocking render
      </h2>
    </header>
    <ol class="dcv-errors__list">
      <li
        v-for="(err, index) in props.errors"
        :key="`${err.code}-${index}`"
        class="dcv-errors__item"
      >
        <div class="dcv-errors__item-header">
          <code class="dcv-errors__code">{{ err.code }}</code>
          <code v-if="err.path" class="dcv-errors__path">{{ err.path }}</code>
        </div>
        <p class="dcv-errors__message">{{ err.message }}</p>
        <p v-if="err.fix_hint" class="dcv-errors__hint">
          <strong>Fix:</strong> {{ err.fix_hint }}
        </p>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.dcv-errors {
  border: 1px solid color-mix(in srgb, var(--ui-error, #dc2626) 30%, transparent);
  border-radius: 0.5rem;
  background: color-mix(in srgb, var(--ui-error, #dc2626) 5%, transparent);
  padding: 1rem;
}

.dcv-errors__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.dcv-errors__icon {
  color: var(--ui-error, #dc2626);
  font-size: 1.25rem;
}

.dcv-errors__title {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0;
  color: var(--ui-error, #dc2626);
}

.dcv-errors__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dcv-errors__item {
  border-top: 1px solid color-mix(in srgb, var(--ui-error, #dc2626) 20%, transparent);
  padding-top: 0.75rem;
}

.dcv-errors__item:first-child {
  border-top: 0;
  padding-top: 0;
}

.dcv-errors__item-header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.dcv-errors__code,
.dcv-errors__path {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.75rem;
  padding: 0.05rem 0.4rem;
  border-radius: 0.25rem;
  background: var(--ui-bg-elevated, rgb(249, 250, 251));
  border: 1px solid var(--ui-border, rgb(229, 231, 235));
}

.dcv-errors__path {
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
}

.dcv-errors__message {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  line-height: 1.4;
}

.dcv-errors__hint {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
  line-height: 1.4;
}

.dcv-errors__hint strong {
  color: var(--ui-text, inherit);
  font-weight: 600;
}
</style>
