<script setup lang="ts">
// Two converging input modes for a DatachainInstance JSON: paste into
// the textarea, or drop / file-pick a `.json` file. Both write into the
// same `v-model:json` so the parent can hand the value straight to the
// validate-and-resolve pipeline (U3) without caring how it arrived.
//
// File loading is intentionally tolerant — we surface a small inline
// notice on a non-`.json` drop rather than throwing — and never
// auto-submits, so the user can review the loaded text before rendering.
import { ref } from 'vue'

interface Props {
  json: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  'update:json': [value: string]
  submit: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const dragActive = ref(false)
const dropError = ref<string | null>(null)

function setJson(next: string) {
  emit('update:json', next)
}

function isJsonFile(file: File): boolean {
  if (file.type === 'application/json') return true
  return file.name.toLowerCase().endsWith('.json')
}

async function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') resolve(result)
      else reject(new Error('FileReader returned non-string result'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'))
    reader.readAsText(file)
  })
}

async function ingestFile(file: File) {
  dropError.value = null
  if (!isJsonFile(file)) {
    dropError.value = `“${file.name}” is not a .json file. Drop a .json file or paste the JSON instead.`
    return
  }
  try {
    const text = await readFile(file)
    setJson(text)
  } catch (err) {
    dropError.value = `Could not read “${file.name}”: ${(err as Error).message}`
  }
}

function onDrop(event: DragEvent) {
  dragActive.value = false
  const files = event.dataTransfer?.files
  if (!files || files.length === 0) return
  void ingestFile(files[0])
}

function onDragOver() {
  dragActive.value = true
}

function onDragLeave() {
  dragActive.value = false
}

function onPickClick() {
  fileInput.value?.click()
}

function onFilePicked(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) void ingestFile(file)
  // Reset so picking the same file again still fires `change`.
  input.value = ''
}

function onTextareaInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  setJson(target.value)
}

function onSubmit() {
  emit('submit')
}

function onTextareaKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault()
    onSubmit()
  }
}

function onClear() {
  setJson('')
  dropError.value = null
}
</script>

<template>
  <section class="dcv-input">
    <div class="dcv-input__toolbar">
      <span class="dcv-input__label">DatachainInstance JSON</span>
      <div class="dcv-input__toolbar-actions">
        <UButton
          size="xs"
          color="neutral"
          variant="subtle"
          icon="i-heroicons-document-arrow-up"
          @click="onPickClick"
        >
          Open file
        </UButton>
        <UButton
          v-if="props.json.length > 0"
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-heroicons-x-mark"
          @click="onClear"
        >
          Clear
        </UButton>
      </div>
    </div>

    <div
      class="dcv-input__drop"
      :class="{ 'dcv-input__drop--active': dragActive }"
      @dragover.prevent="onDragOver"
      @dragenter.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <textarea
        class="dcv-input__textarea"
        :value="props.json"
        spellcheck="false"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        placeholder='{ "schema_version": "ai@2026-05-06-beta", ... }'
        rows="18"
        @input="onTextareaInput"
        @keydown="onTextareaKeydown"
      />
      <p v-if="dragActive" class="dcv-input__drop-hint" aria-hidden="true">
        Drop a <code>.json</code> file to load it
      </p>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".json,application/json"
      class="dcv-input__file"
      @change="onFilePicked"
    />

    <p v-if="dropError" class="dcv-input__drop-error" role="alert">
      {{ dropError }}
    </p>

    <div class="dcv-input__actions">
      <UButton
        color="primary"
        :loading="props.loading"
        :disabled="props.json.length === 0 || props.loading"
        icon="i-heroicons-play"
        @click="onSubmit"
      >
        Render
      </UButton>
      <span class="dcv-input__hint">
        <kbd>⌘</kbd>/<kbd>Ctrl</kbd>+<kbd>Enter</kbd> from the textarea also submits.
      </span>
    </div>
  </section>
</template>

<style scoped>
.dcv-input {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dcv-input__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.dcv-input__label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
}

.dcv-input__toolbar-actions {
  display: flex;
  gap: 0.5rem;
}

.dcv-input__drop {
  position: relative;
  border: 1px dashed var(--ui-border, rgb(229, 231, 235));
  border-radius: 0.5rem;
  background: var(--ui-bg-elevated, rgb(249, 250, 251));
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.dcv-input__drop--active {
  border-color: var(--ui-primary, #10b981);
  background-color: color-mix(in srgb, var(--ui-primary, #10b981) 6%, transparent);
}

.dcv-input__textarea {
  width: 100%;
  min-height: 18rem;
  padding: 0.75rem 1rem;
  font-family: ui-monospace, SFMono-Regular, "Menlo", monospace;
  font-size: 0.8125rem;
  line-height: 1.45;
  background: transparent;
  border: 0;
  outline: 0;
  resize: vertical;
  color: var(--ui-text, inherit);
}

.dcv-input__drop-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  font-size: 0.875rem;
  color: var(--ui-primary, #10b981);
  pointer-events: none;
  background: color-mix(in srgb, var(--ui-bg, white) 70%, transparent);
}

.dcv-input__drop-hint code {
  font-family: ui-monospace, SFMono-Regular, monospace;
  background: var(--ui-bg, white);
  padding: 0.05rem 0.35rem;
  border-radius: 0.25rem;
  margin: 0 0.15rem;
}

.dcv-input__file {
  display: none;
}

.dcv-input__drop-error {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--ui-error, #dc2626);
}

.dcv-input__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dcv-input__hint {
  font-size: 0.75rem;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
}

.dcv-input__hint kbd {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.7rem;
  padding: 0.05rem 0.3rem;
  border: 1px solid var(--ui-border, rgb(229, 231, 235));
  border-radius: 0.2rem;
  background: var(--ui-bg-elevated, rgb(249, 250, 251));
}
</style>
