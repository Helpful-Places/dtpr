<script setup lang="ts">
import { ref } from 'vue'
import type { Reaction } from '~/composables/useFeedback'

// Canvas-level clarity control (R8): overall clear / confusing / unsure +
// optional note, independent of any seat. Clicking a reaction submits —
// low ceremony (R10).
const emit = defineEmits<{ submit: [reaction: Reaction, note: string | null] }>()
const { t } = useI18n()

const note = ref('')
const reactions: Reaction[] = ['clear', 'confusing', 'unsure']

function pick(r: Reaction) {
  emit('submit', r, note.value.trim() || null)
  note.value = ''
}
</script>

<template>
  <div class="rounded-xl border border-[var(--line)] bg-[var(--card)] p-4">
    <div class="text-sm font-semibold">{{ t('feedback.canvasPrompt') }}</div>
    <div class="mt-3 flex flex-wrap items-center gap-2">
      <UButton
        v-for="r in reactions" :key="r"
        color="neutral" variant="outline" size="sm"
        @click="pick(r)"
      >{{ t(`feedback.${r}`) }}</UButton>
    </div>
    <UInput
      v-model="note"
      :placeholder="t('feedback.notePlaceholder')"
      size="sm"
      class="mt-3 w-full"
    />
  </div>
</template>
