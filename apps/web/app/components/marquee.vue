<script setup lang="ts">
    const props = defineProps<{
        elements: Array<{
            type: 'Marquee Item',
            heading: string,
            subHeading: string,
            image: string
        }>,
        heading?: string,
        subHeading?:string
    }>()
</script>

<template>
    <h3 class="font-sans text-3xl mb-10 text-center">{{ props.heading }}</h3>
    <UMarquee>
        <!-- <UPageCard v-for="(item, index) in props.marqueeItems"
        :key="index"
        :description="item.heading">

        </UPageCard> -->
        <img v-for="(item, index) in props.elements" :key="index" :src="item.image" :alt="item.heading ?? ''" class="size-20"/>
    </UMarquee>
</template>