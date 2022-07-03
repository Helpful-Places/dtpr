<template>
  <img
    :src="icon"
  />
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  'iconTitle': String
})
const icon = ref('');

const { data: icons } = await useAsyncData('icons', async () => {
  const res = await queryContent('/dtpr/symbols/en').find();
  const icons = {};
  res.forEach((s) => { icons[s.title] = s.icon} );
  return icons;
});

watch(icons, async () => {
  icon.value = icons[props.iconTitle];
});

</script>
