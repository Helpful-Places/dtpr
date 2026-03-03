<script setup>
const props = defineProps({
  context: {
    type: Object,
    required: true
  },
  modelValue: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const select = (valueId) => {
  emit('update:modelValue', props.modelValue === valueId ? null : valueId)
}
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

    <!-- Pill bar -->
    <div class="flex flex-wrap gap-2">
      <!-- "All" pill -->
      <button
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
        :class="modelValue === null
          ? 'bg-gray-600 text-white ring-2 ring-gray-600 ring-offset-1 dark:ring-offset-gray-800'
          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
        @click="emit('update:modelValue', null)"
      >
        All
      </button>

      <!-- Context value pills -->
      <button
        v-for="value in context.values"
        :key="value.id"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
        :class="modelValue === value.id
          ? 'ring-2 ring-offset-1 dark:ring-offset-gray-800 text-gray-900 dark:text-white'
          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
        :style="modelValue === value.id
          ? { backgroundColor: value.color + '30', ringColor: value.color, '--tw-ring-color': value.color }
          : {}"
        @click="select(value.id)"
      >
        <span
          class="w-3 h-3 rounded-full flex-shrink-0"
          :style="{ backgroundColor: value.color }"
        />
        {{ value.name }}
      </button>
    </div>
  </div>
</template>
