<script setup lang="ts">
// MDC component for citing an external research paper, standard, or
// regulatory text from prose. Renders the human-readable citation,
// emits Highwire `citation_*` <meta> tags so Google Scholar / Zotero
// connectors can ingest it, and emits a Schema.org ScholarlyArticle
// entry into the page's JSON-LD graph for general crawlers and LLMs.
//
// Usage in markdown (MDC syntax — note `:` prefix to pass arrays):
//
//   ::citation
//   ---
//   id: aiaaic-2024
//   title: A Collaborative, Human-Centred Taxonomy of AI, Algorithmic, and Automation Harms
//   authors:
//     - Abercrombie, G.
//     - Benbouzid, D.
//   year: 2024
//   doi: 10.48550/arXiv.2407.01294
//   arxivId: '2407.01294'
//   venue: arXiv preprint
//   url: https://doi.org/10.48550/arXiv.2407.01294
//   license: CC BY-SA 4.0
//   licenseUrl: https://creativecommons.org/licenses/by-sa/4.0/
//   ---
//   #bibtex
//   ```bibtex
//   @misc{aiaaic2024, ... }
//   ```
//   ::
//
// All metadata is passed via the YAML-frontmatter prop block (the
// `---` slot in MDC), keeping authors as a clean array. The `bibtex`
// named slot is the only multi-line content — it gets the Docus prose
// code block treatment (Shiki highlighting + copy button) for free.
import { computed } from 'vue'
import { useHead, useSchemaOrg } from '#imports'

interface Props {
  id: string
  title: string
  authors?: string[]
  year?: string | number
  doi?: string
  arxivId?: string
  venue?: string
  url?: string
  pdfUrl?: string
  license?: string
  licenseUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  authors: () => [],
})

const yearString = computed(() => props.year != null ? String(props.year) : '')
const canonicalUrl = computed(() => props.url || (props.doi ? `https://doi.org/${props.doi}` : ''))

// Highwire `citation_*` <meta> tags. Scholar and Zotero translators
// look for these. One `citation_author` per author (Scholar joins
// them itself, multiple authors are mandatory not optional). Each
// meta gets a unique `key` so `@unhead/vue` doesn't dedupe by name —
// without the key, only the last `citation_author` survives.
const metaTags = computed(() => {
  const meta: Array<Record<string, string>> = []
  if (props.title) meta.push({ key: `${props.id}-title`, name: 'citation_title', content: props.title })
  props.authors.forEach((a, i) => {
    meta.push({ key: `${props.id}-author-${i}`, name: 'citation_author', content: a })
  })
  if (yearString.value) meta.push({ key: `${props.id}-date`, name: 'citation_publication_date', content: yearString.value })
  if (props.doi) meta.push({ key: `${props.id}-doi`, name: 'citation_doi', content: props.doi })
  if (props.arxivId) meta.push({ key: `${props.id}-arxiv`, name: 'citation_arxiv_id', content: props.arxivId })
  if (props.pdfUrl) meta.push({ key: `${props.id}-pdf`, name: 'citation_pdf_url', content: props.pdfUrl })
  if (props.venue) meta.push({ key: `${props.id}-venue`, name: 'citation_journal_title', content: props.venue })
  return meta
})

useHead({ meta: metaTags })

// Schema.org ScholarlyArticle. nuxt-schema-org auto-handles
// `@context`, `@id`, and `inLanguage` (from i18n). Plain object form
// — `@unhead/schema-org` doesn't ship a `defineScholarlyArticle`,
// only `defineArticle` (which doesn't accept the ScholarlyArticle
// subtype cleanly). The graph still validates.
useSchemaOrg([
  {
    '@type': 'ScholarlyArticle',
    '@id': canonicalUrl.value || `#${props.id}`,
    name: props.title,
    headline: props.title,
    author: props.authors.map(name => ({ '@type': 'Person', name })),
    datePublished: yearString.value || undefined,
    sameAs: canonicalUrl.value || undefined,
    identifier: props.doi ? { '@type': 'PropertyValue', propertyID: 'DOI', value: props.doi } : undefined,
    license: props.licenseUrl || undefined,
  }
])

// Author byline: "Last, F., Other, S., & Last, T." — APA-ish.
const byline = computed(() => {
  const a = props.authors
  if (!a.length) return ''
  if (a.length === 1) return a[0]
  if (a.length === 2) return `${a[0]} & ${a[1]}`
  return `${a.slice(0, -1).join(', ')}, & ${a[a.length - 1]}`
})
</script>

<template>
  <aside :id="id" class="citation" :aria-labelledby="`${id}-title`">
    <p class="citation__line">
      <span v-if="byline">{{ byline }}</span>
      <span v-if="yearString"> ({{ yearString }}). </span>
      <em v-if="title" :id="`${id}-title`">{{ title }}</em>
      <span v-if="venue">. <span class="citation__venue">{{ venue }}</span></span>
      <span v-if="arxivId">. arXiv:{{ arxivId }}</span>
      <template v-if="canonicalUrl">
        .
        <a :href="canonicalUrl" rel="noopener external">{{ canonicalUrl }}</a>
      </template>
    </p>
    <p v-if="license" class="citation__meta">
      License:
      <a v-if="licenseUrl" :href="licenseUrl" rel="noopener external">{{ license }}</a>
      <span v-else>{{ license }}</span>
    </p>
    <details v-if="$slots.bibtex" class="citation__bibtex">
      <summary>BibTeX</summary>
      <slot name="bibtex" />
    </details>
  </aside>
</template>

<style scoped>
.citation {
  border-left: 3px solid var(--ui-primary, #10b981);
  background: var(--ui-bg-muted, rgb(249, 250, 251));
  padding: 0.85rem 1rem;
  margin: 1.25rem 0;
  border-radius: 0 0.4rem 0.4rem 0;
  font-size: 0.92rem;
  line-height: 1.55;
}

.citation__line {
  margin: 0;
}

.citation__venue {
  font-style: italic;
  color: var(--ui-text-muted, rgb(107, 114, 128));
}

.citation__meta {
  margin: 0.4rem 0 0;
  font-size: 0.82rem;
  color: var(--ui-text-muted, rgb(107, 114, 128));
}

.citation__bibtex {
  margin-top: 0.6rem;
}

.citation__bibtex > summary {
  cursor: pointer;
  font-size: 0.82rem;
  color: var(--ui-text-muted, rgb(107, 114, 128));
  user-select: none;
}

.citation__bibtex > summary:hover {
  color: var(--ui-primary, #10b981);
}
</style>
