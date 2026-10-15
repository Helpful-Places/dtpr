<script setup lang="ts">
    const {data:nav}= await useNav();

    const columns = computed(() => [
        {
            heading: 'Explore',
            links: (nav.value?.links ?? []).map(link => ({ label: link.label, to: link.url }))
        },
        {
            heading: 'Build',
            links: [
                { label: 'Deployer docs', to: '/docs/deployers' },
                { label: 'Developer docs', to: '/docs/developers' },
                { label: 'Concepts', to: '/docs/concepts' },
                { label: 'REST API', to: '/docs/developers/rest-api/overview' },
                { label: 'MCP server', to: '/docs/developers/mcp-server' },
                { label: 'GitHub', to: 'https://github.com/Helpful-Places/dtpr', external: true }
            ]
        },
        {
            heading: 'Community',
            links: [
                { label: 'Slack', to: 'https://join.slack.com/t/dtprworkspace/shared_invite/zt-48k9n9apd-j0ucFCsJcKPnpkUZKR~SsQ', external: true },
                { label: 'hello@dtpr.io', to: 'mailto:hello@dtpr.io' },
                { label: 'Helpful Places', to: 'https://www.helpfulplaces.com', external: true },
                { label: 'Privacy Policy', to: '/privacy' }
            ]
        }
    ])
</script>

<template>
    <footer data-dot-rule class="print:hidden mt-[calc(5rem+var(--dot-snap,0px))] border-t-2 border-primary bg-midnight text-white">
        <UContainer class="py-14">
            <div class="grid grid-cols-1 gap-10 border-b border-white/10 pb-10 md:grid-cols-12">
                <div class="max-w-sm md:col-span-5">
                    <img src="/images/dtpr_logo_white.png" alt="DTPR" width="64" height="24" class="mb-4 h-6 w-auto"/>
                    <p class="text-sm leading-relaxed text-white/70">
                        Digital Trust for Places and Routines is an open standard that explains how technology uses data, in plain language and icons anyone can understand.
                    </p>
                </div>

                <div class="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 md:col-span-7">
                    <nav v-for="column in columns" :key="column.heading" :aria-label="column.heading">
                        <h2 class="mb-4 font-sans text-xs font-semibold uppercase tracking-wider text-secondary-300">{{ column.heading }}</h2>
                        <ul class="space-y-1">
                            <li v-for="link in column.links" :key="link.to">
                                <NuxtLink
                                    :to="link.to"
                                    :target="link.external ? '_blank' : undefined"
                                    class="inline-flex min-h-8 items-center text-white/70 transition-colors hover:text-white"
                                >
                                    {{ link.label }}
                                    <svg v-if="link.external" class="ml-1.5 size-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                        <path d="M3.5 8.5l5-5M4.5 3.5h4v4"/>
                                    </svg>
                                </NuxtLink>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            <div class="flex flex-col gap-5 pt-6 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
                <p class="flex flex-wrap items-center gap-x-4 gap-y-3">
                    DTPR is stewarded by
                    <NuxtLink to="https://www.helpfulplaces.com" target="_blank" class="inline-flex rounded-sm transition-opacity hover:opacity-80">
                        <!-- The mark is black with white lettering; inverted, it reads on midnight. -->
                        <img v-if="nav" :src="nav.hpLogo" alt="Helpful Places" width="154" height="40" class="h-10 w-auto invert"/>
                    </NuxtLink>
                </p>
                <p>
                    Licensed under
                    <NuxtLink to="https://creativecommons.org/licenses/by/4.0/" target="_blank" class="underline underline-offset-2 hover:text-white">CC BY 4.0</NuxtLink>.
                </p>
            </div>
        </UContainer>
    </footer>
</template>
