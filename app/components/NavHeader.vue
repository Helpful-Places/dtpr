<template>
  <div class="my-4 dtpr-container">
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <img src="/images/DTPR_Logo_Blue.svg" />
        <div class="ml-4 font-[500] text-dtpr-blue"><NuxtLink to="/">DTPR</NuxtLink></div>
      </div>
      <ul>
        <li><NuxtLink to="/taxonomy">Resources</NuxtLink></li>
        <li><NuxtLink to="/taxonomy">Deployments</NuxtLink></li>
        <li><NuxtLink to="/taxonomy">Sponsors</NuxtLink></li>
        <li><NuxtLink to="/taxonomy">License & Contributors</NuxtLink></li>
        <li><NuxtLink to="/taxonomy">Taxonomy</NuxtLink></li>
        <li><NuxtLink to="/taxonomy">Get Involved</NuxtLink></li>
      </ul>
    </div>
  </div>
</template>

<style lang="postcss">
ul {
  @apply flex;
}
</style>