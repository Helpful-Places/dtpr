<script setup lang="ts">
// MDC component that renders a "How to cite DTPR for AI" block. Reads
// project metadata from `app.config.ts:citation` so the snippet stays
// in sync with `CITATION.cff` (the GitHub-rendered "Cite this
// repository" sidebar) — when you bump version or add an author, edit
// `CITATION.cff` and `app.config.ts` together.
//
// Emits a Schema.org Dataset entry (the taxonomy is data) plus a
// SoftwareSourceCode entry (the docs site / MCP server / API are
// code) into the page's JSON-LD graph so general crawlers, LLMs, and
// Google Dataset Search can recognize the project as citable.
//
// Usage in markdown:  ::cite-this
import { computed, ref } from 'vue'
import { useAppConfig, useI18n, useSchemaOrg } from '#imports'

interface CitationConfig {
  title: string
  authors: string[]
  year: number | string
  version: string
  url: string
  repository: string
  license: string
  licenseUrl: string
}

const appConfig = useAppConfig()
const c = appConfig.citation as CitationConfig
const { locales } = useI18n()

const apaAuthors = computed(() => {
  const a = c.authors
  if (!a.length) return ''
  if (a.length === 1) return a[0]
  if (a.length === 2) return `${a[0]} & ${a[1]}`
  return `${a.slice(0, -1).join(', ')}, & ${a[a.length - 1]}`
})

const apa = computed(() =>
  `${apaAuthors.value} (${c.year}). ${c.title} (Version ${c.version}) [Documentation, MCP server, REST API]. ${c.url}`
)

// Escape characters that BibTeX/LaTeX treat as control characters,
// so the Copy button output matches the static `public/dtpr-for-ai.bib`
// file and survives a traditional pdflatex/BibTeX pipeline. Author
// names containing no comma are treated as institutional ("Helpful
// Places", "MIT") and wrapped in `{{...}}` so BibTeX doesn't try to
// split them into First/Last.
function bibtexEscape(s: string): string {
  return s
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/—/g, '---')
    .replace(/–/g, '--')
    .replace(/‘|’/g, "'")
    .replace(/“|”/g, '"')
}

function bibtexAuthor(name: string): string {
  const escaped = bibtexEscape(name)
  return name.includes(',') ? escaped : `{${escaped}}`
}

const bibtexKey = computed(() => `dtpr-ai-${c.year}`)
const bibtex = computed(() =>
  `@misc{${bibtexKey.value},
  title        = {${bibtexEscape(c.title)}},
  author       = {${c.authors.map(bibtexAuthor).join(' and ')}},
  year         = {${c.year}},
  version      = {${c.version}},
  url          = {${c.url}},
  howpublished = {\\url{${c.repository}}},
  note         = {Licensed ${bibtexEscape(c.license)}}
}`
)

// Pull the live locale code list from `@nuxtjs/i18n` rather than
// hardcoding ['en', 'fr'] — when a new locale ships in
// `nuxt.config.ts:i18n.locales`, the Dataset JSON-LD picks it up
// automatically and Google Dataset Search stops undercounting.
const datasetLocales = computed(() =>
  (locales.value as Array<{ code: string }>).map(l => l.code)
)

// `@unhead/schema-org` doesn't ship a `defineDataset` helper (only
// covers WebSite/Article/Person/Organization/etc.), so emit the
// Dataset and SoftwareSourceCode entries as plain Schema.org nodes.
// `useSchemaOrg` still adds them to the page's `@graph` and resolves
// `@id` references for us.
useSchemaOrg([
  {
    '@type': 'Dataset',
    '@id': `${c.url}#dataset`,
    name: c.title,
    description: 'A taxonomy and disclosure standard for AI systems deployed in places and routines.',
    creator: c.authors.map(name => ({ '@type': 'Organization', name })),
    license: c.licenseUrl,
    url: c.url,
    codeRepository: c.repository,
    version: String(c.version),
    inLanguage: datasetLocales.value,
  },
  {
    '@type': 'SoftwareSourceCode',
    '@id': `${c.repository}#code`,
    name: c.title,
    codeRepository: c.repository,
    creator: c.authors.map(name => ({ '@type': 'Organization', name })),
    license: c.licenseUrl,
    programmingLanguage: ['TypeScript', 'Vue'],
    runtimePlatform: 'Node.js',
  }
])

type Tab = 'apa' | 'bibtex'
const active = ref<Tab>('apa')
const copyState = ref<'idle' | 'copied' | 'error'>('idle')
let copyTimer: ReturnType<typeof setTimeout> | null = null

async function copyActive() {
  if (copyTimer) clearTimeout(copyTimer)
  const payload = active.value === 'apa' ? apa.value : bibtex.value
  try {
    await navigator.clipboard.writeText(payload)
    copyState.value = 'copied'
  } catch {
    copyState.value = 'error'
  }
  copyTimer = setTimeout(() => { copyState.value = 'idle' }, 1500)
}

function setTab(tab: Tab) {
  active.value = tab
  copyState.value = 'idle'
}

