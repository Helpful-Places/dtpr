<script setup lang="ts">
// Turns the Developer view on and off. Styled like the view switch: outline,
// with cool paper when on.
defineOptions({ inheritAttrs: false })
const developer = useDeveloperView()
</script>

<template>
  <UTooltip text="Show ids, API calls and raw data">
    <UButton
      v-bind="$attrs" size="sm" color="neutral" variant="outline" icon="i-lucide-code-xml" label="Developer"
      :class="developer && 'bg-accented text-primary'" :aria-pressed="developer" @click="developer = !developer"
    />
  </UTooltip>
</template>
