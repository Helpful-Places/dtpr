<script setup lang="ts">
    import SectionHeader from '../sectionHeader.vue';

    const { data: home } = await useAsyncData('home', () =>
        queryCollection('home').first()
    );

    const copy = computed(() => home.value?.engage)

    const external = (link?: string) => !!link && /^https?:/.test(link)
    // Links that leave the site, mail included, take the outward arrow.
    const leaves = (link?: string) => !!link && /^(https?|mailto):/.test(link)
</script>

<template>
    <UContainer v-if="copy" as="section" class="section-pad">
        <SectionHeader :heading="copy.heading" :sub-heading="copy.subHeading"/>
        <div class="mt-6 grid gap-6 lg:grid-cols-2">
            <!-- The four ways in come first; the workshop photo sits beside them. -->
            <ol class="divide-y divide-rule rounded-md bg-white shadow-sm ring ring-rule">
                <li
                    v-for="track in copy.tracks"
                    :key="track.heading"
                    class="px-5 py-4 sm:px-6"
                >
                    <h3 class="font-sans text-xl font-semibold text-balance">{{ track.heading }}</h3>
                    <p class="mt-1 text-pretty text-muted">{{ track.body }}</p>
                    <!-- Each persona starts in Get Started, then takes part. -->
                    <div class="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                        <UButton
                            variant="outline"
                            size="lg"
                            class="min-h-11"
                            trailing-icon="i-lucide-arrow-right"
                            :label="track.linkText"
                            :to="track.link"
                        />
                        <NuxtLink
                            v-if="track.involveText && track.involveLink"
                            :to="track.involveLink"
                            :target="external(track.involveLink) ? '_blank' : undefined"
                            class="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:text-secondary"
                        >
                            {{ track.involveText }}
                            <UIcon :name="leaves(track.involveLink) ? 'i-lucide-arrow-up-right' : 'i-lucide-arrow-right'" class="size-4"/>
                        </NuxtLink>
                    </div>
                </li>
            </ol>

            <!-- Beside the rows from 1024px, the photo card takes their height: the
                 picture fills whatever is left above its caption. -->
            <div class="flex flex-col overflow-hidden rounded-md bg-white shadow-sm ring ring-rule">
                <img :src="copy.image" :alt="copy.imageAlt ?? ''" class="aspect-[16/10] w-full object-cover lg:aspect-auto lg:min-h-0 lg:flex-1" loading="lazy"/>
                <div class="shrink-0 p-5 sm:p-6">
                    <h3 class="font-sans text-xl font-semibold text-balance">{{ copy.captionHeading }}</h3>
                    <p class="mt-2 text-pretty text-muted">{{ copy.captionBody }}</p>
                </div>
            </div>
        </div>
        <div class="mt-6 flex flex-wrap gap-3">
            <UButton
                v-if="copy.buttonText && copy.buttonLink"
                size="xl"
                class="min-h-11"
                trailing-icon="i-lucide-arrow-right"
                :label="copy.buttonText"
                :to="copy.buttonLink"
            />
            <UButton
                variant="outline"
                size="xl"
                class="min-h-11"
                trailing-icon="i-lucide-arrow-right"
                :label="copy.allText"
                :to="copy.allLink"
            />
        </div>
    </UContainer>
</template>
