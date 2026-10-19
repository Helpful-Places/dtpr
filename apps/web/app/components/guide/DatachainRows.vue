<script setup lang="ts">
    import type { RouteLocationRaw } from 'vue-router'
    import SectionHeader from '../sectionHeader.vue';

    // One system answering a few of the taxonomy's questions, one element
    // each, above every other question the taxonomy can ask. The questions
    // carry the section; the answers show what one looks like.
    const props = defineProps<{
        heading: string,
        subHeading?: string,
        body?: string,
        datachains?: { src: string, label: string }[],
        categories?: string[],
        hasButton?: boolean,
        buttonText?: string,
        buttonLink?: string,
        secondaryButtonText?: string,
        secondaryButtonLink?: string,
    }>()

    // Only the first datachain is shown.
    const first = props.datachains?.[0]
    const sample = await useDatachainSample(first?.src, 'guide-rows')
    const system = sample.chain.value && sample.taxonomy.value ? { ...first!, ...sample } : null

    // A datachain drawn from public records cites them; a made-up one does not.
    const sources = system?.chain.value?.sources
    const sourced = Array.isArray(sources) && sources.length > 0

    // Every question in the datachain's taxonomy, in the taxonomy's order.
    const { data: questions } = await useFetch('/api/taxonomy', {
        key: 'guide-rows-questions',
        query: { v: sample.chain.value?.schema_version },
        immediate: !!system,
        transform: (full: DtprTaxonomy) => [...full.categories]
            .sort((a, b) => a.order - b.order)
            .map(({ id, name, prompt, shape, element_context }) => ({ id, name, prompt, shape, element_context })),
    })

    // The featured questions, in the order the content lists them, each with
    // the datachain's first answer. Every other question follows, unanswered.
    const answered = computed(() => (props.categories ?? []).flatMap((id) => {
        const category = questions.value?.find((c) => c.id === id)
        const placed = system?.placedIn(id)[0]
        return category && placed ? [{ category, placed }] : []
    }))
    const others = computed(() => (questions.value ?? []).filter((c) => !answered.value.some((a) => a.category.id === c.id)))

    // The share link is built in the browser: its gzip header carries a
    // timestamp, so a server-rendered one would never match on hydration.
    const builder = useFeature('builder')
    const builderLink = ref<RouteLocationRaw>('/taxonomy/builder')
    onMounted(() => {
        const chain = system?.chain.value
        if (chain) builderLink.value = { path: '/taxonomy/builder', query: { v: chain.schema_version }, hash: `#data=${dtprEncodeShare(chain)}` }
    })
</script>

<template>
    <UContainer as="section" class="section-pad">
        <SectionHeader :heading="props.heading" :sub-heading="props.subHeading"/>

        <MDC
            v-if="props.body"
            :value="props.body"
            tag="div"
            class="prose mt-6 max-w-2xl rounded-md bg-white p-6 text-pretty shadow-sm ring ring-rule sm:p-8 [--tw-prose-body:var(--ui-text-muted)] [--tw-prose-bold:var(--ui-text)] [--tw-prose-links:var(--ui-primary)]"
        />

        <article v-if="system && answered.length" class="mt-6 rounded-md bg-white shadow-sm ring ring-rule">
            <header class="border-b border-rule px-5 py-4 sm:px-6">
                <p class="text-xs font-semibold uppercase tracking-wider text-primary">{{ system.label }}</p>
                <h3 class="mt-1 font-sans text-xl font-semibold text-balance text-primary">{{ dtprText(system.chain.value!.title) }}</h3>
            </header>

            <ol class="divide-y divide-rule">
                <li
                    v-for="row in answered"
                    :key="row.category.id"
                    class="grid items-center gap-x-6 gap-y-3 px-5 py-4 sm:px-6 md:grid-cols-2"
                >
                    <h4 class="font-serif text-xl font-semibold leading-snug text-balance text-highlighted">{{ dtprText(row.category.prompt) }}</h4>
                    <div class="flex items-center gap-3">
                        <img :src="system.icon(row.placed)" alt="" width="40" height="40" class="size-10 shrink-0" loading="lazy">
                        <div class="min-w-0 text-sm">
                            <p class="font-semibold leading-tight">{{ system.title(row.placed) }}</p>
                            <p v-if="system.note(row.category, row.placed)" class="text-xs text-muted">{{ system.note(row.category, row.placed) }}</p>
                        </div>
                    </div>
                </li>
            </ol>

            <!-- The rest of the taxonomy, as questions only. Each takes its
                 category's shape, so the outlines read as they do on a sign. -->
            <div v-if="others.length" class="border-t border-rule bg-elevated px-5 py-5 sm:px-6">
                <h4 class="text-xs font-semibold uppercase tracking-wider text-primary">Asked when they apply</h4>
                <ul class="mt-3 grid gap-x-6 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    <li v-for="category in others" :key="category.id" class="flex items-start gap-2.5 font-serif text-base leading-snug text-pretty text-default">
                        <img :src="dtprShapeUrl(category.shape)" alt="" width="20" height="20" class="mt-px size-5 shrink-0" loading="lazy">
                        <span>{{ dtprText(category.prompt) }}</span>
                    </li>
                </ul>
            </div>

            <footer class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-rule px-5 py-3 text-xs text-muted sm:px-6">
                <p class="text-pretty">{{ sourced
                    ? 'Example written by the DTPR team from public records. It is not published by the organization named.'
                    : 'A fictional example written by the DTPR team.' }}</p>
                <p class="font-code">{{ system.taxonomy.value!.version }}</p>
            </footer>
        </article>

        <div v-if="props.hasButton || builder" class="mt-6 flex flex-wrap gap-3">
            <UButton
                v-if="props.hasButton && props.buttonText && props.buttonLink"
                size="xl"
                class="min-h-11"
                trailing-icon="i-lucide-arrow-right"
                :label="props.buttonText"
                :to="props.buttonLink"
            />
            <UButton
                v-if="props.hasButton && props.secondaryButtonText && props.secondaryButtonLink"
                variant="outline"
                size="xl"
                class="min-h-11"
                :label="props.secondaryButtonText"
                :to="props.secondaryButtonLink"
            />
            <UButton
                v-if="builder"
                variant="outline"
                size="xl"
                class="min-h-11"
                label="Open an example in the builder"
                :to="builderLink"
            />
        </div>
    </UContainer>
</template>
