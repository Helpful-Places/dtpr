<script setup>
const props = defineProps({
  action: {
    type: String,
    required: true,
  },
  tags: {
    type: String,
    default: '',
  },
});

const email = ref('');
const status = ref('idle'); // idle | submitting | success | error

async function subscribe() {
  if (!email.value) return;

  status.value = 'submitting';

  try {
    await $fetch('/api/subscribe', {
      method: 'POST',
      body: {
        email: email.value,
        action: props.action,
        tags: props.tags || undefined,
      },
    });

    status.value = 'success';
  } catch (e) {
    status.value = 'error';
  }
}
</script>

<template>
  <div class="lg:flex lg:items-center">
    <div class="lg:w-0 lg:flex-1">
      <h2 class="font-bold tracking-tight text-dtpr-red-950 text-4xl">Want DTPR news and updates?</h2>
      <p class="mt-3 max-w-3xl text-lg leading-6 text-dtpr-red-950">Sign up for our newsletter to stay up to date.</p>
    </div>
    <div class="lg:w-full lg:max-w-md mt-4 lg:mt-0">
      <form
        v-if="status !== 'success'"
        class="mt-2 sm:mt-0 sm:flex"
        @submit.prevent="subscribe"
      >
        <input
          v-model="email"
          type="email"
          required
          placeholder="Your email address"
          :disabled="status === 'submitting'"
          class="w-full rounded-md px-5 py-3 placeholder-gray-500 border-transparent focus:border-transparent focus:outline-none focus:ring-2 focus:ring-dtpr-red focus:ring-offset-2 focus:ring-offset-dtpr-red disabled:opacity-60"
        />
        <button
          type="submit"
          :disabled="status === 'submitting'"
          class="cursor-pointer mt-3 flex w-full items-center justify-center rounded-md border border-transparent bg-dtpr-red px-5 py-3 text-base font-medium text-white shadow focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-dtpr-red sm:mt-0 sm:ml-3 sm:w-auto sm:flex-shrink-0 disabled:opacity-60"
        >
          {{ status === 'submitting' ? 'Subscribing…' : 'Subscribe' }}
        </button>
      </form>

      <p
        v-if="status === 'success'"
        class="mt-2 font-medium text-dtpr-red-950"
      >
        Success! Please check your inbox to confirm your subscription.
      </p>
      <p
        v-if="status === 'error'"
        class="mt-2 text-sm text-dtpr-red-950"
      >
        Something went wrong. Please try again.
      </p>
    </div>
  </div>
</template>
