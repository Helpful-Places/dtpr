<script setup lang="ts">
    // A city block drawn as four stacked sheets of an architect's exploded
    // plan. The sheets start part-way open, so each one reads at rest, and
    // spread apart as the page scrolls, ending with the digital layer clear of the physical ones.
    const props = defineProps<{
        label?: string
    }>()

    // Ids are scoped so the filters and hatches survive a second instance.
    const uid = useId()

    const scene = ref<HTMLElement | null>(null)
    const progress = ref(0)
    let start = 0

    function measure() {
        if (!scene.value) return
        const top = scene.value.getBoundingClientRect().top + window.scrollY
        start = Math.max(0, top - window.innerHeight * 0.6)
        update()
    }

    // Kept short so the stack is fully open while the hero is still on screen.
    function update() {
        const range = window.innerHeight * 0.22
        progress.value = Math.min(1, Math.max(0, (window.scrollY - start) / range))
    }

    onMounted(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            progress.value = 1
            return
        }
        measure()
        window.addEventListener('scroll', update, { passive: true })
        window.addEventListener('resize', measure)
    })

    onBeforeUnmount(() => {
        window.removeEventListener('scroll', update)
        window.removeEventListener('resize', measure)
    })
</script>

<template>
    <div
        ref="scene"
        class="city-layers"
        :style="{ '--p': progress }"
        role="img"
        :aria-label="props.label"
    >
        <!-- Pen wobble and hatching shared by every sheet -->
        <svg class="absolute size-0" aria-hidden="true">
            <defs>
                <filter :id="`${uid}-pen`" x="-10%" y="-10%" width="120%" height="120%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="1" seed="4" result="noise"/>
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G"/>
                </filter>
                <!-- A second, looser pass so lines read as gone over twice -->
                <filter :id="`${uid}-pencil`" x="-10%" y="-10%" width="120%" height="120%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="1" seed="11" result="noise"/>
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="G" yChannelSelector="R"/>
                </filter>
                <!-- The digital layer is the least physical, so its line is the calmest -->
                <filter :id="`${uid}-soft`" x="-10%" y="-10%" width="120%" height="120%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="1" seed="7" result="noise"/>
                    <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G"/>
                </filter>
                <pattern :id="`${uid}-hatch`" patternUnits="userSpaceOnUse" width="5" height="5">
                    <path d="M0 0V5" stroke="currentColor" stroke-width="1"/>
                </pattern>
                <pattern :id="`${uid}-hatch-dense`" patternUnits="userSpaceOnUse" width="2.6" height="2.6" patternTransform="rotate(90)">
                    <path d="M0 0V2.6" stroke="currentColor" stroke-width="1.5"/>
                </pattern>
                <path :id="`${uid}-frame`" d="M-9 0H209M-9 200H209M0 -9V209M200 -9V209"/>
            </defs>
        </svg>

        <!-- Drawn bottom sheet first so the digital layer paints on top -->
        <div class="layer" style="--i: 0">
            <div class="sheet text-primary-500">
                <svg viewBox="0 0 200 200" class="size-full overflow-visible fill-none stroke-current" stroke-linecap="round" stroke-linejoin="round">
                    <use :href="`#${uid}-frame`" class="frame" :filter="`url(#${uid}-pen)`"/>
                    <g :id="`${uid}-realm`" :filter="`url(#${uid}-pen)`" stroke-width="1.6">
                        <g :fill="`url(#${uid}-hatch)`">
                            <rect x="14" y="14" width="74" height="46" rx="8"/>
                            <rect x="14" y="74" width="46" height="112" rx="8"/>
                            <rect x="112" y="14" width="74" height="74" rx="8"/>
                            <path d="M149 115a34 34 0 1 0 0 68a34 34 0 1 0 0-68zM149 135a14 14 0 1 1 0 28a14 14 0 1 1 0-28z" fill-rule="evenodd"/>
                            <rect x="74" y="112" width="26" height="74" rx="8"/>
                        </g>
                        <!-- Trees, the way a planner dots them onto a plan -->
                        <g stroke-width="1.2">
                            <circle cx="30" cy="30" r="6"/>
                            <circle cx="52" cy="42" r="5"/>
                            <circle cx="72" cy="28" r="6"/>
                            <circle cx="36" cy="96" r="6"/>
                            <circle cx="30" cy="132" r="5"/>
                            <circle cx="42" cy="166" r="6"/>
                            <circle cx="132" cy="34" r="6"/>
                            <circle cx="164" cy="50" r="7"/>
                            <circle cx="136" cy="68" r="5"/>
                            <circle cx="87" cy="134" r="5"/>
                            <circle cx="87" cy="164" r="5"/>
                        </g>
                    </g>
                    <use :href="`#${uid}-realm`" class="second-pass" :filter="`url(#${uid}-pencil)`"/>
                </svg>
            </div>
            <p class="label text-primary">Public realm</p>
        </div>

        <div class="layer" style="--i: 1">
            <div class="sheet text-primary-700">
                <svg viewBox="0 0 200 200" class="size-full overflow-visible fill-none stroke-current" stroke-linecap="round" stroke-linejoin="round">
                    <use :href="`#${uid}-frame`" class="frame" :filter="`url(#${uid}-pen)`"/>
                    <g :id="`${uid}-transport`" :filter="`url(#${uid}-pen)`" stroke-width="1.6">
                        <!-- Main streets as kerb lines with a dashed centre line -->
                        <path d="M95 -4V204M105 -4V204M-4 95H204M-4 105H204"/>
                        <path d="M100 2V198M2 100H198" stroke-width="1" stroke-dasharray="7 6"/>
                        <path d="M2 41h64a15 15 0 0 1 15 15v34M2 47h64a9 9 0 0 1 9 9v34"/>
                        <path d="M198 147h-60a15 15 0 0 0-15 15v36M198 153h-60a9 9 0 0 0-9 9v36"/>
                        <!-- Transit lines and their stops -->
                        <path d="M40 112v86M160 2v86" stroke-width="1.2" stroke-dasharray="2 5"/>
                        <g class="fill-current">
                            <circle cx="100" cy="100" r="6"/>
                            <circle cx="40" cy="100" r="4"/>
                            <circle cx="100" cy="160" r="4"/>
                            <circle cx="160" cy="100" r="4"/>
                        </g>
                        <circle cx="100" cy="100" r="11" stroke-width="1"/>
                    </g>
                    <use :href="`#${uid}-transport`" class="second-pass" :filter="`url(#${uid}-pencil)`"/>
                </svg>
            </div>
            <p class="label text-primary">Transportation</p>
        </div>

        <div class="layer" style="--i: 2">
            <div class="sheet text-primary-800">
                <svg viewBox="0 0 200 200" class="size-full overflow-visible fill-none stroke-current" stroke-linecap="round" stroke-linejoin="round">
                    <use :href="`#${uid}-frame`" class="frame" :filter="`url(#${uid}-pen)`"/>
                    <g :id="`${uid}-buildings`" :filter="`url(#${uid}-pen)`" stroke-width="1.8" :fill="`url(#${uid}-hatch-dense)`">
                        <rect x="18" y="18" width="34" height="56"/>
                        <rect x="60" y="18" width="24" height="24"/>
                        <rect x="116" y="18" width="66" height="30"/>
                        <rect x="116" y="56" width="30" height="30"/>
                        <circle cx="170" cy="72" r="13"/>
                        <rect x="18" y="116" width="66" height="26"/>
                        <rect x="18" y="150" width="26" height="32"/>
                        <rect x="52" y="150" width="32" height="32"/>
                        <path d="M116 116h30v36h36v30h-66z"/>
                        <rect x="154" y="116" width="28" height="28"/>
                    </g>
                    <use :href="`#${uid}-buildings`" class="second-pass" fill="none" :filter="`url(#${uid}-pencil)`"/>
                </svg>
            </div>
            <p class="label text-primary">Buildings</p>
        </div>

        <div class="layer" style="--i: 3">
            <div class="sheet text-secondary-500">
                <svg viewBox="0 0 200 200" class="size-full overflow-visible fill-none stroke-current" stroke-linecap="round" stroke-linejoin="round">
                    <use :href="`#${uid}-frame`" class="frame" :filter="`url(#${uid}-pen)`"/>
                    <g :id="`${uid}-digital`" :filter="`url(#${uid}-soft)`" stroke-width="1.6">
                        <path d="M20 40l46-22 40 34 54-30 22 42-36 38 30 44-44 34-40-28-48 22-22-50 30-34z"/>
                        <path d="M66 18l-12 70 52-36 34 40 22-70M54 88l50 62 36-58 36 10M32 122l72 28 28 28M20 40l34 48M104 150l-50 22M140 92l-8 86"/>
                        <g class="fill-current">
                            <circle cx="54" cy="88" r="5"/>
                            <circle cx="106" cy="52" r="5"/>
                            <circle cx="140" cy="92" r="5"/>
                            <circle cx="104" cy="150" r="5"/>
                            <circle cx="160" cy="22" r="5"/>
                            <circle cx="32" cy="122" r="5"/>
                            <circle cx="176" cy="102" r="5"/>
                        </g>
                        <!-- Sensing range sketched around a few of the nodes -->
                        <g stroke-width="1" stroke-dasharray="3 4">
                            <circle cx="106" cy="52" r="13"/>
                            <circle cx="104" cy="150" r="13"/>
                            <circle cx="54" cy="88" r="13"/>
                        </g>
                    </g>
                </svg>
            </div>
            <p class="label text-secondary">Digital layer</p>
        </div>
    </div>
