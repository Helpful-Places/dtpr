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
        animatedLayers?: boolean,
        steward?: boolean
    }>();

    // The steward line borrows the Helpful Places mark from the nav content.
    const { data: nav } = await useNav()

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
    >
    <template v-if="renderedSubHeading" #description>
        <div class="[&_p+p]:mt-6" v-html="renderedSubHeading"></div>
    </template>

    <!-- The footer slot stands in for UPageHero's links so the steward line
         can sit right under the buttons. -->
    <template v-if="links.length || props.steward" #footer>
        <div v-if="links.length" class="flex flex-wrap gap-x-6 gap-y-3">
            <UButton v-for="(link, index) in links" :key="index" size="xl" v-bind="link" />
        </div>
        <p v-if="props.steward && nav" class="font-sans text-sm text-muted" :class="links.length && 'mt-6'">
            <NuxtLink href="https://www.helpfulplaces.com" target="_blank" class="inline-flex flex-wrap items-center gap-x-2 gap-y-1 transition-opacity hover:opacity-80">
                An open standard stewarded by
                <img :src="nav.hpLogo" alt="Helpful Places" width="115" height="30" class="h-6 w-auto"/>
            </NuxtLink>
        </p>
    </template>

    <HomeCityLayers v-if="props.animatedLayers" :label="props.imageAlt"/>
    <img v-else-if="props.image" class="mx-auto w-full max-w-md lg:max-w-none" :src="props.image" :alt="props.imageAlt ?? ''"/>

    </UPageHero>
    </div>
</template>
