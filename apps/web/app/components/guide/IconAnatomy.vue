<script setup lang="ts">
    import SectionHeader from '../sectionHeader.vue';
    import IconAnatomyFigure from './IconAnatomyFigure.vue';

    // Heading, running text and buttons. An image, such as a real sign, sits
    // beside the text, and when the section names an element one icon is taken
    // apart below it.
    const props = defineProps<{
        heading: string,
        subHeading?: string,
        body?: string,
        image?: string,
        imageAlt?: string,
        caption?: string,
        elementId?: string,
        schemaVersion?: string,
        hasButton?: boolean,
        buttonText?: string,
        buttonLink?: string,
        secondaryButtonText?: string,
        secondaryButtonLink?: string,
    }>()
</script>

<template>
    <UContainer as="section" class="section-pad">
        <SectionHeader :heading="props.heading" :sub-heading="props.subHeading"/>

        <div class="mt-6 grid gap-6" :class="props.image && 'lg:grid-cols-2'">
            <MDC
                v-if="props.body"
                :value="props.body"
                tag="div"
                class="prose max-w-2xl rounded-md bg-white p-6 text-pretty shadow-sm ring ring-rule sm:p-8 [--tw-prose-body:var(--ui-text-muted)] [--tw-prose-bold:var(--ui-text)] [--tw-prose-links:var(--ui-primary)] lg:max-w-none"
            />

            <!-- Framed like a Ways to deploy example: the whole sign on paper
                 raised, never cropped, with a caption strip below. From lg the
                 frame takes the text card's height. -->
            <figure v-if="props.image" class="flex flex-col overflow-hidden rounded-md bg-white shadow-sm ring ring-rule">
                <div class="relative aspect-square bg-elevated sm:aspect-[4/3] lg:aspect-auto lg:min-h-0 lg:flex-1">
                    <img
                        :src="props.image"
                        :alt="props.imageAlt ?? ''"
                        class="absolute inset-0 size-full object-contain p-4"
                        loading="lazy"
                    >
                </div>
                <figcaption v-if="props.caption" class="flex min-h-11 shrink-0 items-center border-t border-rule px-5 py-3 text-sm text-muted sm:px-6">
                    {{ props.caption }}
                </figcaption>
            </figure>
        </div>

        <IconAnatomyFigure v-if="props.elementId" class="mt-6" :element-id="props.elementId" :schema-version="props.schemaVersion"/>

        <div v-if="props.hasButton" class="mt-6 flex flex-wrap gap-3">
            <UButton
                v-if="props.buttonText && props.buttonLink"
                size="xl"
                class="min-h-11"
                trailing-icon="i-lucide-arrow-right"
                :label="props.buttonText"
                :to="props.buttonLink"
            />
            <UButton
                v-if="props.secondaryButtonText && props.secondaryButtonLink"
                variant="outline"
                size="xl"
                class="min-h-11"
                :label="props.secondaryButtonText"
                :to="props.secondaryButtonLink"
            />
        </div>
    </UContainer>
</template>
