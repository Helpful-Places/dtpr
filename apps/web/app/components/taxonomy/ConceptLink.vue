<script setup lang="ts">
// A term that opens its definition in the concept dialog. It is still a link to
// the Concepts page, so a modified or middle click opens the page instead.
const props = defineProps<{ term: string }>()
const { explain } = useConcept()

function onClick(event: MouseEvent) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  explain(props.term)
}
</script>

<template>
  <a :href="`/docs/concepts#${term}`" aria-haspopup="dialog" class="underline underline-offset-2" @click="onClick"><slot /></a>
</template>
