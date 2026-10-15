// A datachain from public/data, with only the part of the taxonomy it uses.
// Await it at the top of a section's setup. `key` must be unique on the page.

// Datachains live in public/data, where the builder also loads them as
// examples. Importing them keeps them in the server render. They are imported
// up front: awaiting one before useFetch would lose the Nuxt context.
const files = import.meta.glob<DtprDatachain>('~~/public/data/*.datachain.json', { eager: true, import: 'default' })

export type DatachainSampleElement = Pick<DtprElement, 'id' | 'category_id' | 'title' | 'description' | 'variables' | 'icon_variants'>
export type DatachainSampleCategory = Pick<DtprCategory, 'id' | 'name' | 'prompt' | 'element_context'>

export async function useDatachainSample(src: string | undefined, key: string) {
  const path = Object.keys(files).find((p) => src && p.endsWith(src))
  const chain = shallowRef<DtprDatachain | null>(path ? files[path]! : null)

  // A datachain is read against the schema version it was built on. Only the
  // categories and elements it uses are kept, so the page does not carry the
  // whole taxonomy.
  const { data: taxonomy } = await useFetch('/api/taxonomy', {
    key: `${key}-taxonomy`,
    query: { v: chain.value?.schema_version },
    immediate: !!chain.value,
    transform: (full: DtprTaxonomy) => {
      const used = new Set(chain.value!.elements.map((e) => e.element_id))
      const elements: DatachainSampleElement[] = full.elements
        .filter((e) => used.has(e.id))
        .map(({ id, category_id, title, description, variables, icon_variants }) => ({ id, category_id, title, description, variables, icon_variants }))
      const categories: DatachainSampleCategory[] = full.categories
        .filter((c) => elements.some((e) => e.category_id === c.id))
        .map(({ id, name, prompt, element_context }) => ({ id, name, prompt, element_context }))
      return { version: full.version.id, categories, elements }
    },
  })

  const elementById = computed(() => new Map((taxonomy.value?.elements ?? []).map((e) => [e.id, e])))

  const values = (placed: DtprDatachainElement) => dtprVariableValues(placed, DTPR_SOURCE_LOCALE)
  const elementTitle = (placed: DtprDatachainElement) =>
    dtprFill(dtprText(elementById.value.get(placed.element_id)!.title), values(placed))
  const contextName = (category: Pick<DtprCategory, 'element_context'>, placed: DtprDatachainElement) =>
    dtprText(category.element_context?.values.find((v) => v.id === placed.context_type_id)?.name)

  // A datachain may name an element itself ("New York Police Department").
  // The taxonomy's own name for it ("Institution") then becomes the note.
  const title = (placed: DtprDatachainElement) => values(placed).title || elementTitle(placed)
  const note = (category: Pick<DtprCategory, 'element_context'>, placed: DtprDatachainElement) =>
    [values(placed).title ? elementTitle(placed) : '', contextName(category, placed)].filter(Boolean).join(' · ')

  const icon = (placed: DtprDatachainElement) => {
    const element = elementById.value.get(placed.element_id)!
    return dtprIconUrl(taxonomy.value!.version, element.id, dtprIconVariant(element, placed.context_type_id))
  }

  // The elements placed in one category, in the order the datachain gives them.
  const placedIn = (categoryId: string) =>
    (chain.value?.elements ?? []).filter((p) => elementById.value.get(p.element_id)?.category_id === categoryId)

  return { chain, taxonomy, elementById, values, elementTitle, title, note, icon, placedIn }
}
