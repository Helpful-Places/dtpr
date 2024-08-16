<script setup>
const props = defineProps({
  elementCategory: String,
})

const { locale } = useI18n();

const category = await queryContent('dtpr/categories').where({
  _locale: locale.value,
  id: props.elementCategory
}).findOne()

const elements = await queryContent('dtpr/elements').where({
  _locale: locale.value,
  category: category.id
}).find()
</script>

<template>
  <div class="break-after-page flex flex-col">
    <div class="border-b-2 border-dtpr-green mb-2 mt-16">
      <h3 id="data-type">{{ category.name }}</h3>
    </div>
    <table class="grow">
      <thead>
        <tr class="text-left">
          <th class="w-1/12">{{ $t('icon') }}</th>
          <th class="w-1/6">{{category.name}}</th>
          <th class="">{{ $t('description') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="element in elements" :key="element.id">
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