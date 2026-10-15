<script setup lang="ts">
    import type { ButtonProps } from '@nuxt/ui'
    import MarkdownIt from 'markdown-it'

    const md = new MarkdownIt()

    const props = defineProps<{
        eyebrow?: string,
        heading:string,
        subHeading?: string,
        image?:string,
        imageAlt?: string,
        horizontal?:boolean,
        darkVariant?:boolean,
        hasButton?: boolean,
        buttonText?: string,
        buttonLink?: string,
        secondaryButtonText?: string,
        secondaryButtonLink?: string,
        animatedLayers?: boolean
    }>();

    // The paragraph can carry light markdown (emphasis, bold) and blank-line breaks.
    const renderedSubHeading = computed(() => (props.subHeading ? md.render(props.subHeading) : ''))

    const links = computed<ButtonProps[]>(() => {
        const items: ButtonProps[] = []
        if (props.hasButton && props.buttonText && props.buttonLink) {
            items.push({ label: props.buttonText, to: props.buttonLink, color: 'primary', size: 'xl', class: 'min-h-11' })
        }
        if (props.hasButton && props.secondaryButtonText && props.secondaryButtonLink) {
            items.push({ label: props.secondaryButtonText, to: props.secondaryButtonLink, color: 'primary', variant: 'outline', size: 'xl', class: 'min-h-11' })
        }
        return items
    })
</script>

<template>
    <!-- The headline and paragraph sit on the dot grid; the wrapper takes the
         nudge that puts the top of the h1 on a row of dots. -->
    <div data-dot-snap="h1" class="pt-(--dot-snap)">
    <UPageHero
        :headline="props.eyebrow"
        :title="props.heading"
        :orientation="props.horizontal ? 'horizontal' : 'vertical'"
        :links="links.length ? links : undefined"
    >
    <template v-if="renderedSubHeading" #description>
        <div class="[&_p+p]:mt-6" v-html="renderedSubHeading"></div>
    </template>

    <HomeCityLayers v-if="props.animatedLayers" :label="props.imageAlt"/>
    <img v-else-if="props.image" class="mx-auto w-full max-w-md lg:max-w-none" :src="props.image" :alt="props.imageAlt ?? ''"/>

    </UPageHero>
    </div>
</template>
