<script setup lang="ts">
    const props = defineProps<{
        heading:string,
        image:string,
        colorVariant: {
            type: string,
            default: "Light"
        }
    }>()

</script>

<template>
    <UPageSection
        :title="props.heading"
    >
    <img :src="props.image"/>
</UPageSection>
</template>