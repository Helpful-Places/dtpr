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
  <div class="break-after-page flex flex-col mb-8">
    <h2 :id="category.dtpr_id" class="text-3xl text-dtpr-green my-4 uppercase font-bold">
      {{ category.name }}
    </h2>
    <table class="grow">
      <tbody>
        <tr v-for="element in filteredElements" :key="element.id" class="hover:bg-gray-100 dark:hover:bg-gray-800">
          <td class="w-1/12 p-4">
            <NuxtImg :src="element.icon" width="48" height="48" />
          </td>
          <td class="w-2/12">{{element.name}}</td>
          <td v-html="$md.render(element.description)"></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="postcss">
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