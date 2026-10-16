<script setup lang="ts">
    const {data:nav}= await useNav();

    const route = useRoute()
    // A link stays marked on every page of its section, not only its own.
    const inSection = (url: string) => route.path === url || route.path.startsWith(`${url}/`)
    const menuOpen = ref(false)

    // The Docs button is the one link that stays put on every page, expanded
    // or compact. The fallback keeps it when a Studio dump predates the field.
    const docs = computed(() => nav.value?.docs ?? { label: 'Docs', addText: 'Guides and API reference', url: '/docs' })

    // The chevron beside it opens straight onto one set of docs. The button
    // itself still leads to the chooser.
    const docsMenu = computed(() => [
        (docs.value.sections ?? []).map(section => ({
            label: section.label,
            description: section.addText,
            icon: section.icon && `i-lucide-${section.icon}`,
            to: section.url,
        })),
        [{ label: 'All docs', icon: 'i-lucide-library', to: docs.value.url }],
    ])

    // The tile row and its fold-on-scroll are the home page's treatment; every
    // other page starts and stays in the compact bar.
    const isHome = computed(() => route.path === '/')
    const scrolled = ref(false)
    const compact = computed(() => !isHome.value || scrolled.value)

    // The header is rendered in flow, then pinned once its resting height is
    // known. The wrapper keeps that height, so collapsing the bar on scroll
    // never moves the page underneath it.
    const bar = ref<HTMLElement | null>(null)
    const restingHeight = ref<number | null>(null)
    let barWidth = 0
    let arriving = false
    let observer: ResizeObserver | undefined

    function measure() {
        if (!bar.value || menuOpen.value || (isHome.value && scrolled.value)) return
        restingHeight.value = bar.value.offsetHeight
    }

    // Follows the bar as it folds between pages. On the home page the reserved
    // height then holds still, so the scroll fold never moves the page.
    function onBarResize() {
        const width = bar.value?.offsetWidth ?? 0
        const reflowed = width !== barWidth
        barWidth = width
        if (!isHome.value || arriving || reflowed) measure()
    }

    function settle() {
        arriving = false
        measure()
    }

    function onScroll() {
        scrolled.value = window.scrollY > 24
    }

    onMounted(() => {
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        measure()
        if (bar.value) {
            barWidth = bar.value.offsetWidth
            observer = new ResizeObserver(onBarResize)
            observer.observe(bar.value)
        }
    })

    onBeforeUnmount(() => {
        window.removeEventListener('scroll', onScroll)
        observer?.disconnect()
    })

    watch(() => route.path, () => {
        menuOpen.value = false
        arriving = true
    })
    watch(compact, () => { menuOpen.value = false })
</script>

