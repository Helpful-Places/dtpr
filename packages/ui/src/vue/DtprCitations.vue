<script setup lang="ts">
import { computed } from 'vue'
import type { ProvenanceRef } from '../core/index.js'

interface Props {
  // Chain-wide deduped citations, in the order produced by
  // `buildResolvedDatachain`. Each row gets a stable
  // `id="dtpr-citation-{n}"` so inline `<sup>[n]</sup>` markers in
  // `<DtprElementDetail>` can deep-link into the footer.
  citations: readonly ProvenanceRef[]
  // Optional heading for the footer block. Callers supply a
  // locale-resolved label; defaults to "Sources" when omitted.
  heading?: string
}

const props = withDefaults(defineProps<Props>(), {
  heading: 'Sources',
})

// HTML-escape policy mirrors <DtprElementDetail>: every free-text
// citation field is rendered via `{{ }}`. `url` is anchored only
// when it matches an http(s) scheme; anything else falls through to
// plain text so a `javascript:` or `data:` URL never becomes a live
// link.
function isSafeUrl(value: string): boolean {
  return /^https?:\/\//.test(value)
}

// Pre-compute per-row render data so the template stays branch-light.
interface RenderedCitation {
  id: string
  number: number
  ref: ProvenanceRef
  href: string | null
}

const rendered = computed<RenderedCitation[]>(() =>
  props.citations.map((ref, index) => {
    const number = index + 1
    const href = ref.url && isSafeUrl(ref.url) ? ref.url : null
    return {
      id: `dtpr-citation-${number}`,
      number,
      ref,
      href,
    }
  }),
)
</script>

<template>
  <section
    v-if="rendered.length > 0"
    class="dtpr-citations"
    aria-labelledby="dtpr-citations-heading"
  >
    <h2 id="dtpr-citations-heading" class="dtpr-citations__heading">
      {{ heading }}
    </h2>
    <ol class="dtpr-citations__list">
      <li
        v-for="item in rendered"
        :id="item.id"
        :key="item.id"
        class="dtpr-citations__item"
        :data-dtpr-source-type="item.ref.type"
      >
        <span
          class="dtpr-citations__number"
          aria-hidden="true"
        >[{{ item.number }}]</span>
        <span class="dtpr-citations__type">{{ item.ref.type }}</span>
        <a
          v-if="item.href"
          class="dtpr-citations__title"
          :href="item.href"
          target="_blank"
          rel="noopener noreferrer"
        >{{ item.ref.title }}</a>
        <span v-else class="dtpr-citations__title">{{ item.ref.title }}</span>
        <span
          v-if="item.ref.citation"
          class="dtpr-citations__footnote"
        >{{ item.ref.citation }}</span>
      </li>
    </ol>
  </section>
</template>
