<script setup lang="ts">
    import SectionHeader from './sectionHeader.vue';

    const props = defineProps<{
        heading: string,
        subHeading?: string,
        buttonText?: string,
        buttonLink: string
    }>()

    // "mailto:hello@dtpr.io" is shown as the address itself.
    const address = computed(() => props.buttonLink.replace(/^mailto:/, ''))
</script>

<template>
    <UContainer as="section" class="section-pad">
        <SectionHeader :heading="props.heading"/>

        <div class="mt-6 flex flex-col gap-x-8 gap-y-5 rounded-md bg-white p-5 shadow-sm ring ring-rule sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div class="max-w-2xl">
                <a :href="props.buttonLink" class="font-sans text-xl font-semibold text-primary underline-offset-4 hover:text-secondary hover:underline">{{ address }}</a>
                <p v-if="props.subHeading" class="mt-2 text-pretty text-muted">{{ props.subHeading }}</p>
            </div>
            <UButton
                v-if="props.buttonText"
                size="xl"
                class="min-h-11 shrink-0 self-start sm:self-center"
                trailing-icon="i-lucide-arrow-up-right"
                :label="props.buttonText"
                :to="props.buttonLink"
            />
        </div>
    </UContainer>
</template>
