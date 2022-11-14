<template>
  <div class="lg:flex lg:items-center">
    <div class="lg:w-0 lg:flex-1">
      <h2 class="font-bold tracking-tight text-dtpr-red text-4xl">Want DTPR news and updates?</h2>
      <p class="mt-3 max-w-3xl text-lg leading-6 text-dtpr-red">Sign up for our newsletter to stay up to date.</p>
    </div>
    <div class="lg:w-full lg:max-w-md mt-4 lg:mt-0">
      <form
        data-sendstack-form
        action="https://getsendstack.com/forms/5eb89581-2e83-461a-ab1e-a9175305671b/subscribers"
        method="post"
        class="mt-2 sm:mt-0"
      >
        <span data-element="success" class="hidden mb-2 text-dtpr-red">
            Success! Please verify your email address to confirm your subscription.
        </span>

        <ul data-element="errors" class="hidden mb-2 text-dtpr-red"></ul>

        <fieldset class="sm:flex">
          <input 
            class="w-full rounded-md px-5 py-3 placeholder-gray-500 border-transparent focus:border-transparent focus:outline-none focus:ring-2 focus:ring-dtpr-red focus:ring-offset-2 focus:ring-offset-dtpr-red"
            type="email"
            name="email"
            placeholder="Your email address"
            required
          />
          <input type="hidden" name="tags" value="dtpr.io" />
          <input
            class="cursor-pointer mt-3 flex w-full items-center justify-center rounded-md border border-transparent bg-dtpr-red px-5 py-3 text-base font-medium text-white shadow focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-dtpr-red sm:mt-0 sm:ml-3 sm:w-auto sm:flex-shrink-0"
            type="submit"
            value="Subscribe"
          >
        </fieldset>
      </form>

      <p class="mt-3 text-sm text-dtpr-red">
        We use the privacy-first service <a class="u-line border-dtpr-red" href="https://getsendstack.com/privacy">SendStack</a> for our newsletter.
      </p>
    </div>
  </div>
</template>

<script setup>
useHead({
  script: [
    { src: "https://getsendstack.com/js/form.js" }
  ]
});
</script>