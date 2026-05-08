<script setup lang="ts">
// Collapsible pretty-printed JSON block with a copy-to-clipboard button.
// Used to expose raw API payloads alongside the rendered taxonomy and
// the schema reference page so authors can inspect the contract their
// disclosures will need to satisfy.
import { computed, ref } from 'vue'

interface Props {
  // The data to render. Anything `JSON.stringify` can serialize.
  value: unknown
  // <summary> label for the disclosure.
  label?: string
  // Whether the disclosure is open by default.
  open?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Raw JSON',
  open: false,
})

const formatted = computed<string>(() => {
  try {
    return JSON.stringify(props.value, null, 2)
  } catch (err) {
    return `// Failed to serialize: ${err instanceof Error ? err.message : String(err)}`
  }
})

const lineCount = computed(() => formatted.value.split('\n').length)

const copyState = ref<'idle' | 'copied' | 'error'>('idle')
let copyTimer: ReturnType<typeof setTimeout> | null = null

async function copy() {
  if (copyTimer) clearTimeout(copyTimer)
  try {
    await navigator.clipboard.writeText(formatted.value)
    copyState.value = 'copied'
  } catch {
    copyState.value = 'error'
  }
  copyTimer = setTimeout(() => {
    copyState.value = 'idle'
  }, 1500)
}
</script>

<template>
  <details class="json-viewer" :open="open">
    <summary class="json-viewer__summary">
      <span class="json-viewer__label">{{ label }}</span>
      <span class="json-viewer__meta">{{ lineCount }} line{{ lineCount === 1 ? '' : 's' }}</span>
    </summary>
    <div class="json-viewer__body">
      <button
        type="button"
        class="json-viewer__copy"
        :data-state="copyState"
        @click="copy"
      >
        {{ copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy' }}
      </button>
      <pre class="json-viewer__pre"><code>{{ formatted }}</code></pre>
    </div>
  </details>
</template>

<style scoped>
.json-viewer {
  border: 1px solid var(--ui-border, rgb(229, 231, 235));
  border-radius: 0.5rem;
  background: var(--ui-bg-muted, rgb(249, 250, 251));
  overflow: hidden;
}

.json-viewer__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 0.85rem;
  cursor: pointer;
  font-size: 0.85rem;
  list-style: none;
  user-select: none;
}

.json-viewer__summary::-webkit-details-marker {
  display: none;
}

.json-viewer__summary::before {
  content: '▸';
  font-size: 0.75rem;
  color: var(--ui-text-muted, rgb(107, 114, 128));
  margin-right: 0.25rem;
  transition: transform 0.15s ease-out;
}

.json-viewer[open] > .json-viewer__summary::before {
  transform: rotate(90deg);
  display: inline-block;
}

.json-viewer__label {
  flex: 1 1 auto;
  font-weight: 600;
  color: var(--ui-text-primary, inherit);
}

.json-viewer__meta {
  font-size: 0.75rem;
  color: var(--ui-text-muted, rgb(107, 114, 128));
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.json-viewer__body {
  position: relative;
  border-top: 1px solid var(--ui-border, rgb(229, 231, 235));
  background: var(--ui-bg, white);
}

.json-viewer__copy {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.55rem;
  border-radius: 0.3rem;
  border: 1px solid var(--ui-border, rgb(229, 231, 235));
  background: var(--ui-bg-muted, rgb(249, 250, 251));
  color: var(--ui-text-primary, inherit);
  cursor: pointer;
  z-index: 1;
}

.json-viewer__copy:hover {
  border-color: var(--ui-primary, #10b981);
  color: var(--ui-primary, #10b981);
}

.json-viewer__copy[data-state='copied'] {
  border-color: var(--ui-color-success-500, #10b981);
  color: var(--ui-color-success-700, #047857);
}

.json-viewer__copy[data-state='error'] {
  border-color: var(--ui-color-error-500, #ef4444);
  color: var(--ui-color-error-700, #b91c1c);
}

.json-viewer__pre {
  margin: 0;
  padding: 0.75rem 0.9rem;
  max-height: 32rem;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--ui-text-primary, inherit);
  white-space: pre;
  tab-size: 2;
}

.json-viewer__pre code {
  font-family: inherit;
  background: transparent;
  padding: 0;
}
</style>
