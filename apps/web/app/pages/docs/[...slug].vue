<script setup lang="ts">
    import type { ContentNavigationItem } from '@nuxt/content'
    const route=useRoute()

     const {data : navigationTree}=await useAsyncData('docs-navigation', ()=>{
        return queryCollectionNavigation('docs');
    });

    const {data:page}=await useAsyncData('docs/'+route.path, ()=>{
            return queryCollection('docs').path(route.path).first()
        });

    // .navigation.yml files only title sidebar groups; they are not pages.
    if(!page.value || page.value.extension === 'yml'){
        throw createError({statusCode:404, statusMessage:'Page Not Found', fatal:true});
    }

    usePageSeo(page)

    // Deployers and developers each get their own tree. Concepts belongs to
    // both, so it gets a short list that leads into either.
    const trees = {
        deployers: { title: 'Deployer docs', path: '/docs/deployers' },
        developers: { title: 'Developer docs', path: '/docs/developers' },
    } as const
    type TreeKey = keyof typeof trees
    const treeKey = computed(() => route.path.split('/')[2] as TreeKey | undefined)
    const tree = computed(() => treeKey.value && treeKey.value in trees ? trees[treeKey.value] : null)
    const isConcepts = computed(() => page.value?.path === '/docs/concepts')
    const label = computed(() => tree.value?.title ?? 'Docs')
    // A tree's landing page is titled by the tree already, so its eyebrow is just Docs.
    const eyebrow = computed(() => !tree.value || page.value?.path === tree.value.path ? 'Docs' : label.value)

    function findNode(items: ContentNavigationItem[], path: string): ContentNavigationItem | undefined {
        for (const item of items) {
            if (item.path === path && item.children?.length) return item
            const found = item.children?.length ? findNode(item.children, path) : undefined
            if (found) return found
        }
    }

    const navigation = computed<ContentNavigationItem[]>(() => {
        if (!tree.value) {
            return [
                { title: 'Concepts', path: '/docs/concepts' },
                { title: 'Attribution', path: '/docs/attribution' },
                { title: 'Cite DTPR', path: '/docs/cite' },
            ]
        }
        return findNode(navigationTree.value ?? [], tree.value.path)?.children ?? []
    })

    // Under the tree: the other tree, and Concepts, which both share. Under
    // the shared pages, both trees.
    const elsewhere = computed(() => {
        if (!tree.value) {
            return [
                { label: trees.deployers.title, to: trees.deployers.path },
                { label: trees.developers.title, to: trees.developers.path },
            ]
        }
        const other = treeKey.value === 'deployers' ? trees.developers : trees.deployers
        return [{ label: 'Concepts', to: '/docs/concepts' }, { label: other.title, to: other.path }]
    })

    function flattenNavigation(items: ContentNavigationItem[]): ContentNavigationItem[] {
        return items.flatMap((item) => {
            const { children, ...rest } = item

            // Always descend into children so nested real pages are still reachable
            const childResults = children ? flattenNavigation(children) : []

            // Only keep this node itself if it's backed by real content
            const isLinkable = rest.page !== false

            return isLinkable ? [rest, ...childResults] : childResults
        })
    }

    const flatNavigation = computed(() => tree.value ? flattenNavigation(navigation.value) : [])

    function isInTree(item: ContentNavigationItem): boolean {
        return item.children?.length ? item.children.some(isInTree) : item.path === route.path
    }

    // Top-level groups start open. Deeper groups, such as the long API
    // references, open only when the current page is inside them.
    function withOpenState(items: ContentNavigationItem[], depth = 0): ContentNavigationItem[] {
        return items.map(item => item.children?.length
            ? { ...item, defaultOpen: depth === 0 || isInTree(item), children: withOpenState(item.children, depth + 1) }
            : item)
    }

    const sidebar = computed(() => withOpenState(navigation.value))

    // A missing neighbour is undefined; UContentSurround leaves its slot empty.
    const surround = computed(() => {
        const flat = flatNavigation.value
        const currentIndex = flat.findIndex((item) => item.path === route.path)

        if (currentIndex === -1) return [] as ContentNavigationItem[]

        return [
            flat[currentIndex - 1],
            flat[currentIndex + 1]
        ] as ContentNavigationItem[]
        })
</script>

<template>
    <DocsBetaNotice />
    <!-- The same hero as every other page; it holds the page's only h1. -->
    <Hero v-if="page" :eyebrow="eyebrow" :heading="page.title" :sub-heading="page.description" />
    <UContainer class="pb-8 sm:pb-10">
        <UPage class="rounded-md bg-white px-4 shadow-sm ring ring-rule sm:px-8 lg:px-10">
            <template #left>
                <UPageAside>
                    <p class="mb-3 font-sans text-sm font-semibold text-highlighted">
                        <NuxtLink v-if="tree" :to="tree.path" class="hover:text-primary">{{ label }}</NuxtLink>
                        <template v-else>{{ label }}</template>
                    </p>
                    <UContentNavigation :aria-label="label" variant="link" highlight :navigation="sidebar" />
                    <ul v-if="elsewhere.length" class="mt-6 space-y-1 border-t border-rule pt-4 text-sm">
                        <li v-for="link in elsewhere" :key="link.to">
                            <NuxtLink :to="link.to" class="inline-flex min-h-8 items-center gap-1 text-muted hover:text-primary">
                                {{ link.label }}
                                <UIcon name="i-lucide-arrow-right" class="size-3.5"/>
                            </NuxtLink>
                        </li>
                    </ul>
                </UPageAside>
            </template>
            <details class="group border-b border-rule py-3 lg:hidden">
                <summary class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold text-primary [&::-webkit-details-marker]:hidden">
                    {{ label }} menu
                    <UIcon name="i-lucide-chevron-down" class="size-5 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" />
                </summary>
                <UContentNavigation :aria-label="label" variant="link" highlight :navigation="sidebar" class="pb-2 pt-3" />
                <ul v-if="elsewhere.length" class="border-t border-rule pt-3 pb-2 text-sm">
                    <li v-for="link in elsewhere" :key="link.to">
                        <NuxtLink :to="link.to" class="inline-flex min-h-11 items-center gap-1 text-muted hover:text-primary">
                            {{ link.label }}
                            <UIcon name="i-lucide-arrow-right" class="size-3.5"/>
                        </NuxtLink>
                    </li>
                </ul>
            </details>
            <UPageBody class="wrap-anywhere">
                <!-- Concepts serves both audiences, so it alone offers the Developer view. -->
                <div v-if="isConcepts" class="flex justify-end">
                    <DeveloperToggle />
                </div>
                <ContentRenderer :value="page"></ContentRenderer>
                <UContentSurround v-if="tree" :surround="surround" />
            </UPageBody>

        </UPage>
    </UContainer>

</template>
