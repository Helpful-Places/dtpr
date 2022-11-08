<template>
  <iframe data-tally-src="https://tally.so/embed/3X5404?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1" width="100%" height="338" frameborder="0" marginheight="0" marginwidth="0" title="Newsletter sign-up" class="min-h-[680px] md:min-h-max"></iframe>
</template>

<script setup>
useHead({
  script: [
    { src: "https://tally.so/widgets/embed.js" }
  ]
});

onMounted(() => {
  window.Tally.loadEmbeds();
});
</script>