<template>
  <div>
    <IntroHeader />

    <div class="app-container mt-12">
      <div class="flex gap-8">
        <div class="card w-[60%] bg-dtpr-blue text-dtpr-blue-lighter">
          <h2>The Problem</h2>
          <div class="text-[3rem] font-[700] leading-tight">Technology can help make our roads safer for people, our buildings greener, and our homes healthier. But is it living up to its promises?</div>
        </div>

        <div class="card w-[40%] bg-dtpr-blue-lighter text-dtpr-blue">
          <div class="text-lg font-bold">
            How can we be confident the technology is achieving its goal? Whether seeking safety, sustainability, or accessibility, many are left asking: what are the benefits, the risks, and the trade-offs we're making?
          </div>
          <div>
            Digital technology is all around us, but often invisible. There's little transparency about what data these technologies are collecting, by whom, and for what purposes. We've also seen that much technology in the built environment lacks controls for people.<br /><br />
            We've drafted a standard that enables transparency, accountability, and control for people.
          </div>
        </div>
      </div>

      <div class="flex gap-8 mt-8">
        <div class="card bg-bostom-deployment w-[40%] ">

        </div>
        
        <div class="card w-[60%] bg-dtpr-green text-dtpr-green-lighter">
          <h2>Our Solution</h2>
          <div class="text-[3rem] font-[700] leading-tight">The DTPR Taxonomy, Design Patterns and Prototypes</div>
          <div class="">Technology can help make our roads safer for people, our buildings greener, and our homes healthier. But is it living up to its promises?</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.card {
  @apply p-8 rounded-2xl;
}

h2 {
  @apply text-xl font-bold mb-4;
}

.bg-boston-deployment {
  background-image: url('~/images/boston-deployment.png');
}
</style>