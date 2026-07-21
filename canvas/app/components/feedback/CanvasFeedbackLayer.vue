<script setup lang="ts">
import { ref } from 'vue'
import { useFeedback, type Reaction, type CanvasCoords } from '~/composables/useFeedback'
import type { SystemContent } from '~/canvas-data'

// Wraps a CanvasBoard with the ambient feedback layer (R7 / R8 / R10):
// clicking any seat opens a reaction popover; a canvas-level clarity
// control covers overall feedback. Every submit posts the full tag; the
// first submit from an untagged respondent triggers the one-time self-tag.
const props = defineProps<{
  content: SystemContent
  system: string
  variant: string
  version: string
  index?: number
}>()

const coords: CanvasCoords = { system: props.system, variant: props.variant, version: props.version }
const { selfTagOpen, submit, onTagged } = useFeedback(() => coords)

// Seat popover state, positioned at the clicked seat.
const seatOpen = ref(false)
const seatKey = ref<string | null>(null)
const pos = ref({ x: 0, y: 0 })

function onBoardClick(e: MouseEvent) {
  const el = (e.target as HTMLElement)?.closest('[data-seat]') as HTMLElement | null
  if (!el) return
  // Ignore clicks on interactive elements inside a seat (rights links).
  if ((e.target as HTMLElement)?.closest('a, button, input, textarea')) return
  const r = el.getBoundingClientRect()
  pos.value = { x: r.left + r.width / 2, y: r.bottom }
  seatKey.value = el.getAttribute('data-seat')
  seatOpen.value = true
}

async function onSeatSubmit(reaction: Reaction, note: string | null) {
  seatOpen.value = false
  await submit(reaction, { seat: seatKey.value, scope: 'seat', note })
}

async function onCanvasSubmit(reaction: Reaction, note: string | null) {
  await submit(reaction, { scope: 'canvas', note })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Seats are interactive: a click delegates to the nearest [data-seat]. -->
    <div class="canvas-interactive" @click="onBoardClick">
      <CanvasBoard :content="content" :index="index" />
    </div>

    <ClarityRating @submit="onCanvasSubmit" />

    <SeatReact
      :open="seatOpen"
      :x="pos.x"
      :y="pos.y"
      @submit="onSeatSubmit"
      @close="seatOpen = false"
    />

    <SelfTag v-model:open="selfTagOpen" @done="onTagged" />
  </div>
</template>

<style scoped>
/* Signal that seats are clickable without disturbing the board's own
   cursors (the icons keep their help cursor, links keep pointer). */
.canvas-interactive :deep([data-seat]) {
  cursor: pointer;
}
.canvas-interactive :deep([data-seat]:hover) {
  outline: 2px solid color-mix(in srgb, var(--signal) 40%, transparent);
  outline-offset: 2px;
  border-radius: 6px;
}
</style>
