<script setup lang="ts">
    import MarkdownIt from 'markdown-it'
    import SectionHeader from './sectionHeader.vue'

    const md = new MarkdownIt()

    const props = defineProps<{
        heading: string,
        subHeading?: string,
        cards?: {
            heading?: string,
            subHeading?: string,
            image?: string,
            imageAlt?: string,
            imageFit?: string,
            link?: string,
            linkText?: string
        }[]
    }>()

    const external = (link?: string) => !!link && /^https?:/.test(link)
    const body = (text?: string) => (text ? md.render(text) : '')
</script>

<template>
    <UContainer as="section" class="section-pad">
        <SectionHeader :heading="props.heading" :sub-heading="props.subHeading"/>

        <ul class="mt-6 grid gap-6 md:grid-cols-2">
            <li
                v-for="card in props.cards"
                :key="card.heading"
                class="flex flex-col overflow-hidden rounded-md bg-white shadow-sm ring ring-rule"
            >
                <!-- Every card's picture sits in the same 280px frame, so cards in a
                     row line up. A logo is contained on white; a photo fills the frame. -->
                <div v-if="card.image" class="h-70 shrink-0 border-b border-rule" :class="card.imageFit === 'contain' ? 'bg-white p-6' : ''">
                    <img
                        :src="card.image"
                        :alt="card.imageAlt ?? ''"
                        loading="lazy"
                        class="size-full"
                        :class="card.imageFit === 'contain' ? 'object-contain' : 'object-cover object-[center_40%]'"
                    />
                </div>
                <div class="flex flex-1 flex-col gap-4 p-5 sm:p-6">
                    <h3 class="font-sans text-xl font-semibold text-balance">{{ card.heading }}</h3>
                    <div v-if="card.subHeading" class="text-pretty text-muted [&_p+p]:mt-4" v-html="body(card.subHeading)"></div>
                    <div v-if="card.link && card.linkText" class="mt-auto pt-1">
                        <UButton
                            variant="outline"
                            size="lg"
                            class="min-h-11"
                            :trailing-icon="external(card.link) ? 'i-lucide-arrow-up-right' : 'i-lucide-arrow-right'"
                            :label="card.linkText"
                            :to="card.link"
                            :target="external(card.link) ? '_blank' : undefined"
                        />
                    </div>
                </div>
            </li>
        </ul>
    </UContainer>
</template>
