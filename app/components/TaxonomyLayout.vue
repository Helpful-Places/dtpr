<script setup>
const props = defineProps({
  categories: {
    type: Array,
    required: true
  },
  elements: {
    type: Array,
    required: true
  },
  categoryOrder: {
    type: Array,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
})

// Search functionality
const searchQuery = ref('')
const activeCategory = ref(null)

// Sidebar navigation state
const isSidebarOpen = ref(true)

// Count elements per category
const getElementCount = (categoryId) => {
  let elements = props.elements.filter(element => 
    element.category && element.category.includes(categoryId)
  )

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    elements = elements.filter(element => {
      return element.name.toLowerCase().includes(query) ||
             element.description.toLowerCase().includes(query)
    })
  }

  return elements.length
}

// Check if there are any search results
const hasSearchResults = computed(() => {
  if (!searchQuery.value) return true
  
  const query = searchQuery.value.toLowerCase()
  return props.elements.some(element => {
    return element.name.toLowerCase().includes(query) ||
           element.description.toLowerCase().includes(query)
  })
})

// Navigation items for sidebar
const navigationItems = computed(() => {
  return props.categoryOrder.map(categoryId => {
    const category = props.categories.find(c => c.dtpr_id === categoryId)
    return {
      label: category?.name || categoryId,
      badge: getElementCount(categoryId),
      active: activeCategory.value === categoryId,
      click: () => scrollToCategory(categoryId)
    }
  })
})

// Handle category navigation
const scrollToCategory = (categoryId) => {
  activeCategory.value = categoryId
  const element = document.getElementById(`category-${categoryId}`)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Track active category on scroll
const handleScroll = () => {
  const categoryElements = props.categoryOrder
    .map(id => ({
      id,
      element: document.getElementById(`category-${id}`)
    }))
    .filter(item => item.element)

  const scrollPosition = window.scrollY + 100

  for (let i = categoryElements.length - 1; i >= 0; i--) {
    const { id, element } = categoryElements[i]
    if (element.offsetTop <= scrollPosition) {
      activeCategory.value = id
      break
    }
  }
}

// Clear search
const clearSearch = () => {
  searchQuery.value = ''
}

// Copy link functionality
const handleElementClick = (element) => {
  const url = `${window.location.origin}${window.location.pathname}#element-${element.dtpr_id}`
  navigator.clipboard.writeText(url)
  
  // Show toast notification
  const toast = useToast()
  toast.add({
    title: 'Link copied!',
    description: `Link to ${element.name} copied to clipboard`,
    icon: 'i-heroicons-check-circle',
    timeout: 3000
  })
}

// Copy category link functionality
const handleCategoryClick = (category) => {
  const url = `${window.location.origin}${window.location.pathname}#category-${category.dtpr_id}`
  navigator.clipboard.writeText(url)
  
  // Show toast notification
  const toast = useToast()
  toast.add({
    title: 'Link copied!',
    description: `Link to ${category.name} category copied to clipboard`,
    icon: 'i-heroicons-check-circle',
    timeout: 3000
  })
}

// Setup scroll listener
// Smooth scroll CSS
const smoothScrollStyle = {
  scrollBehavior: 'smooth'
}

onMounted(() => {
  // Enable smooth scrolling
  document.documentElement.style.scrollBehavior = 'smooth'
  
  window.addEventListener('scroll', handleScroll)
  handleScroll() // Set initial active category
  
  // Handle direct navigation from URL hash
  if (window.location.hash) {
    const hash = window.location.hash.substring(1)
    const element = document.getElementById(hash)
    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header with Search -->
    <div class="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ title }}
          </h1>
          
          <!-- Search Bar -->
          <div class="flex-1 max-w-md mx-4 sm:mx-8">
            <UInput
              v-model="searchQuery"
              placeholder="Search elements..."
              icon="i-heroicons-magnifying-glass"
              size="md"
              :ui="{ icon: { trailing: { pointer: '' } } }"
            >
              <template #trailing>
                <UButton
                  v-show="searchQuery"
                  color="gray"
                  variant="link"
                  icon="i-heroicons-x-mark-20-solid"
                  :padded="false"
                  @click="clearSearch"
                />
              </template>
            </UInput>
          </div>

          <div class="flex items-center gap-4">
            <!-- Locale Switcher -->
            <LocaleSwitcher />
            
            <!-- Mobile Sidebar Toggle -->
            <UButton
              class="lg:hidden"
              color="gray"
              variant="ghost"
              icon="i-heroicons-bars-3"
              @click="isSidebarOpen = !isSidebarOpen"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
      <!-- Description -->
      <div v-if="description" class="mb-6">
        <p class="text-gray-600 dark:text-gray-400">
          {{ description }}
        </p>
      </div>
      
      <div class="flex flex-col lg:flex-row gap-0 lg:gap-8">
        <!-- Mobile Overlay -->
        <div 
          v-if="isSidebarOpen"
          class="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          @click="isSidebarOpen = false"
        />
        
        <!-- Sidebar Navigation -->
        <aside 
          :class="[
            'w-full lg:w-64 flex-shrink-0',
            isSidebarOpen ? 'block' : 'hidden lg:block',
            'fixed lg:relative inset-y-0 left-0 z-30 lg:z-0',
            'bg-white dark:bg-gray-800 lg:bg-transparent',
            'border-r dark:border-gray-700 lg:border-0',
            'transform transition-transform duration-300 ease-in-out',
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          ]"
        >
          <div class="sticky top-24 p-4 lg:p-0">
            <!-- Mobile Close Button -->
            <div class="flex items-center justify-between lg:hidden mb-4">
              <h3 class="text-lg font-semibold">Navigation</h3>
              <UButton
                color="gray"
                variant="ghost"
                icon="i-heroicons-x-mark"
                @click="isSidebarOpen = false"
              />
            </div>
            
            <nav class="space-y-1">
              <h3 class="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Datachain Categories
              </h3>
              
              <UVerticalNavigation :links="navigationItems" />
            </nav>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 min-w-0">
          <ElementSection
            v-for="categoryId in categoryOrder"
            :key="categoryId"
            :category="categories.find(c => c.dtpr_id === categoryId)"
            :elements="elements"
            :search-query="searchQuery"
            @element-clicked="handleElementClick"
            @category-clicked="handleCategoryClick"
          />

          <!-- No Results -->
          <div v-if="searchQuery && !hasSearchResults" class="text-center py-16">
            <UIcon name="i-heroicons-magnifying-glass" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No results found
            </h3>
            <p class="text-gray-500 dark:text-gray-400">
              Try adjusting your search terms
            </p>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>