<template>
<div v-if="nav" class="print:hidden" :style="restingHeight ? { height: `${restingHeight}px` } : undefined">
    <header
        ref="bar"
        class="flow-root"
        :class="restingHeight ? 'fixed left-0 top-0 z-40 right-[var(--scrollbar-width,0px)]' : 'relative'"
    >
        <UContainer>
            <div
                class="rounded-md border transition-all duration-300 ease-out motion-reduce:transition-none"
                :class="compact || menuOpen
                    ? 'mt-3 border-rule bg-white/95 px-4 py-2 shadow-sm backdrop-blur-md'
                    : 'mt-4 border-transparent md:mt-10'"
                @transitionend.self="settle"
            >
                <div class="flex items-center justify-between gap-4">
                    <NuxtLink to="/" class="flex items-center py-2" prefetch-on="interaction">
                        <img
                            alt="DTPR home"
                            :src="nav.dtprLogo"
                            width="96"
                            height="36"
                            class="w-auto transition-[height] duration-300 ease-out motion-reduce:transition-none"
                            :class="compact ? 'h-7' : 'h-9'"
                        />
                    </NuxtLink>

                    <nav
                        aria-label="Main"
                        class="ml-auto hidden items-center gap-1 transition-opacity duration-300 motion-reduce:transition-none lg:flex"
                        :class="compact ? 'opacity-100' : 'pointer-events-none absolute opacity-0'"
                        :inert="!compact"
                    >
                        <NuxtLink v-for="link in nav.links"
                        :key="link.url"
                        :to="link.url"
                        class="rounded-sm px-3 py-2 font-sans text-xs font-semibold uppercase tracking-wider text-muted transition-colors hover:bg-secondary/10 hover:text-secondary"
                        :class="inSection(link.url) && 'bg-primary/10 text-primary'"
                        prefetch-on="interaction">
                            {{ link.label }}
                        </NuxtLink>
                    </nav>

                    <div class="flex items-center gap-3">
                        <!-- Wherever the Menu button shows, Docs moves into the menu. -->
                        <div
                            class="rounded-sm border transition-colors"
                            :class="[
                                compact ? 'hidden lg:flex' : 'hidden md:flex',
                                inSection(docs.url) ? 'border-primary/60 bg-primary/10' : 'border-rule bg-white',
                            ]"
                        >
                            <NuxtLink
                                :to="docs.url"
                                class="inline-flex min-h-11 items-center px-3 font-sans text-xs font-semibold uppercase tracking-wider text-primary transition-colors hover:text-secondary lg:min-h-9"
                                prefetch-on="interaction"
                            >
                                {{ docs.label }}
                            </NuxtLink>
                            <UDropdownMenu
                                v-if="docs.sections?.length"
                                :items="docsMenu"
                                :content="{ align: 'end', sideOffset: 8 }"
                                :ui="{ content: 'w-72', itemDescription: 'text-xs' }"
                            >
                                <button
                                    type="button"
                                    :aria-label="`${docs.label} sections`"
                                    class="inline-flex min-h-11 min-w-9 items-center justify-center border-l border-inherit text-primary transition-colors hover:text-secondary data-[state=open]:text-secondary lg:min-h-9 lg:min-w-8"
                                >
                                    <UIcon name="i-lucide-chevron-down" class="size-4 transition-transform in-data-[state=open]:rotate-180"/>
                                </button>
                            </UDropdownMenu>
                        </div>

                        <button
                            type="button"
                            class="inline-flex min-h-11 items-center gap-2 rounded-sm border border-rule bg-white px-3 font-sans text-sm font-semibold text-primary lg:hidden"
                            :class="compact ? '' : 'md:hidden'"
                            :aria-expanded="menuOpen"
                            aria-controls="site-nav"
                            @click="menuOpen = !menuOpen"
                        >
                            <svg class="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
                                <path v-if="menuOpen" d="M3.5 3.5l9 9M12.5 3.5l-9 9"/>
                                <path v-else d="M2 4.5h12M2 8h12M2 11.5h12"/>
                            </svg>
                            {{ menuOpen ? 'Close' : 'Menu' }}
                        </button>
                    </div>
                </div>

                <!-- Tiles: the home page's expanded desktop nav, folded away once the page scrolls. -->
                <div
                    class="hidden transition-[grid-template-rows,opacity,margin] duration-300 ease-out motion-reduce:transition-none md:grid"
                    :class="compact ? 'mt-0 grid-rows-[0fr] opacity-0' : 'mt-8 grid-rows-[1fr] opacity-100'"
                    :inert="compact"
                    @transitionend.self="settle"
                >
                    <nav
                        aria-label="Main"
                        class="-m-1 flex min-h-0 flex-row flex-wrap gap-3 overflow-hidden p-1 xl:grid xl:grid-cols-5 xl:gap-4"
                    >
                        <NuxtLink v-for="link in nav.links"
                        :key="link.url"
                        :to="link.url"
                        class="flex min-h-11 flex-col justify-center rounded-md border border-rule bg-white px-4 py-2.5 transition-colors hover:border-primary/40 xl:px-5"
                        :class="inSection(link.url) && 'border-primary/60'"
                        prefetch-on="interaction">
                            <p class="font-sans text-xs font-semibold uppercase tracking-wider text-primary">{{link.label}}</p>
                            <p class="hidden font-sans text-xs text-default xl:block">{{link.addText}}</p>
                        </NuxtLink>
                    </nav>
                </div>

                <!-- The header is pinned, so a menu taller than the screen scrolls
                     on its own; the page under it cannot bring the end into view. -->
                <nav
                    v-show="menuOpen"
                    id="site-nav"
                    aria-label="Main"
                    class="flex max-h-[calc(100dvh-6rem)] flex-col gap-2 overflow-y-auto overscroll-contain pb-2 pt-3 lg:hidden"
                >
                    <NuxtLink v-for="link in nav.links"
                    :key="link.url"
                    :to="link.url"
                    class="flex min-h-11 flex-col justify-center rounded-md border border-rule bg-white px-4 py-2.5 transition-colors hover:border-primary/40"
                    :class="inSection(link.url) && 'border-primary/60'"
                    prefetch-on="interaction">
                        <p class="font-sans text-xs font-semibold uppercase tracking-wider text-primary">{{link.label}}</p>
                        <p class="font-sans text-xs text-default">{{link.addText}}</p>
                    </NuxtLink>
                    <NuxtLink
                        :to="docs.url"
                        class="flex min-h-11 flex-col justify-center rounded-md border border-rule bg-white px-4 py-2.5 transition-colors hover:border-primary/40"
                        :class="inSection(docs.url) && 'border-primary/60'"
                        prefetch-on="interaction">
                        <p class="font-sans text-xs font-semibold uppercase tracking-wider text-primary">{{docs.label}}</p>
                        <p v-if="docs.addText" class="font-sans text-xs text-default">{{docs.addText}}</p>
                    </NuxtLink>
                    <ul v-if="docs.sections?.length" class="-mt-1 ml-4 flex flex-col border-l border-rule">
                        <li v-for="section in docs.sections" :key="section.url">
                            <NuxtLink
                                :to="section.url"
                                class="flex min-h-11 items-center gap-2.5 px-4 font-sans text-sm text-default transition-colors hover:text-secondary"
                                :class="inSection(section.url) && 'font-semibold text-primary'"
                                prefetch-on="interaction">
                                <UIcon v-if="section.icon" :name="`i-lucide-${section.icon}`" class="size-4 shrink-0 text-primary"/>
                                {{ section.label }}
                            </NuxtLink>
                        </li>
                    </ul>
                </nav>
            </div>
        </UContainer>
    </header>
</div>
</template>
