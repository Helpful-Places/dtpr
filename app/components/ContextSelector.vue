<script setup>
defineProps({
  context: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
    <!-- Context name + description -->
    <div class="flex items-center gap-2 mb-3">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ context.name }}
      </span>
      <UTooltip :text="context.description">
        <UIcon name="i-heroicons-information-circle" class="w-4 h-4 text-gray-400" />
      </UTooltip>
    </div>

    <!-- Context value pills (display only) -->
    <div class="flex flex-wrap gap-2">
      <span
        v-for="value in context.values"
        :key="value.id"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300"
        :style="{ backgroundColor: value.color + '20' }"
      >
        <span
          class="w-3 h-3 rounded-full flex-shrink-0"
          :style="{ backgroundColor: value.color }"
        />
        {{ value.name }}
      </span>
    </div>
  </div>
</template>
