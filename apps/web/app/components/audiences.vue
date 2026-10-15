<script setup lang="ts">
    import SectionHeader from './sectionHeader.vue';

    const props = defineProps<{
        heading: string,
        subHeading?: string,
        cards?: { heading?: string, subHeading?: string, icon?: string }[]
    }>()

    // Line icons from Lucide, inlined so they render with the page. Content
    // picks one by name; add a path here to offer another.
    const icons: Record<string, string> = {
        'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3.128a4 4 0 0 1 0 7.744M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/>',
        'landmark': '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 18v-7m1.119-8.795a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949zM14 18v-7m4 7v-7M3 22h18M6 18v-7"/>',
        'pencil-ruler': '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7L8.7 2.7a2.41 2.41 0 0 0-3.4 0L2.7 5.3a2.41 2.41 0 0 0 0 3.4L7 13m1-7l2-2m8 12l2-2m-3-3l4.3 4.3c.94.94.94 2.46 0 3.4l-2.6 2.6c-.94.94-2.46.94-3.4 0L11 17M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497zM15 5l4 4"/>',
    }
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
                <svg
                    v-if="card.icon && icons[card.icon]"
                    viewBox="0 0 24 24"
                    class="row-span-2 mt-0.5 size-6 fill-none stroke-current text-primary md:row-span-1 md:mt-0"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                    v-html="icons[card.icon]"
                />
                <h3 class="font-sans text-base font-semibold text-balance" :class="card.icon && icons[card.icon] ? '' : 'col-span-2 md:col-span-1'">{{ card.heading }}</h3>
                <p v-if="card.subHeading" class="col-start-2 text-pretty text-muted md:col-start-3">{{ card.subHeading }}</p>
            </li>
        </ul>
    </UContainer>
</template>
