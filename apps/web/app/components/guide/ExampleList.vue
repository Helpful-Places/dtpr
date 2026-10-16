<script setup lang="ts">
    import SectionHeader from '../sectionHeader.vue';

    // A ruled list of options beside one example of the current option.
    // Pointing at an option, or tabbing to its button, swaps the example.
    // Below the lg breakpoint each option carries its own example instead,
    // so nothing depends on hover.
    type Card = {
        heading?: string,
        subHeading?: string,
        link?: string,
        linkText?: string,
        image?: string,
        imageAlt?: string,
        caption?: string,
        captionLink?: string,
    }

    const props = defineProps<{
        heading: string,
        subHeading?: string,
        cards?: Card[],
    }>()

    const active = ref(0)
    const current = computed(() => props.cards?.[active.value])
    const external = (link?: string) => !!link && /^https?:/.test(link)
</script>

<template>
    <UContainer as="section" class="section-pad">
        <SectionHeader :heading="props.heading" :sub-heading="props.subHeading"/>

        <div class="mt-6 grid gap-6 lg:grid-cols-2">
            <ol class="divide-y divide-rule overflow-hidden rounded-md bg-white shadow-sm ring ring-rule">
                <li
                    v-for="(card, index) in props.cards"
                    :key="card.heading"
                    class="px-5 py-4 transition-colors duration-200 motion-reduce:transition-none sm:px-6 lg:py-5"
                    :class="active === index ? 'lg:bg-primary-50 lg:shadow-[inset_3px_0_0_var(--ui-primary)]' : ''"
                    @mouseenter="active = index"
                    @focusin="active = index"
                >
                    <div>
                        <h3 class="font-sans text-xl font-semibold text-balance">{{ card.heading }}</h3>
                        <p v-if="card.subHeading" class="mt-1 text-pretty text-muted">{{ card.subHeading }}</p>

                        <figure v-if="card.image" class="mt-4 overflow-hidden rounded-md bg-elevated ring ring-rule lg:hidden">
                            <img :src="card.image" :alt="card.imageAlt ?? ''" class="aspect-[4/3] w-full object-contain p-4" loading="lazy">
                            <figcaption v-if="card.caption" class="border-t border-rule px-4 py-2 text-xs text-muted">{{ card.caption }}</figcaption>
                        </figure>

                        <div v-if="card.link && card.linkText" class="mt-4">
                            <UButton
                                variant="outline"
                                size="lg"
                                class="min-h-11"
                                trailing-icon="i-lucide-arrow-right"
                                :label="card.linkText"
                                :to="card.link"
                            />
                        </div>
                    </div>
                </li>
            </ol>

            <!-- The frame takes the list's height: the grid row stretches it, and the
                 image area fills whatever is left above the caption. -->
            <figure class="hidden overflow-hidden rounded-md bg-white shadow-sm ring ring-rule lg:flex lg:flex-col">
                <div class="relative min-h-0 flex-1 bg-elevated">
                    <img
                        v-for="(card, index) in props.cards"
                        :key="card.heading"
                        :src="card.image"
                        :alt="card.imageAlt ?? ''"
                        :aria-hidden="active !== index"
                        class="absolute inset-0 size-full object-contain p-6 transition-opacity duration-200 motion-reduce:transition-none"
                        :class="active === index ? 'opacity-100' : 'opacity-0'"
                        loading="lazy"
                    >
                </div>
                <figcaption class="flex min-h-11 shrink-0 items-center border-t border-rule px-5 py-3 text-sm sm:px-6">
                    <NuxtLink
                        v-if="current?.captionLink"
                        :to="current.captionLink"
                        :target="external(current.captionLink) ? '_blank' : undefined"
                        class="inline-flex items-center gap-1 font-semibold text-primary hover:text-secondary"
                    >
                        {{ current.caption }}
                        <UIcon :name="external(current.captionLink) ? 'i-lucide-arrow-up-right' : 'i-lucide-arrow-right'" class="size-4"/>
                    </NuxtLink>
                    <span v-else class="font-semibold">{{ current?.caption }}</span>
                </figcaption>
            </figure>
        </div>
    </UContainer>
</template>
