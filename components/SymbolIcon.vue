<template>
  <img
    :src="icon"
  />
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  'iconTitle': String
})
const icon = ref();

const { data: icons } = await useAsyncData('icons', async () => {
  const res = await queryContent('/dtpr/symbols/en').find();
  const icons = {};
  res.forEach((s) => { icons[s.title] = s.icon} );
  return icons;
});

watch(icons, () => {
  icon.value = icons.value[props.iconTitle]
}, {
  deep: true
});
</script>
