<script setup lang="ts">
    import type { RouteLocationRaw } from 'vue-router'
    import SectionHeader from '../sectionHeader.vue';

    // A few of the taxonomy's questions, each answered by two systems side by
    // side, so the reader sees one question fit very different technology.
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

    // Two awaits as top-level statements, so each keeps the Nuxt context.
    const [first, second] = props.datachains ?? []
    const sampleA = await useDatachainSample(first?.src, 'guide-rows-a')
    const sampleB = await useDatachainSample(second?.src, 'guide-rows-b')
    const systems = [{ ...first!, ...sampleA }, { ...second!, ...sampleB }]
        .filter((s) => s.src && s.chain.value && s.taxonomy.value)

    // The questions come from the API, in the order the content lists them.
    const rows = computed(() => (props.categories ?? []).flatMap((id) => {
        const category = systems.map((s) => s.taxonomy.value!.categories.find((c) => c.id === id)).find(Boolean)
        return category ? [{ category, answers: systems.map((s) => s.placedIn(id)) }] : []
    }))

    // The filled-in text of an answer, apart from the name it already shows.
    const statement = (system: typeof systems[number], placed: DtprDatachainElement) => {
        const v = system.values(placed)
        return v.description || v.additional_description || ''
    }

    // The share link is built in the browser: its gzip header carries a
    // timestamp, so a server-rendered one would never match on hydration.
    const builder = useFeature('builder')
    const builderLink = ref<RouteLocationRaw>('/taxonomy/builder')
    onMounted(() => {
        const chain = systems[0]?.chain.value
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

        <article v-if="systems.length && rows.length" class="mt-6 rounded-md bg-white shadow-sm ring ring-rule">
            <header class="hidden border-b border-rule px-5 py-4 sm:px-6 md:grid md:grid-cols-[15rem_minmax(0,1fr)_minmax(0,1fr)] md:gap-x-6">
                <p class="text-xs font-semibold uppercase tracking-wider text-primary">The question</p>
                <div v-for="system in systems" :key="system.src">
                    <p class="text-xs font-semibold uppercase tracking-wider text-primary">{{ system.label }}</p>
                    <h3 class="mt-1 font-sans text-base font-semibold text-balance">{{ dtprText(system.chain.value!.title) }}</h3>
                </div>
            </header>

            <div class="divide-y divide-rule">
                <section
                    v-for="row in rows"
                    :key="row.category.id"
                    class="grid gap-x-6 gap-y-4 px-5 py-4 sm:px-6 md:grid-cols-[15rem_minmax(0,1fr)_minmax(0,1fr)]"
                >
                    <h4 class="font-sans text-base font-semibold leading-snug text-balance">{{ dtprText(row.category.prompt) }}</h4>

                    <div v-for="(system, i) in systems" :key="system.src">
                        <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-primary md:hidden">{{ system.label }}</p>
                        <ul class="space-y-3">
                            <li v-for="placed in row.answers[i]" :key="placed.element_id + placed.priority" class="flex gap-3">
                                <img :src="system.icon(placed)" alt="" width="40" height="40" class="size-10 shrink-0" loading="lazy">
                                <div class="min-w-0 text-sm">
                                    <p class="font-semibold leading-tight">{{ system.title(placed) }}</p>
                                    <p v-if="system.note(row.category, placed)" class="text-xs text-muted">{{ system.note(row.category, placed) }}</p>
                                    <p v-if="statement(system, placed)" class="mt-1 text-pretty text-muted">{{ statement(system, placed) }}</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </section>
            </div>

            <footer class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-rule px-5 py-3 text-xs text-muted sm:px-6">
                <p class="text-pretty">Examples written by the DTPR team from public records. They are not published by the organizations named.</p>
                <p class="font-code">{{ systems[0]!.taxonomy.value!.version }}</p>
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
