<script setup lang="ts">
    // Without a heading, only the rule is drawn.
    const props = defineProps<{
        heading?: string,
        subHeading?: string
    }>()
</script>

<template>
    <!-- Text here sits on the dot grid: the rule runs through a row of dots,
         and every line below it is one grid unit (24px) or two (48px) tall,
         so the rows fall between lines. -->
    <header data-dot-rule class="mt-(--dot-snap) border-t-2 border-rule pt-[23px]">
        <h2 v-if="props.heading" class="max-w-4xl font-sans text-3xl leading-[48px] font-semibold text-balance sm:text-4xl">{{ props.heading }}</h2>
        <p v-if="props.subHeading" class="max-w-3xl text-lg leading-[24px] text-pretty whitespace-pre-line text-muted">{{ props.subHeading }}</p>
    </header>
</template>
