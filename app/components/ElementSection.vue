<script setup>
const props = defineProps({
  category: {
    type: Object,
    required: true
  },
  elements: {
    type: Array,
    required: true
  }
})

// Filter elements that belong to this category
const filteredElements = computed(() => {
  return props.elements.filter(element => {
    return element.category && element.category.includes(props.category.dtpr_id)
  })
})
</script>

<template>
  <div class="break-after-page flex flex-col">
    <div class="border-b-2 border-dtpr-green mb-2 mt-16">
      <h3 :id="category.dtpr_id">{{ category.name }}</h3>
    </div>
    <table class="grow">
      <thead>
        <tr class="text-left">
          <th class="w-1/12">Icon</th>
          <th class="w-1/6">{{category.name}}</th>
          <th class="">Description</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="element in filteredElements" :key="element.id">
          <td>
            <NuxtImg :src="element.icon" width="36" height="36" />
          </td>
          <td>{{element.name}}</td>
          <td v-html="$md.render(element.description)"></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="postcss">
h3 {
  @apply text-xl text-dtpr-green my-2 font-bold;
}

thead {
  tr {
    @apply border-b-2;
  }
}

tbody {
  tr:not(:last-child) {
    @apply border-b;
  }
}

table {
  a {
    @apply border-b-2 transition ease-in-out;
  
    &:hover {
      @apply border-b-4;
    }
  }
}


td, th {
  @apply px-1 py-2;
}
</style>