<script setup lang="ts">
// Sidebar listing the personal-collection entries. Owns the rename
// inline editor and the delete confirm. Emits `select` when a row is
// clicked so the parent can rehydrate the input + re-run validation.
import { ref } from 'vue'
import type { CollectionEntry } from '../utils/datachain-visualizer-collection'

interface Props {
  entries: CollectionEntry[]
  selectedId?: string | null
  unavailable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: null,
  unavailable: false,
})

const emit = defineEmits<{
  select: [id: string]
  rename: [id: string, name: string]
  delete: [id: string]
}>()

const renamingId = ref<string | null>(null)
const renameDraft = ref('')

function startRename(entry: CollectionEntry) {
  renamingId.value = entry.id
  renameDraft.value = entry.name
}

function commitRename() {
  if (!renamingId.value) return
  const name = renameDraft.value.trim()
  if (name.length > 0) emit('rename', renamingId.value, name)
  renamingId.value = null
  renameDraft.value = ''
}

function cancelRename() {
  renamingId.value = null
  renameDraft.value = ''
}

function onRowClick(entry: CollectionEntry) {
  if (renamingId.value === entry.id) return
  emit('select', entry.id)
}

function onDelete(entry: CollectionEntry) {
  // Confirm in-place via window.confirm to avoid a custom modal.
  if (typeof window !== 'undefined') {
    const ok = window.confirm(`Delete “${entry.name}” from your collection?`)
    if (!ok) return
  }
  emit('delete', entry.id)
}

function formatSavedAt(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
</script>

<template>
  <aside class="dcv-collection">
    <header class="dcv-collection__header">
      <h2 class="dcv-collection__title">My collection</h2>
      <span class="dcv-collection__count">{{ props.entries.length }}</span>
    </header>

    <p v-if="props.unavailable" class="dcv-collection__notice">
      Saving is unavailable in this browser context (private mode or disabled storage).
    </p>

    <p v-else-if="props.entries.length === 0" class="dcv-collection__empty">
      Render a chain and use Save to my collection to keep it here for later.
    </p>

    <ol v-else class="dcv-collection__list">
      <li
        v-for="entry in props.entries"
        :key="entry.id"
        class="dcv-collection__item"
        :class="{ 'dcv-collection__item--active': entry.id === props.selectedId }"
      >
        <div class="dcv-collection__row" @click="onRowClick(entry)">
          <template v-if="renamingId === entry.id">
            <input
              v-model="renameDraft"
              class="dcv-collection__rename-input"
              type="text"
              @click.stop
              @keydown.enter.prevent="commitRename"
              @keydown.escape.prevent="cancelRename"
              @blur="commitRename"
            />
          </template>
          <template v-else>
            <button type="button" class="dcv-collection__name">
              {{ entry.name }}
            </button>
            <span class="dcv-collection__saved-at">{{ formatSavedAt(entry.savedAt) }}</span>
          </template>
        </div>
        <div class="dcv-collection__row-actions">
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-heroicons-pencil-square"
            aria-label="Rename"
            @click.stop="startRename(entry)"
          />
          <UButton
            size="xs"
            color="error"
            variant="ghost"
            icon="i-heroicons-trash"
            aria-label="Delete"
            @click.stop="onDelete(entry)"
          />
        </div>
      </li>
    </ol>
  </aside>
</template>

<style scoped>
.dcv-collection {
  border: 1px solid var(--ui-border, rgb(229, 231, 235));
  border-radius: 0.5rem;
  background: var(--ui-bg, white);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dcv-collection__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.dcv-collection__title {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
}

.dcv-collection__count {
  font-size: 0.75rem;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
}

.dcv-collection__empty,
.dcv-collection__notice {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
  line-height: 1.45;
}

.dcv-collection__notice {
  color: var(--ui-warning, #d97706);
}

.dcv-collection__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dcv-collection__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.375rem;
  padding: 0.4rem 0.5rem;
  transition: background-color 0.1s ease;
}

.dcv-collection__item:hover {
  background: var(--ui-bg-elevated, rgb(249, 250, 251));
}

.dcv-collection__item--active {
  background: color-mix(in srgb, var(--ui-primary, #10b981) 8%, transparent);
}

.dcv-collection__row {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  cursor: pointer;
}

.dcv-collection__name {
  background: none;
  border: 0;
  padding: 0;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ui-text, inherit);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dcv-collection__saved-at {
  font-size: 0.6875rem;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
}

.dcv-collection__rename-input {
  width: 100%;
  padding: 0.2rem 0.3rem;
  border: 1px solid var(--ui-border, rgb(229, 231, 235));
  border-radius: 0.25rem;
  font-size: 0.875rem;
  background: var(--ui-bg, white);
}

.dcv-collection__row-actions {
  display: flex;
  gap: 0.15rem;
}
</style>
