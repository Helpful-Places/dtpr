<script setup lang="ts">
    import SectionHeader from '../sectionHeader.vue';

    // A short numbered list on a sheet, such as the feedback survey's questions.
    const props = defineProps<{
        heading: string,
        subHeading?: string,
        body?: string,
        items?: string[],
        hasButton?: boolean,
        buttonText?: string,
        buttonLink?: string,
    }>()
</script>

<template>
    <UContainer as="section" class="section-pad">
        <SectionHeader :heading="props.heading" :sub-heading="props.subHeading"/>

        <div class="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
            <MDC
                v-if="props.body"
                :value="props.body"
                tag="div"
                class="prose rounded-md bg-white p-6 text-pretty shadow-sm ring ring-rule sm:p-8 [--tw-prose-body:var(--ui-text-muted)] [--tw-prose-bold:var(--ui-text)] [--tw-prose-links:var(--ui-primary)]"
            />

            <ol v-if="props.items?.length" class="divide-y divide-rule rounded-md bg-white shadow-sm ring ring-rule">
                <li
                    v-for="(item, index) in props.items"
                    :key="item"
                    class="grid grid-cols-[2rem_minmax(0,1fr)] items-baseline px-5 py-4 sm:px-6"
                >
                    <span class="font-code text-xs text-dimmed">{{ index + 1 }}</span>
                    <span class="font-semibold text-pretty">{{ item }}</span>
                </li>
            </ol>
        </div>

        <div v-if="props.hasButton && props.buttonText && props.buttonLink" class="mt-6">
            <UButton
                size="xl"
                class="min-h-11"
                trailing-icon="i-lucide-arrow-right"
                :label="props.buttonText"
                :to="props.buttonLink"
            />
        </div>
    </UContainer>
</template>
