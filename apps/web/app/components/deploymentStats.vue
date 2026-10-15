<script setup lang="ts">
    // Every figure is counted from the content collections, so the cards
    // cannot drift from the deployments, awards and press listed on the site.
    const { data: stats } = await useAsyncData('deployment-stats', async () => {
        const [deployments, awards, press] = await Promise.all([
            queryCollection('deployments').where('hidden', '=', false).select('country').all(),
            queryCollection('awards').count(),
            queryCollection('press').count()
        ])
        return {
            communities: deployments.length,
            countries: new Set(deployments.map(d => d.country).filter(Boolean)).size,
            awards,
            press
        }
    })

    const figures = computed(() => stats.value ? [
        { value: stats.value.communities, label: 'communities using DTPR' },
        { value: stats.value.countries, label: 'countries' },
        { value: stats.value.awards, label: 'awards and grants' },
        { value: stats.value.press, label: 'press articles' }
    ] : [])
</script>

<template>
    <dl v-if="figures.length" class="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <div
            v-for="figure in figures"
            :key="figure.label"
            class="flex flex-col-reverse justify-end rounded-md bg-white p-5 shadow-sm ring ring-rule sm:p-6"
        >
            <dt class="mt-1 text-pretty text-muted">{{ figure.label }}</dt>
            <dd class="font-sans text-4xl font-semibold tabular-nums text-primary sm:text-5xl">{{ figure.value }}</dd>
        </div>
    </dl>
</template>
