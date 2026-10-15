<script setup lang="ts">
    import pageAssembler from '~/components/pageAssembler.vue';
    import Hero from '~/components/hero.vue';
    import SectionHeader from '~/components/sectionHeader.vue';

    const {data:page} = await useAsyncData('page-world', ()=>
        queryCollection('pages').path('/dtpr-in-the-world').first()
    );

    if(!page.value){
        throw createError({statusCode:404, statusMessage: 'Page Not Found'});
    }

    const { data: deployments } = await useAsyncData('world-deployments', () =>
        queryCollection('deployments').where('hidden', '=', false).order('name', 'ASC').all()
    );
    const { data: awards } = await useAsyncData('world-awards', () =>
        queryCollection('awards').order('year', 'DESC').all()
    );
    const { data: reports } = await useAsyncData('world-reports', () =>
        queryCollection('reports').order('publishedAt', 'DESC').all()
    );
    const { data: pressItems } = await useAsyncData('world-press', () =>
        queryCollection('press').order('publishedAt', 'DESC').all()
    );

    // The hero introduces the map; every other section follows the deployment list.
    const hero = computed(() => page.value?.sections.find(s => s.type === 'Hero'));
    const otherSections = computed(() => page.value?.sections.filter(s => s.type !== 'Hero') ?? []);

    // Awards and press reference a deployment by its file name, e.g. "sopa"
    function deploymentSlug(deployment: { stem: string }) {
        return deployment.stem.split('/').pop()!;
    }

    function groupByDeployment<T extends { deployments?: string[] }>(items: T[] | null | undefined) {
        const map: Record<string, T[]> = {};
        for (const item of items ?? []) {
            for (const slug of item.deployments ?? []) {
                (map[slug] ??= []).push(item);
            }
        }
        return map;
    }

    const awardsByDeployment = computed(() => groupByDeployment(awards.value));
    const pressByDeployment = computed(() => groupByDeployment(pressItems.value));
    const generalAwards = computed(() => (awards.value ?? []).filter(a => !a.deployments?.length));

    const expandedCards = ref(new Set<string>());
    // The "+N more" button removes itself, so focus moves to the first link it revealed.
    async function expand(id: string, event: MouseEvent) {
        const group = (event.currentTarget as HTMLElement).parentElement
        expandedCards.value.add(id)
        await nextTick()
        group?.querySelectorAll<HTMLElement>('a')[2]?.focus()
    }

    function visible<T>(items: T[], id: string) {
        return expandedCards.value.has(id) ? items : items.slice(0, 2);
    }

    // Dates are stored as YYYY-MM-DD; format in UTC so they don't slip a month.
    function monthYear(date: string) {
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' });
    }

    usePageSeo(page)
</script>

