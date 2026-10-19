<script setup lang="ts">
    import SectionHeader from './sectionHeader.vue';

    const props = defineProps<{
        heading: string,
        subHeading?: string,
        body?: string,
        buttonText?: string,
        image?: string,
        imageAlt?: string
    }>()

    const email = ref('')
    const status = ref<'idle' | 'submitting' | 'success' | 'invalid' | 'error'>('idle')
    const sentTo = ref('')

    // The list sends a confirmation email, so success asks the reader to
    // confirm rather than saying they are already subscribed. A 400 means the
    // address was refused; anything else means the list did not answer.
    async function subscribe() {
        status.value = 'submitting'
        try {
            await $fetch('/api/subscribe', { method: 'POST', body: { email: email.value } })
            sentTo.value = email.value.trim()
            status.value = 'success'
        }
        catch (error: any) {
            status.value = error?.statusCode === 400 ? 'invalid' : 'error'
        }
    }
</script>

<template>
    <UContainer as="section" class="section-pad">
        <SectionHeader :heading="props.heading" :sub-heading="props.subHeading"/>

        <!-- Same three columns as a Ways In set, so the form lines up with
             the two cards below it and the image with the third. -->
        <div class="mt-6 grid gap-6" :class="props.image && 'md:grid-cols-3'">
            <form class="flex flex-col justify-center rounded-md bg-white p-5 shadow-sm ring ring-rule sm:p-6" :class="props.image && 'md:col-span-2'" @submit.prevent="subscribe">
                <p v-if="props.body" class="mb-5 max-w-xl text-pretty whitespace-pre-line text-muted">{{ props.body }}</p>
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
                        :disabled="status === 'submitting'"
                        @update:model-value="status !== 'submitting' && (status = 'idle')"
                    />
                    <UButton
                        type="submit"
                        size="xl"
                        class="min-h-11 shrink-0 justify-center"
                        :loading="status === 'submitting'"
                        :disabled="status === 'success'"
                        :label="status === 'success' ? 'Email sent' : (props.buttonText ?? 'Subscribe')"
                    />
                </div>
                <p class="mt-3 max-w-xl text-sm text-pretty" :class="status === 'error' || status === 'invalid' ? 'text-error' : status === 'success' ? 'font-semibold' : 'text-muted'" role="status">
                    <template v-if="status === 'success'">Almost done. Open the email we sent to {{ sentTo }} and confirm your subscription.</template>
                    <template v-else-if="status === 'invalid'">That email address was not accepted. Check it for typos and try again.</template>
                    <template v-else-if="status === 'error'">
                        The newsletter service did not respond, so you are not subscribed yet. Try again in a moment, or email
                        <a href="mailto:hello@dtpr.io" class="font-semibold underline underline-offset-2">hello@dtpr.io</a>
                        and we will add you.
                    </template>
                    <template v-else>We will email you a link to confirm. We only use your address to send the newsletter, and every issue has a link to unsubscribe.</template>
                </p>
            </form>

            <!-- From md up the form sets the row's height and the photo crops to it. -->
            <div v-if="props.image" class="relative">
                <img
                    :src="props.image"
                    :alt="props.imageAlt ?? ''"
                    class="aspect-[3/2] w-full max-w-sm rounded-md bg-white object-cover shadow-sm ring ring-rule md:absolute md:inset-0 md:aspect-auto md:h-full md:max-w-none"
                    loading="lazy"
                />
            </div>
        </div>
    </UContainer>
</template>
