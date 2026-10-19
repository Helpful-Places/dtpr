<template>
    <!-- Every docs page opens with this note while the docs are still being written. -->
    <UContainer class="pt-6">
        <div role="note" class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md bg-warning-50 px-4 py-3 font-sans text-sm text-highlighted ring ring-warning-200">
            <UBadge label="Beta" color="warning" variant="solid" size="sm" class="uppercase tracking-wide" />
            <p>
                These docs are in progress. Some pages are incomplete or may change.
                <NuxtLink
                    to="mailto:hello@dtpr.io?subject=Docs%20problem"
                    external
                    class="font-semibold text-primary underline underline-offset-2 hover:no-underline"
                >Report a problem</NuxtLink>
            </p>
        </div>
    </UContainer>
</template>
