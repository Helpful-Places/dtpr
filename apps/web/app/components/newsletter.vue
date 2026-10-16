<script setup lang="ts">
    import SectionHeader from './sectionHeader.vue';

    const props = defineProps<{
        heading: string,
        subHeading?: string,
        buttonText?: string,
        image?: string,
        imageAlt?: string
    }>()

    const email = ref('')
    const attempted = ref(false)

    // No mailing list is connected yet, so nothing is sent or stored. The
    // form says so rather than confirming a subscription that did not happen.
    function subscribe() {
        attempted.value = true
    }
</script>

<template>
    <UContainer as="section" class="section-pad">
        <SectionHeader :heading="props.heading" :sub-heading="props.subHeading"/>

        <div class="mt-6 grid gap-6" :class="props.image ? 'lg:grid-cols-[minmax(0,1fr)_22rem]' : ''">
            <form class="flex flex-col justify-center rounded-md bg-white p-5 shadow-sm ring ring-rule sm:p-6" @submit.prevent="subscribe">
                <label for="newsletter-email" class="block text-sm font-semibold">Email address</label>
                <div class="mt-2 flex max-w-xl flex-col gap-3 sm:flex-row">
                    <UInput
                        id="newsletter-email"
                        v-model="email"
                        type="email"
                        name="email"
                        autocomplete="email"
                        placeholder="you@example.org"
                        required
                        size="xl"
                        class="min-w-0 flex-1"
                        :ui="{ base: 'min-h-11 bg-white ring-rule' }"
                        @update:model-value="attempted = false"
                    />
                    <UButton type="submit" size="xl" class="min-h-11 shrink-0 justify-center" :label="props.buttonText ?? 'Subscribe'"/>
                </div>
                <p class="mt-3 text-sm text-pretty" :class="attempted ? 'text-warning' : 'text-muted'" role="status">
                    <template v-if="attempted">
                        Sign-up is not open yet, so your address was not saved. Write to
                        <a href="mailto:hello@dtpr.io" class="font-semibold underline underline-offset-2">hello@dtpr.io</a>
                        and we will add you when it is.
                    </template>
                    <template v-else>We only use your address to send the newsletter.</template>
                </p>
            </form>

            <img
                v-if="props.image"
                :src="props.image"
                :alt="props.imageAlt ?? ''"
                class="aspect-[3/2] w-full max-w-sm rounded-md bg-white object-cover shadow-sm ring ring-rule lg:max-w-none"
                loading="lazy"
            />
        </div>
    </UContainer>
</template>
