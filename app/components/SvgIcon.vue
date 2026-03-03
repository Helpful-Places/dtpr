<script setup>
const props = defineProps({
  src: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: null
  },
  width: {
    type: Number,
    default: 64
  },
  height: {
    type: Number,
    default: 64
  }
})

const { data: rawSvg } = useFetch(props.src, { key: props.src, server: false })

const processedSvg = computed(() => {
  if (!rawSvg.value) return ''

  let svg = rawSvg.value

  // Replace width/height on root <svg> element
  svg = svg.replace(/<svg([^>]*)>/, (match, attrs) => {
    attrs = attrs.replace(/width="[^"]*"/, `width="${props.width}"`)
    attrs = attrs.replace(/height="[^"]*"/, `height="${props.height}"`)
    // Add width/height if not present
    if (!attrs.includes('width=')) attrs += ` width="${props.width}"`
    if (!attrs.includes('height=')) attrs += ` height="${props.height}"`
    return `<svg${attrs}>`
  })

  // Apply color replacement when a color is set
  if (props.color) {
    svg = svg.replace(/fill="black"/g, `fill="${props.color}"`)
    svg = svg.replace(/fill="#000000"/g, `fill="${props.color}"`)
    svg = svg.replace(/fill="#000"/g, `fill="${props.color}"`)
    svg = svg.replace(/stroke="black"/g, `stroke="${props.color}"`)
    svg = svg.replace(/stroke="#000000"/g, `stroke="${props.color}"`)
    svg = svg.replace(/stroke="#000"/g, `stroke="${props.color}"`)
  }

  return svg
})
</script>

<template>
  <div
    v-if="processedSvg"
    class="svg-icon inline-flex"
    v-html="processedSvg"
  />
</template>
