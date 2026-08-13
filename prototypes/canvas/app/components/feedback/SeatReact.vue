<script setup lang="ts">
import { ref, watch } from 'vue'
import { REACTIONS, type Reaction } from '~/composables/useFeedback'

// The per-seat reaction popover (R7): opens over a clicked seat, offers
// clear / confusing / unsure + an optional note. Positioned by the parent
// at fixed coordinates and teleported to <body> so it escapes the board's
// overflow clipping.
const props = defineProps<{ open: boolean, x: number, y: number }>()
const emit = defineEmits<{
  submit: [reaction: Reaction, note: string | null]
  close: []
}>()
const { t } = useI18n()

const note = ref('')
watch(() => props.open, (o) => { if (o) note.value = '' })

function pick(r: Reaction) {
  emit('submit', r, note.value.trim() || null)
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="seatreact-backdrop" @click="emit('close')" />
    <div
      v-if="open"
      class="seatreact-panel"
      :style="{ left: `${x}px`, top: `${y}px` }"
      @click.stop
    >
      <div class="text-xs font-semibold text-[var(--muted)]">{{ t('feedback.seatPrompt') }}</div>
      <div class="mt-2 flex gap-2">
        <UButton
          v-for="r in REACTIONS" :key="r"
          color="neutral" variant="outline" size="sm"
          @click="pick(r)"
        >{{ t(`feedback.${r}`) }}</UButton>
      </div>
      <UInput
        v-model="note"
        :placeholder="t('feedback.notePlaceholder')"
        size="sm"
        class="mt-2 w-full"
      />
    </div>
  </Teleport>
</template>

<style scoped>
.seatreact-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1100;
}
.seatreact-panel {
  position: fixed;
  z-index: 1101;
  width: 260px;
  max-width: calc(100vw - 24px);
  transform: translate(-50%, 8px);
  background: var(--card);
  border: 1px solid var(--line-strong);
  border-radius: 12px;
  padding: 12px 14px;
  box-shadow: 0 12px 32px -12px rgba(27, 27, 25, 0.4);
}
</style>
