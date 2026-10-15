<script setup lang="ts">
// Replaces Nuxt UI's prose table so a table wider than its column can be
// scrolled from the keyboard. The wrapper only takes focus while it overflows.
const root = ref<HTMLElement>()
const scrollable = ref(false)
let observer: ResizeObserver | undefined

onMounted(() => {
  observer = new ResizeObserver(() => {
    scrollable.value = !!root.value && root.value.scrollWidth > root.value.clientWidth
  })
  observer.observe(root.value!)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div
    ref="root"
    class="relative my-5 overflow-x-auto rounded-md outline-primary focus-visible:outline-3"
    :tabindex="scrollable ? 0 : undefined"
    :role="scrollable ? 'group' : undefined"
    :aria-label="scrollable ? 'Scrollable table' : undefined"
  >
    <table class="w-full border-separate border-spacing-0 rounded-md wrap-normal">
      <slot />
    </table>
  </div>
</template>
