<template>
  <img
    :src="icon"
  />
</template>

<script setup>
const props = defineProps({
  'iconTitle': String,
  'icons': Array
})

const icon = props.icons[props.iconTitle]
</script>
