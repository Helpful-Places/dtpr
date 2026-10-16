<script setup lang="ts">
    import SectionHeader from './sectionHeader.vue';
    import LineIcon from './lineIcon.vue';

    const props = defineProps<{
        heading: string,
        subHeading?: string,
        cards?: { heading?: string, subHeading?: string, icon?: string }[]
    }>()
</script>

<template>
    <UContainer as="section" class="section-pad">
        <SectionHeader :heading="props.heading" :sub-heading="props.subHeading"/>

        <ul class="mt-6 divide-y divide-rule rounded-md bg-white shadow-sm ring ring-rule">
            <li
                v-for="card in props.cards"
                :key="card.heading"
                class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 px-5 py-4 sm:px-6 md:grid-cols-[auto_16rem_minmax(0,1fr)] md:items-center md:gap-x-5"
            >
                <LineIcon
                    v-if="hasLineIcon(card.icon)"
                    :name="card.icon"
                    class="row-span-2 mt-0.5 size-6 text-primary md:row-span-1 md:mt-0"
                />
                <h3 class="font-sans text-base font-semibold text-balance" :class="hasLineIcon(card.icon) ? '' : 'col-span-2 md:col-span-1'">{{ card.heading }}</h3>
                <p v-if="card.subHeading" class="col-start-2 text-pretty text-muted md:col-start-3">{{ card.subHeading }}</p>
            </li>
        </ul>
    </UContainer>
</template>
