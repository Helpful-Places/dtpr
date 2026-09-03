<script setup lang="ts">
    const props = defineProps<{
        elements: Array<{
            type: 'Marquee Item',
            heading: string,
            body: string,
            image: string
        }>,
        headline: string
    }>()
</script>

<template>
    <h3 class="font-sans text-3xl mb-10 text-center">{{ props.headline }}</h3>
    <UMarquee>
        <!-- <UPageCard v-for="(item, index) in props.marqueeItems"
        :key="index"
        :description="item.heading">

        </UPageCard> -->
        <img v-for="(item, index) in props.elements" :key="index" :src="item.image" class="size-20"/>
    </UMarquee>
</template>