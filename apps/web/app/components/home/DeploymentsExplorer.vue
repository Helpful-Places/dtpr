<script setup lang="ts">
    import type { DeploymentsCollectionItem } from '@nuxt/content'

    const props = defineProps<{
        deployments: DeploymentsCollectionItem[]
    }>()

    // Featured deployments lead the list; the rest stay alphabetical
    const listed = computed(() =>
        [...props.deployments].sort((a, b) => Number(b.featured) - Number(a.featured))
    )

    const selectedId = ref<string | null>(null)
    const selected = computed(() => props.deployments.find(d => d.id === selectedId.value))

    const map = ref<{ resetView: () => void } | null>(null)

    function reset() {
        selectedId.value = null
        map.value?.resetView()
    }

    function location(deployment: DeploymentsCollectionItem) {
        return [deployment.city, deployment.country].filter(Boolean).join(', ')
    }
</script>

<template>
    <div class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div class="relative h-[360px] overflow-hidden rounded-md bg-elevated shadow-sm ring ring-rule sm:h-[460px] lg:h-[520px]">
            <ClientOnly>
                <deploymentMap
                    ref="map"
                    :deployments="deployments"
                    :selected-id="selectedId"
                    :popups="false"
                    @select="selectedId = $event"
                />
            </ClientOnly>
            <UButton
                v-if="selectedId"
                variant="outline"
                size="lg"
                class="absolute left-3 top-3 min-h-11"
                icon="i-lucide-rotate-ccw"
                label="Reset view"
                @click="reset"
            />
        </div>

        <div class="flex flex-col rounded-md bg-white shadow-sm ring ring-rule lg:h-[520px]">
            <h3 class="border-b border-rule px-5 py-4 font-sans sm:px-6 text-xs font-semibold uppercase tracking-wider text-primary">
                {{ deployments.length }} deployments
            </h3>

            <ul class="max-h-64 min-h-0 flex-1 overflow-y-auto p-2 lg:max-h-none">
                <li v-for="deployment in listed" :key="deployment.id">
                    <button
                        type="button"
                        class="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-sm px-3 py-2 text-left text-sm transition-colors"
                        :class="deployment.id === selectedId ? 'bg-primary text-white' : 'hover:bg-primary-50'"
                        :aria-pressed="deployment.id === selectedId"
                        @click="selectedId = deployment.id"
                    >
                        <span class="font-semibold">{{ deployment.name }}</span>
                        <span class="shrink-0 text-xs" :class="deployment.id === selectedId ? 'text-white/80' : 'text-muted'">
                            {{ deployment.city }} <span aria-hidden="true">{{ deployment.flag }}</span>
                        </span>
                    </button>
                </li>
            </ul>

            <div :class="selected && 'border-t border-rule px-5 py-4 sm:px-6'" aria-live="polite">
                <div v-if="selected" class="flex items-start gap-3">
                    <img
                        :src="selected.logoPath"
                        alt=""
                        class="size-14 shrink-0 rounded-sm bg-white object-contain p-1 ring ring-rule"
                    />
                    <div class="min-w-0">
                        <p class="font-semibold leading-tight">{{ selected.name }}</p>
                        <p class="mt-1 text-sm text-muted">{{ location(selected) }}</p>
                        <p v-if="selected.description" class="mt-2 text-sm text-pretty">{{ selected.description }}</p>
                        <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
                            <ULink v-if="selected.url" :to="selected.url" target="_blank" class="inline-flex min-h-8 items-center gap-1 text-primary hover:text-secondary">
                                See DTPR deployment
                                <UIcon name="i-lucide-arrow-up-right" class="size-3.5"/>
                            </ULink>
                            <ULink v-if="selected.projectWebsiteUrl" :to="selected.projectWebsiteUrl" target="_blank" class="inline-flex min-h-8 items-center gap-1 text-primary hover:text-secondary">
                                Project website
                                <UIcon name="i-lucide-arrow-up-right" class="size-3.5"/>
                            </ULink>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