// Arrow-key + Home/End navigation between tabs (WAI-ARIA Tabs
// pattern). Click handlers stay on each button — this only adds
// keyboard parity for screen reader / keyboard users.
const TAB_ORDER: Tab[] = ['apa', 'bibtex']
function onTabKey(event: KeyboardEvent) {
  const idx = TAB_ORDER.indexOf(active.value)
  let next: Tab | null = null
  if (event.key === 'ArrowRight') next = TAB_ORDER[(idx + 1) % TAB_ORDER.length]
  else if (event.key === 'ArrowLeft') next = TAB_ORDER[(idx - 1 + TAB_ORDER.length) % TAB_ORDER.length]
  else if (event.key === 'Home') next = TAB_ORDER[0]
  else if (event.key === 'End') next = TAB_ORDER[TAB_ORDER.length - 1]
  if (!next) return
  event.preventDefault()
  setTab(next)
  // Move focus to the newly active tab so the next arrow press lands.
  const el = document.getElementById(`cite-this-tab-${next}`)
  el?.focus()
}
</script>

<template>
  <section class="cite-this" aria-labelledby="cite-this-title">
    <header class="cite-this__head">
      <h3 id="cite-this-title" class="cite-this__title">How to cite DTPR for AI</h3>
      <p class="cite-this__lede">
        DTPR for AI is published under
        <a :href="c.licenseUrl" rel="noopener external">{{ c.license }}</a>.
        If you reference the standard in research, teaching, or product disclosure, please cite it.
      </p>
    </header>

    <div class="cite-this__tabs" role="tablist" aria-label="Citation format">
      <button
        id="cite-this-tab-apa"
        type="button"
        role="tab"
        aria-controls="cite-this-panel-apa"
        :aria-selected="active === 'apa'"
        :tabindex="active === 'apa' ? 0 : -1"
        :class="['cite-this__tab', { 'cite-this__tab--active': active === 'apa' }]"
        @click="setTab('apa')"
        @keydown="onTabKey"
      >
        APA
      </button>
      <button
        id="cite-this-tab-bibtex"
        type="button"
        role="tab"
        aria-controls="cite-this-panel-bibtex"
        :aria-selected="active === 'bibtex'"
        :tabindex="active === 'bibtex' ? 0 : -1"
        :class="['cite-this__tab', { 'cite-this__tab--active': active === 'bibtex' }]"
        @click="setTab('bibtex')"
        @keydown="onTabKey"
      >
        BibTeX
      </button>
      <span class="cite-this__spacer" />
      <button
        type="button"
        class="cite-this__copy"
        :data-state="copyState"
        @click="copyActive"
      >
        {{ copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed' : 'Copy' }}
      </button>
    </div>

    <pre
      v-show="active === 'apa'"
      id="cite-this-panel-apa"
      role="tabpanel"
      aria-labelledby="cite-this-tab-apa"
      tabindex="0"
      class="cite-this__pre"
    ><code>{{ apa }}</code></pre>
    <pre
      v-show="active === 'bibtex'"
      id="cite-this-panel-bibtex"
      role="tabpanel"
      aria-labelledby="cite-this-tab-bibtex"
      tabindex="0"
      class="cite-this__pre"
    ><code>{{ bibtex }}</code></pre>

    <p class="cite-this__meta">
      Version {{ c.version }} · Source repository:
      <a :href="c.repository" rel="noopener external">{{ c.repository }}</a>
      ·
      <a href="/dtpr-for-ai.bib" download>Download <code>.bib</code></a>
    </p>
  </section>
</template>

<style scoped>
.cite-this {
  border: 1px solid var(--ui-border, rgb(229, 231, 235));
  border-radius: 0.6rem;
  background: var(--ui-bg, white);
  padding: 1.1rem 1.2rem;
  margin: 1.5rem 0;
}

.cite-this__head {
  margin-bottom: 0.85rem;
}

.cite-this__title {
  margin: 0 0 0.25rem;
  font-size: 1.05rem;
}

.cite-this__lede {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ui-text-muted, rgb(107, 114, 128));
}

.cite-this__tabs {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border-bottom: 1px solid var(--ui-border, rgb(229, 231, 235));
  margin-bottom: 0;
}

.cite-this__tab {
  appearance: none;
  background: transparent;
  border: 0;
  padding: 0.4rem 0.7rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ui-text-muted, rgb(107, 114, 128));
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.cite-this__tab--active {
  color: var(--ui-primary, #10b981);
  border-bottom-color: var(--ui-primary, #10b981);
}

.cite-this__spacer {
  flex: 1 1 auto;
}

.cite-this__copy {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.55rem;
  border-radius: 0.3rem;
  border: 1px solid var(--ui-border, rgb(229, 231, 235));
  background: var(--ui-bg-muted, rgb(249, 250, 251));
  color: var(--ui-text-primary, inherit);
  cursor: pointer;
}

.cite-this__copy:hover {
  border-color: var(--ui-primary, #10b981);
  color: var(--ui-primary, #10b981);
}

.cite-this__copy[data-state='copied'] {
  border-color: var(--ui-color-success-500, #10b981);
  color: var(--ui-color-success-700, #047857);
}

.cite-this__copy[data-state='error'] {
  border-color: var(--ui-color-error-500, #ef4444);
  color: var(--ui-color-error-700, #b91c1c);
}

.cite-this__pre {
  margin: 0;
  padding: 0.85rem 0.95rem;
  background: var(--ui-bg-muted, rgb(249, 250, 251));
  border-radius: 0 0 0.4rem 0.4rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--ui-text-primary, inherit);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.cite-this__meta {
  margin: 0.7rem 0 0;
  font-size: 0.78rem;
  color: var(--ui-text-muted, rgb(107, 114, 128));
}
</style>
