<script setup lang="ts">
    import SectionHeader from './sectionHeader.vue';

    const props = defineProps<{
        heading: string,
        subHeading?: string,
        cards?: { heading?: string, subHeading?: string, link?: string, linkText?: string }[]
    }>()

    const external = (link?: string) => !!link && /^https?:/.test(link)
    // Links that leave the site, mail included, take the outward arrow.
    const leaves = (link?: string) => !!link && /^(https?|mailto):/.test(link)
</script>

<template>
    <UContainer as="section" class="section-pad">
        <SectionHeader :heading="props.heading" :sub-heading="props.subHeading"/>

        <ul class="mt-6 grid gap-6 md:grid-cols-3">
            <li
                v-for="card in props.cards"
                :key="card.heading"
                class="flex flex-col rounded-md bg-white p-5 shadow-sm ring ring-rule sm:p-6"
            >
                <h3 class="font-sans text-xl font-semibold text-balance">{{ card.heading }}</h3>
                <p v-if="card.subHeading" class="mt-2 text-pretty text-muted">{{ card.subHeading }}</p>
                <div v-if="card.link && card.linkText" class="mt-auto pt-5">
                    <UButton
                        variant="outline"
                        size="lg"
                        class="min-h-11"
                        :trailing-icon="leaves(card.link) ? 'i-lucide-arrow-up-right' : 'i-lucide-arrow-right'"
                        :label="card.linkText"
                        :to="card.link"
                        :target="external(card.link) ? '_blank' : undefined"
                    />
                </div>
            </li>
        </ul>
    </UContainer>
</template>
