<script setup lang="ts">
    // How one icon is built: the element's symbol, inside the shape its
    // category sets, coloured by the context value a datachain chooses.
    const props = defineProps<{
        elementId: string,
        schemaVersion?: string,
    }>()

    const elementId = props.elementId

    const { data } = await useFetch('/api/taxonomy', {
        key: `guide-anatomy-${elementId}-${props.schemaVersion ?? ''}`,
        query: { v: props.schemaVersion },
        transform: (full: DtprTaxonomy) => {
            const element = full.elements.find((e) => e.id === elementId)
            const category = full.categories.find((c) => c.id === element?.category_id)
            if (!element || !category) return null
            const { id, title, symbol_id, shape, icon_variants } = element
            return {
                version: full.version.id,
                element: { id, title, symbol_id, shape, icon_variants },
                category: { name: category.name, element_context: category.element_context },
            }
        },
    })

    // Context values with a colour have their own icon; the rest are tags.
    const variants = computed(() => {
        const d = data.value
        if (!d) return []
        const coloured = (d.category.element_context?.values ?? []).filter((v) => v.color && d.element.icon_variants.includes(v.id))
        return [
            { id: 'default', name: 'No context chosen' },
            ...coloured.map((v) => ({ id: v.id, name: dtprText(v.name) })),
        ].map((v) => ({ ...v, src: dtprIconUrl(d.version, d.element.id, v.id) }))
    })

    const contextName = computed(() => dtprText(data.value?.category.element_context?.name))
</script>

<template>
    <figure v-if="data" class="rounded-md bg-white shadow-sm ring ring-rule">
        <ol class="grid divide-y divide-rule md:grid-cols-[1fr_1fr_2fr] md:divide-x md:divide-y-0">
            <li class="px-5 py-5 sm:px-6">
                <img :src="`${dtprSchemaUrl(data.version)}/symbols/${data.element.symbol_id}.svg`" alt="" width="64" height="64" class="size-16">
                <h3 class="mt-3 font-sans text-base font-semibold">Symbol</h3>
                <p class="mt-1 text-sm text-pretty text-muted">The drawing that stands for the element, here {{ dtprText(data.element.title) }}.</p>
            </li>
            <li class="px-5 py-5 sm:px-6">
                <img :src="dtprShapeUrl(data.element.shape)" alt="" width="64" height="64" class="size-16">
                <h3 class="mt-3 font-sans text-base font-semibold">Shape</h3>
                <p class="mt-1 text-sm text-pretty text-muted">Set by the category, {{ dtprText(data.category.name) }}. Every element in it shares the outline.</p>
            </li>
            <li class="px-5 py-5 sm:px-6">
                <ul class="flex flex-wrap gap-x-5 gap-y-3">
                    <li v-for="variant in variants" :key="variant.id" class="w-24">
                        <img :src="variant.src" alt="" width="64" height="64" class="size-16">
                        <p class="mt-1 text-xs leading-snug text-muted">{{ variant.name }}</p>
                    </li>
                </ul>
                <h3 class="mt-3 font-sans text-base font-semibold">Icon</h3>
                <p class="mt-1 text-sm text-pretty text-muted">
                    The symbol inside its shape.<template v-if="contextName"> A datachain picks a {{ contextName }} value, and the color shows which.</template>
                </p>
            </li>
        </ol>
        <figcaption class="sr-only">How the {{ dtprText(data.element.title) }} icon is built from a symbol, a shape and a context color</figcaption>
    </figure>
</template>
