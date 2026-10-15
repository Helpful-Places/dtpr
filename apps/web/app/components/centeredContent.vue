<script setup lang="ts">
    import MarkdownIt from 'markdown-it'
    import SectionHeader from './sectionHeader.vue'


    const md = new MarkdownIt()

    const props=defineProps<{
        type?:"Centered Content"
        heading?: string,
        subHeading?: string,
        image?: string,
        imageAlt?: string,
        hasButton?: boolean,
        buttonText?:string,
        buttonLink?:string,
        cards?:Array<{
            type: 'card',
            heading:string,
            subHeading: string,
            link?: string
        }>

    }>();

    const renderedBody = computed(() => {
        return props.subHeading ? md.render(props.subHeading) : ''
    })

    // A heading with nothing under it introduces the sections that follow,
    // so it sits close to them instead of taking a full section of space.
    const headingOnly = computed(() =>
        !props.subHeading && !props.image && !props.cards?.length && !props.hasButton
    )
</script>

<template>
    <UContainer as="section" class="section-pad" :class="headingOnly && 'pb-0!'">
        <SectionHeader v-if="props.heading" :heading="props.heading"/>

        <div v-if="!headingOnly" class="grid gap-6" :class="props.heading && 'mt-6'">
            <div v-if="renderedBody" class="prose w-full max-w-2xl rounded-md bg-white p-6 text-pretty shadow-sm ring ring-rule sm:p-8 [--tw-prose-body:var(--ui-text-muted)] [--tw-prose-bold:var(--ui-text)] [--tw-prose-links:var(--ui-primary)]" v-html="renderedBody"></div>

            <img v-if="props.image" class="w-full" :src="props.image" :alt="props.imageAlt ?? ''" loading="lazy"/>

            <div v-if="props.cards" class="grid gap-6 sm:grid-cols-2" :class="props.cards.length === 3 ? 'lg:grid-cols-3' : ''">
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
                    :description="card.subHeading ? card.subHeading : ''">
                    <template v-if="card.heading" #title>
                        <h3>{{ card.heading }}</h3>
                    </template>
                </UPageCard>
            </div>

            <UButton
                v-if="props.hasButton && props.buttonText && props.buttonLink"
                size="xl"
                class="min-h-11 w-fit"
                :label="props.buttonText"
                :to="props.buttonLink"
            />
        </div>
    </UContainer>
</template>
