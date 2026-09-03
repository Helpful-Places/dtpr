<script setup lang="ts">
    const props = defineProps<{
        heading:string,
        subHeading?: string, 
        image:string,
        horizontal:boolean,
        darkVariant:boolean

    }>();
</script>

<template>
    <UPageHero
        :title="props.heading"
        :description="props.subHeading"
        :orientation="props.horizontal ? 'horizontal' : 'vertical'"
    >
    <img :src="props.image"/>

    </UPageHero>


<!-- 
    <UMain>
        <section class="hero grid grid-cols-2 py-10 px-30 gap-2.5">
            <div class="flex flex-col gap-10 m-auto">
                <h1 class="font-serif text-5xl italic font-medium">{{ props.heading }}</h1>
                <h2 class="font-sans my-2 font-medium text-4xl">{{ props.subHeading }}</h2>
            </div>
            <div>
                <img :src="props.image" />
            </div>
        </section>
    </UMain> -->
</template>