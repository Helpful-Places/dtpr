<script setup lang="ts">
// How far each locale of the taxonomy has been reviewed, and what reviewers still question.
const { to, categoryById, elementById } = useTaxonomyContext()
const route = useRoute()

const { data } = await useFetch<DtprTranslations & { version: DtprSchemaVersion }>('/api/taxonomy/translations', {
  query: { v: computed(() => route.query.v) },
})

if (!data.value) {
  throw createError({ statusCode: 502, statusMessage: 'Translation status could not be loaded', fatal: true })
}

usePageSeo({
  title: 'Translation status · DTPR Taxonomy',
  description: 'Which languages the DTPR taxonomy is published in, how far each translation has been reviewed, and the open questions reviewers have raised.',
})

const KINDS: Record<DtprTranslationFlag['kind'], string> = {
  term_choice: 'Term choice',
  native_review: 'Needs a fluent speaker',
  divergence: 'Differs from the English',
  source_issue: 'Problem in the English source',
  layout: 'Length or layout on a sign',
}
const STATUS_HELP: Record<DtprTranslationStatus, string> = {
  source: 'The text the translations are made from.',
  unverified: 'How it was translated and reviewed is not recorded.',
  machine_draft: 'Translated by a language model and not yet reviewed.',
  machine_reviewed: 'Translated by a language model and checked by a second, independent model pass.',
  human_reviewed: 'Checked by a fluent reviewer.',
}

const flagsFor = (locale: string) => data.value!.flags.filter((f) => f.locale === locale)
// English first, then the rest in the order the schema lists them.
const locales = computed(() => [...data.value!.locales].sort((a, b) => Number(b.status === 'source') - Number(a.status === 'source')))

// What a flag is about, as a link into the explorer in that locale.
function target(flag: DtprTranslationFlag, item: DtprTranslationFlag['targets'][number]) {
  const query = { locale: flag.locale === DTPR_SOURCE_LOCALE ? undefined : flag.locale }
  if (item.type === 'element') {
    const element = elementById.value.get(item.id)
    return { label: element ? dtprFill(dtprText(element.title)) : item.id, to: to(`/taxonomy/elements/${item.id}`, query) }
  }
  if (item.type === 'category') {
    const category = categoryById.value.get(item.id)
    return { label: category ? dtprText(category.name) : item.id, to: to(`/taxonomy/categories/${item.id}`, query) }
  }
  return { label: 'Datachain type', to: undefined }
}
// One link per thing, however many of its fields a flag names.
const targets = (flag: DtprTranslationFlag) => {
  const seen = new Map<string, ReturnType<typeof target>>()
  for (const item of flag.targets) seen.set(`${item.type}:${item.id}`, target(flag, item))
  return [...seen.values()]
}
</script>

<template>
  <div>
    <header class="mb-6 max-w-3xl rounded-md bg-white p-5 shadow-sm ring ring-rule sm:p-6">
      <h2 class="font-sans text-xl font-semibold text-balance">Translation status</h2>
      <p class="mt-2 text-muted">
        The taxonomy is written in English and published in {{ data!.locales.length }} languages.
        Each translation is labelled with how far it has been reviewed, and reviewers' open questions are listed here.
      </p>
    </header>

    <UAlert
      class="mb-6 max-w-3xl" color="primary" variant="subtle" icon="i-lucide-languages"
      title="Fluent in one of these languages?"
      description="A read-through by a fluent speaker is what moves a translation to human reviewed. The open questions below are the best place to start."
      :actions="[{ label: 'Get involved', to: '/get-involved' }]"
    />

    <div class="space-y-4">
      <section v-for="l in locales" :id="l.locale" :key="l.locale" class="scroll-mt-6 rounded-md border border-rule bg-elevated p-4 shadow-sm sm:p-5">
        <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 class="font-serif text-2xl font-semibold text-highlighted">{{ dtprLocaleName(l.locale) }}</h3>
          <code class="font-code text-xs text-muted">{{ l.locale }}</code>
          <UBadge :color="l.status === 'human_reviewed' ? 'success' : dtprNeedsReview(l.status) ? 'warning' : 'neutral'" variant="subtle">
            {{ dtprTranslationStatusLabel(l.status) }}
          </UBadge>
          <NuxtLink
            :to="to('/taxonomy', { locale: l.locale === DTPR_SOURCE_LOCALE ? undefined : l.locale })"
            class="ml-auto text-sm text-primary underline"
          >Browse in {{ dtprLocaleName(l.locale) }}</NuxtLink>
        </div>
        <p class="mt-2 max-w-3xl text-sm text-muted">{{ STATUS_HELP[l.status] }} {{ l.summary }}</p>
        <dl v-if="l.register || l.updated_at" class="mt-3 grid max-w-3xl grid-cols-[7rem_1fr] gap-x-4 gap-y-1 text-sm">
          <template v-if="l.register"><dt class="text-muted">Register</dt><dd>{{ l.register }}</dd></template>
          <template v-if="l.translated_by"><dt class="text-muted">Translated by</dt><dd>{{ l.translated_by }}</dd></template>
          <template v-if="l.reviewed_by"><dt class="text-muted">Reviewed by</dt><dd>{{ l.reviewed_by }}</dd></template>
          <template v-if="l.updated_at"><dt class="text-muted">Updated</dt><dd>{{ l.updated_at }}</dd></template>
        </dl>

        <details v-if="flagsFor(l.locale).length" class="mt-4">
          <summary class="cursor-pointer text-sm font-medium text-primary">{{ flagsFor(l.locale).length }} open {{ flagsFor(l.locale).length === 1 ? 'question' : 'questions' }}</summary>
          <ul class="mt-3 divide-y divide-default border-t border-default">
            <li v-for="flag in flagsFor(l.locale)" :id="flag.id" :key="flag.id" class="scroll-mt-6 py-3 text-sm">
              <p class="font-code text-xs text-warning">{{ KINDS[flag.kind] ?? flag.kind }}</p>
              <p class="mt-1 max-w-3xl text-default">{{ flag.note }}</p>
              <p class="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                <template v-for="item in targets(flag)" :key="item.label">
                  <NuxtLink v-if="item.to" :to="item.to" class="text-primary underline">{{ item.label }}</NuxtLink>
                  <span v-else class="text-muted">{{ item.label }}</span>
                </template>
              </p>
            </li>
          </ul>
        </details>
        <p v-else class="mt-4 text-sm text-muted">No open questions.</p>
      </section>
    </div>
  </div>
</template>