</template>

<style scoped>
.city-layers {
  --size: min(150px, 34vw);
  --label: 8.75rem;
  --gap-closed: 40px;
  --gap-open: 72px;
  --gap: calc(var(--gap-closed) + var(--p) * (var(--gap-open) - var(--gap-closed)));
  position: relative;
  /* An isometric square is as wide as its diagonal and half as tall */
  width: calc(var(--size) * 1.414 + var(--label));
  max-width: 100%;
  height: calc(var(--size) * 0.707 + 3 * var(--gap-open) + 24px);
  margin-inline: auto;
}

@media (min-width: 640px) {
  .city-layers {
    --size: 220px;
    --label: 10rem;
    --gap-closed: 60px;
    --gap-open: 108px;
  }
}

.layer {
  position: absolute;
  /* Resting on the middle of the scene, so the stack spreads both ways */
  bottom: calc(var(--size) * -0.1465 + 12px + 1.5 * var(--gap-open));
  left: calc(var(--size) * 0.207);
  width: var(--size);
  height: var(--size);
  transform: translateY(calc((1.5 - var(--i)) * var(--gap)));
  transition: transform 0.15s linear;
}

@media (prefers-reduced-motion: reduce) {
  .layer {
    transition: none;
  }
}

.sheet {
  width: 100%;
  height: 100%;
  transform: rotateX(60deg) rotateZ(45deg);
}

/* Sheet edges, ruled past the corners like a drafted border */
.frame {
  stroke-width: 0.9;
  opacity: 0.55;
}

.second-pass {
  opacity: 0.35;
}

/* Sits just off the sheet's right-hand corner */
.label {
  position: absolute;
  top: 50%;
  left: calc(100% + var(--size) * 0.207 + 18px);
  transform: translateY(-50%);
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .label {
    font-size: 0.8125rem;
  }
}
</style>
