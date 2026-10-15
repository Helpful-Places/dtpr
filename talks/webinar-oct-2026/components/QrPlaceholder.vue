<script setup lang="ts">
// Decorative QR-shaped placeholder for the disclosure mocks: a hardcoded
// 21×21 module grid with real finder/timing patterns but meaningless data
// modules. Deliberately NOT scannable — these artifacts are speculative,
// so the QR must read as "there is a full record behind this" without
// pointing a phone anywhere real.
interface Props {
  size?: number
  label?: string
}

withDefaults(defineProps<Props>(), { size: 64, label: '' })

const MODULES = [
  '111111101011001111111',
  '100000100100101000001',
  '101110101101001011101',
  '101110100011101011101',
  '101110101010101011101',
  '100000100111001000001',
  '111111101010101111111',
  '000000001101100000000',
  '110101110110010110110',
  '011010001011101101001',
  '101011110101010101101',
  '010100101110101011010',
  '111010110011011100101',
  '000000001001101010110',
  '111111100110100110101',
  '100000101011001101011',
  '101110100101100111100',
  '101110101110001010011',
  '101110100010101101110',
  '100000101101000110101',
  '111111100111101011011',
]

const GRID = MODULES.map((row) => row.split(''))
</script>

<template>
  <figure class="qr">
    <svg
      :width="size"
      :height="size"
      viewBox="0 0 21 21"
      shape-rendering="crispEdges"
      role="presentation"
      aria-hidden="true"
    >
      <rect width="21" height="21" fill="#fff" />
      <template v-for="(row, y) in GRID" :key="y">
        <template v-for="(cell, x) in row" :key="x">
          <rect v-if="cell === '1'" :x="x" :y="y" width="1" height="1" fill="#000" />
        </template>
      </template>
    </svg>
    <figcaption v-if="label" class="qr__label">{{ label }}</figcaption>
  </figure>
</template>

<style scoped>
.qr {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
}
.qr svg {
  display: block;
  border: 1px solid rgba(0, 0, 0, 0.12);
}
.qr__label {
  font-size: 0.55rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #72726c;
}
</style>
