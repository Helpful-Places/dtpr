<script setup lang="ts">
    const props = defineProps<{
        heading?: string,
        subHeading?:string,
        headingRight?:string,
        bodyRight?: string,
        image?: string,
        imageAlt?: string,
        hasButton?: boolean,
        buttonText?:string,
        buttonLink?:string,
        cards?:Array<{
            type:'card',
            heading:string,
            subHeading: string,
            link?:string
        }>
    }>()

    // Cards sit under the section heading when there is one, and directly
    // under the page title when there is not.
    const cardHeading = computed(() => (props.heading || props.headingRight ? 'h3' : 'h2'))
</script>

<template>
    <UContainer class="section-pad grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
        <div v-if="props.cards" class="grid gap-6">
            <UPageCard
                v-for="(card, index) in props.cards"
                :key="index"
                highlight
                highlight-color="bg-border"
                :to="card.link"
                :spotlight="!!card.link"
                spotlight-color="primary"
                class="[--spotlight-size:100px]"
                :class="card.link ? 'transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-primary focus-visible:ring-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0' : ''"
                :description="card.subHeading ? card.subHeading : ''"
            >
                <template v-if="card.heading" #title>
                    <component :is="cardHeading">{{ card.heading }}</component>
                </template>
            </UPageCard>
        </div>

        <UPageCard
            v-if="props.heading || props.subHeading"
            :description="props.subHeading ? props.subHeading : ''"
        >
            <template v-if="props.heading" #title>
                <h2>{{ props.heading }}</h2>
            </template>

            <UButton size="xl" class="mt-3 min-h-11 w-fit self-start" v-if="props.hasButton" :label="props.buttonText" :to="props.buttonLink"></UButton>
        </UPageCard>

        <UPageCard
            v-if="props.headingRight || props.bodyRight"
            :description="props.bodyRight ? props.bodyRight : ''"
        >
            <template v-if="props.headingRight" #title>
                <h2>{{ props.headingRight }}</h2>
            </template>
        </UPageCard>

        <img class="w-full self-center" v-if="props.image" :src="props.image" :alt="props.imageAlt ?? ''" loading="lazy"/>
    </UContainer>
</template>
