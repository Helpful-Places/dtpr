<script setup>
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const items = computed(() => {
  return [locales.value.map((l) => {
    return {
      label: l,
      to: switchLocalePath(l)
    }
  })];
})

</script>

<template>
  <UDropdown :items="items">
    <UButton color="white" :label="locale" trailing-icon="i-heroicons-chevron-down-20-solid" />
  </UDropdown>
</template>