<template>
    <div v-if="page">
        <Hero v-if="hero" v-bind="hero"/>

        <UContainer>
            <DeploymentStats class="mb-6"/>
            <div class="h-[360px] overflow-hidden rounded-md bg-elevated shadow-sm ring ring-rule sm:h-[460px] lg:h-[560px]">
                <ClientOnly>
                    <deploymentMap :deployments="deployments ?? []"/>
                </ClientOnly>
            </div>
        </UContainer>

        <UContainer v-if="deployments?.length" as="section" class="section-pad">
            <SectionHeader heading="Communities Who Have Deployed DTPR"/>
            <ul class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <li
                    v-for="deployment in deployments"
                    :key="deployment.id"
                    class="flex flex-col rounded-md bg-elevated shadow-sm ring ring-rule"
                >
                    <div class="flex flex-1 flex-col gap-3 p-5 sm:p-6">
                        <div class="flex items-start gap-3">
                            <img
                                :src="deployment.logoPath"
                                alt=""
                                class="size-18 shrink-0 rounded-sm bg-white object-contain p-2"
                                loading="lazy"
                            />
                            <div class="min-w-0">
                                <h3 class="font-sans text-xl font-semibold text-balance">{{ deployment.name }}</h3>
                                <p class="text-sm text-muted">
                                    <span v-if="deployment.flag" class="mr-1 text-xl" aria-hidden="true">{{ deployment.flag }}</span>
                                    {{ [deployment.city, deployment.country].filter(Boolean).join(', ') }}
                                </p>
                                <div v-if="deployment.pressReleaseUrl || deployment.projectWebsiteUrl" class="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                    <ULink
                                        v-if="deployment.pressReleaseUrl"
                                        :to="deployment.pressReleaseUrl"
                                        target="_blank"
                                        class="inline-flex items-center gap-1 text-sm"
                                    >
                                        <UIcon name="i-lucide-external-link" class="size-3.5"/>
                                        Press Release<span class="sr-only">, {{ deployment.name }}</span>
                                    </ULink>
                                    <ULink
                                        v-if="deployment.projectWebsiteUrl"
                                        :to="deployment.projectWebsiteUrl"
                                        target="_blank"
                                        class="inline-flex items-center gap-1 text-sm"
                                    >
                                        <UIcon name="i-lucide-external-link" class="size-3.5"/>
                                        Project Website<span class="sr-only">, {{ deployment.name }}</span>
                                    </ULink>
                                </div>
                            </div>
                        </div>

                        <div v-if="awardsByDeployment[deploymentSlug(deployment)]?.length" class="flex flex-wrap gap-1.5">
                            <a
                                v-for="award in visible(awardsByDeployment[deploymentSlug(deployment)]!, deployment.id)"
                                :key="award.id"
                                :href="award.url"
                                target="_blank"
                                rel="noopener noreferrer"
                                class="inline-flex items-center gap-1 rounded-full bg-accented px-2.5 py-0.5 text-sm text-primary hover:bg-primary hover:text-inverted"
                            >
                                <UIcon name="i-lucide-trophy" class="size-3.5 shrink-0"/>
                                {{ award.title }}
                            </a>
                            <button
                                v-if="awardsByDeployment[deploymentSlug(deployment)]!.length > 2 && !expandedCards.has(deployment.id)"
                                type="button"
                                class="cursor-pointer rounded-full border border-default px-2.5 py-0.5 text-sm text-muted hover:border-primary hover:text-primary"
                                @click="expand(deployment.id, $event)"
                            >
                                +{{ awardsByDeployment[deploymentSlug(deployment)]!.length - 2 }} more<span class="sr-only"> awards for {{ deployment.name }}</span>
                            </button>
                        </div>

                        <div v-if="pressByDeployment[deploymentSlug(deployment)]?.length" class="flex flex-wrap gap-1.5">
                            <a
                                v-for="item in visible(pressByDeployment[deploymentSlug(deployment)]!, deployment.id)"
                                :key="item.id"
                                :href="item.url"
                                target="_blank"
                                rel="noopener noreferrer"
                                :title="item.title"
                                class="inline-flex items-center gap-1 rounded-full border border-default bg-default px-2.5 py-0.5 text-sm text-muted hover:border-primary hover:text-primary"
                            >
                                <UIcon name="i-lucide-newspaper" class="size-3.5 shrink-0"/>
                                {{ item.publication }}<span class="sr-only">: {{ item.title }}</span>
                            </a>
                            <button
                                v-if="pressByDeployment[deploymentSlug(deployment)]!.length > 2 && !expandedCards.has(deployment.id)"
                                type="button"
                                class="cursor-pointer rounded-full border border-default px-2.5 py-0.5 text-sm text-muted hover:border-primary hover:text-primary"
                                @click="expand(deployment.id, $event)"
                            >
                                +{{ pressByDeployment[deploymentSlug(deployment)]!.length - 2 }} more<span class="sr-only"> press articles about {{ deployment.name }}</span>
                            </button>
                        </div>
                    </div>

                    <a
                        v-if="deployment.url"
                        :href="deployment.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="mt-auto flex items-center justify-between border-t border-default px-5 py-4 text-sm sm:px-6 font-medium text-primary hover:bg-accented"
                    >
                        <span>See DTPR Deployment<span class="sr-only">, {{ deployment.name }}</span></span>
                        <UIcon name="i-lucide-arrow-up-right" class="size-4"/>
                    </a>
                </li>
            </ul>
        </UContainer>

        <pageAssembler :sections="otherSections"></pageAssembler>

        <UContainer v-if="generalAwards.length" as="section" class="section-pad">
            <SectionHeader heading="Awards and Funding"/>
            <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <component
                    :is="award.url ? 'a' : 'div'"
                    v-for="award in generalAwards"
                    :key="award.id"
                    :href="award.url"
                    :target="award.url ? '_blank' : undefined"
                    :rel="award.url ? 'noopener noreferrer' : undefined"
                    class="flex flex-col gap-4 rounded-md bg-elevated p-5 shadow-sm ring ring-rule sm:p-6"
                    :class="award.url ? 'transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:ring-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0' : ''"
                >
                    <img :src="award.imagePath" alt="" class="h-20 self-start object-contain" loading="lazy"/>
                    <div>
                        <h3 class="font-sans text-xl font-semibold text-balance">{{ award.title }}</h3>
                        <p class="mt-1 text-sm text-muted">{{ award.organization }} &middot; {{ award.year }}</p>
                        <p class="mt-2 text-sm">{{ award.description }}</p>
                    </div>
                </component>
            </div>
        </UContainer>

        <UContainer v-if="reports?.length" as="section" class="section-pad">
            <SectionHeader heading="Reports"/>
            <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <article
                    v-for="report in reports"
                    :key="report.id"
                    class="flex gap-4 rounded-md bg-elevated p-5 shadow-sm ring ring-rule sm:p-6"
                >
                    <img v-if="report.imageUrl" :src="report.imageUrl" alt="" class="size-16 shrink-0 object-contain" loading="lazy"/>
                    <div class="min-w-0">
                        <h3 class="font-sans text-xl font-semibold text-balance">{{ report.title }}</h3>
                        <p class="mt-1 text-sm text-muted">
                            {{ [report.author, report.organization, report.publishedAt && monthYear(report.publishedAt)].filter(Boolean).join(' · ') }}
                        </p>
                        <ContentRenderer :value="report" class="prose prose-sm mt-2 max-w-none [--tw-prose-body:var(--ui-text)]"/>
                        <div class="mt-3 flex flex-wrap gap-2">
                            <UButton v-if="report.url" :to="report.url" target="_blank" label="View report"/>
                            <UButton v-if="report.pdfUrl" :to="report.pdfUrl" target="_blank" variant="outline" label="Download PDF"/>
                        </div>
                    </div>
                </article>
            </div>
        </UContainer>

        <UContainer v-if="pressItems?.length" as="section" class="section-pad">
            <SectionHeader heading="In the Press"/>
            <ul class="mt-6 divide-y divide-rule rounded-md bg-white shadow-sm ring ring-rule">
                <li v-for="item in pressItems" :key="item.id" class="first:*:rounded-t-md last:*:rounded-b-md">
                    <a
                        :href="item.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="flex flex-col gap-x-6 gap-y-1 px-5 py-4 transition-colors hover:bg-primary-50 sm:px-6 md:flex-row md:items-baseline md:justify-between"
                    >
                        <h3 class="font-sans text-base font-semibold text-pretty">{{ item.title }}</h3>
                        <p class="shrink-0 text-sm text-muted">
                            {{ item.publication }}<span v-if="item.publishedAt"> &middot; {{ monthYear(item.publishedAt) }}</span>
                        </p>
                    </a>
                </li>
            </ul>
        </UContainer>
    </div>
</template>
