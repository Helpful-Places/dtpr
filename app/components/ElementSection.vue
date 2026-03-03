<script setup>
const props = defineProps({
  category: {
    type: Object,
    required: true
  },
  elements: {
    type: Array,
    required: true
  },
  searchQuery: {
    type: String,
    default: ''
  }
})

// Context selector state
const selectedContextValue = ref(null)

// Look up a context value by its id
const getContextValue = (valueId) => {
  if (!props.category.context?.values) return null
  return props.category.context.values.find(v => v.id === valueId) || null
}

// Returns the context color when matching the selected value, otherwise null
const getIconColor = (element) => {
  if (!selectedContextValue.value || !element.context_type_id) return null
  if (element.context_type_id !== selectedContextValue.value) return null
  const cv = getContextValue(element.context_type_id)
  return cv?.color || null
}

// Filter elements that belong to this category
const filteredElements = computed(() => {
  let elements = props.elements.filter(element => {
    return element.category && element.category.includes(props.category.dtpr_id)
  })

  // Apply search filter if search query exists
  if (props.searchQuery) {
    const query = props.searchQuery.toLowerCase()
    elements = elements.filter(element => {
      return element.name.toLowerCase().includes(query) ||
             element.description.toLowerCase().includes(query)
    })
  }

  return elements
})

// Generate anchor ID for category
const categoryAnchorId = computed(() => `category-${props.category.dtpr_id}`)

// Generate anchor ID for element
const getElementAnchorId = (element) => `element-${element.dtpr_id}`
</script>

<template>
  <div v-if="filteredElements.length > 0 || !searchQuery" :id="categoryAnchorId" class="mb-12 scroll-mt-24">
    <!-- Category Header -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <h2 class="text-2xl font-bold text-dtpr-green uppercase">
          {{ category.name }}
        </h2>
        <UButton
          size="sm"
          color="gray"
          variant="ghost"
          icon="i-heroicons-link"
          @click="$emit('category-clicked', category)"
        >
          Copy Link
        </UButton>
      </div>
      <UBadge v-if="filteredElements.length > 0" color="gray" variant="subtle">
        {{ filteredElements.length }} {{ filteredElements.length === 1 ? 'element' : 'elements' }}
      </UBadge>
    </div>

    <!-- Context Selector -->
    <ContextSelector
      v-if="category.context?.values?.length"
      :context="category.context"
      v-model="selectedContextValue"
    />

    <!-- Elements Grid -->
    <div v-if="filteredElements.length > 0" class="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
      <UCard 
        v-for="element in filteredElements" 
        :key="element.id"
        :id="getElementAnchorId(element)"
        class="hover:shadow-lg transition-shadow duration-200 scroll-mt-24"
      >
        <div class="flex flex-col space-y-4">
          <!-- Element Header -->
          <div class="flex items-start items-center space-x-4">
            <div class="flex-shrink-0">
              <SvgIcon
                :src="element.icon"
                :color="getIconColor(element)"
                :width="64"
                :height="64"
                class="rounded-lg"
              />
            </div>
            <div class="flex flex-col gap-1">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ element.name }}
              </h3>
              <span
                v-if="element.context_type_id && getContextValue(element.context_type_id)"
                class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit"
                :style="{
                  backgroundColor: getContextValue(element.context_type_id).color + '20',
                  color: getContextValue(element.context_type_id).color
                }"
              >
                <span
                  class="w-2 h-2 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: getContextValue(element.context_type_id).color }"
                />
                {{ getContextValue(element.context_type_id).name }}
              </span>
            </div>
          </div>

          <!-- Element Description -->
          <div class="prose prose-sm dark:prose-invert max-w-none">
            <div v-html="$md.render(element.description)"></div>
          </div>

          <!-- Element Actions -->
          <div class="flex items-center justify-end pt-2 border-t dark:border-gray-700">
            <UButton
              size="xs"
              color="gray"
              variant="ghost"
              icon="i-heroicons-link"
              :to="`#${getElementAnchorId(element)}`"
              @click="$emit('element-clicked', element)"
            >
              Copy Link
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty State -->
    <div v-else-if="searchQuery" class="text-center py-8">
      <UIcon name="i-heroicons-magnifying-glass" class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p class="text-gray-500 dark:text-gray-400">
        No elements found matching "{{ searchQuery }}" in {{ category.name }}
      </p>
    </div>
  </div>
</template>