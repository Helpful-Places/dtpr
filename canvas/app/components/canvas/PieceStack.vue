<script setup lang="ts">
import type { AStack } from '~/canvas-data/grammar'

// The A (compact stack) density: icon + a three-tier stack —
//   line 1: the headline (the leading value)
//   line 2: an optional bold label (type / role) and/or a classification mark
//   line 3: muted, `·`-joined facts
// The icon is provided by the parent via the `icon` slot so data/org
// (composed API icons) and people (in-page hexagon) share this layout.
const props = defineProps<{ stack: AStack }>()
</script>

<template>
  <div class="pc-a">
    <div class="pc-ic"><slot name="icon" /></div>
    <div class="astack">
      <div class="a-l1">{{ props.stack.headline }}</div>
      <div v-if="props.stack.label || props.stack.mark" class="a-l2">
        <span v-if="props.stack.label" class="a-type">{{ props.stack.label }}</span>
        <span v-if="props.stack.label && props.stack.mark" class="sep">·</span>
        <Marker v-if="props.stack.mark" :mark="props.stack.mark" />
      </div>
      <div v-if="props.stack.facts.length" class="a-l3">
        <template v-for="(f, i) in props.stack.facts" :key="i">
          <span v-if="i > 0" class="sep">·</span>{{ f }}
        </template>
      </div>
    </div>
  </div>
</template>
