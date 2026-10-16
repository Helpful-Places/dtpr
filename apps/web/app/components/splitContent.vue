<script setup lang="ts">
    import MarkdownIt from 'markdown-it'
    import SectionHeader from './sectionHeader.vue'

    const md = new MarkdownIt()

    const props = defineProps<{
        heading: string,
        subHeading?: string,
        body?: string,
        image?: string,
        imageAlt?: string,
        caption?: string
    }>()

    const renderedBody = computed(() => (props.body ? md.render(props.body) : ''))
</script>

<template>
    <UContainer as="section" class="section-pad">
        <SectionHeader :heading="props.heading" :sub-heading="props.subHeading"/>

        <div class="mt-6 grid gap-6 lg:grid-cols-2">
            <div
                v-if="renderedBody"
                class="rounded-md bg-white p-6 text-pretty shadow-sm ring ring-rule sm:p-8 [&_p+p]:mt-4 [&_strong]:font-semibold"
                v-html="renderedBody"
            ></div>

            <figure v-if="props.image" class="flex flex-col overflow-hidden rounded-md bg-white shadow-sm ring ring-rule">
                <img class="max-h-[28rem] min-h-70 w-full flex-1 object-cover" :src="props.image" :alt="props.imageAlt ?? ''" loading="lazy"/>
                <figcaption v-if="props.caption" class="px-5 py-4 text-sm text-muted sm:px-6">{{ props.caption }}</figcaption>
            </figure>
        </div>
    </UContainer>
</template>
