// The datachain being composed in the builder. It lives in this browser only:
// in memory across pages, and in localStorage across visits. The draft is kept
// in the API's own datachain shape, so fields the builder does not edit
// (sources, actions, subchain instances) survive an import and export untouched.
const STORAGE_KEY = 'dtpr.datachain-draft.v1'

interface StoredDraft {
  chain: DtprDatachain
  // The schema version's content hash when the draft was last saved.
  contentHash?: string
}

const newDraft = (version: string): DtprDatachain => ({
  id: `datachain-${Date.now().toString(36)}`,
  schema_version: version,
  title: [],
  created_at: new Date().toISOString(),
  elements: [],
})

export function useDatachainDraft() {
  const chain = useState<DtprDatachain | null>('datachain-draft', () => null)
  const savedHash = useState<string | undefined>('datachain-draft-hash', () => undefined)
  const restored = useState('datachain-draft-restored', () => false)

  // Restore once per visit, after hydration so server and client markup agree.
  onMounted(() => {
    if (restored.value) return
    restored.value = true
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as StoredDraft | null
      if (stored?.chain?.elements && !chain.value) {
        chain.value = stored.chain
        savedHash.value = stored.contentHash
      }
    }
    catch {
      // An unreadable draft is dropped.
    }
  })

  const save = (contentHash?: string) => {
    if (!import.meta.client) return
    if (contentHash) savedHash.value = contentHash
    if (!chain.value) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, JSON.stringify({ chain: chain.value, contentHash: savedHash.value } satisfies StoredDraft))
  }

  const elements = computed(() => chain.value?.elements ?? [])
  const has = (elementId: string) => elements.value.some((e) => e.element_id === elementId)
  const placed = (elementId: string) => elements.value.find((e) => e.element_id === elementId)

  const touch = () => {
    if (!chain.value) return
    chain.value.elements.forEach((e, i) => { e.priority = i })
    chain.value.updated_at = new Date().toISOString()
    save()
  }

  /** Returns false when the draft is pinned to a different schema version. */
  const add = (elementId: string, version: string) => {
    if (!chain.value || !chain.value.elements.length) {
      chain.value = { ...newDraft(version), title: chain.value?.title ?? [] }
    }
    if (chain.value.schema_version !== version) return false
    if (!has(elementId)) chain.value.elements.push({ element_id: elementId, priority: 0, variables: [] })
    touch()
    return true
  }

  const remove = (elementId: string) => {
    if (!chain.value) return
    chain.value.elements = chain.value.elements.filter((e) => e.element_id !== elementId)
    touch()
  }

  const setContext = (elementId: string, contextValueId: string | null) => {
    const el = placed(elementId)
    if (!el) return
    if (contextValueId) el.context_type_id = contextValueId
    else delete el.context_type_id
    touch()
  }

  const setVariable = (elementId: string, variableId: string, locale: string, text: string) => {
    const el = placed(elementId)
    if (!el) return
    const existing = el.variables.find((v) => v.id === variableId)
    const others = ((existing?.value ?? []) as DtprLocalized[]).filter((v) => typeof v !== 'string' && v.locale !== locale)
    const value = text ? [...others, { locale, value: text }] : others
    if (!value.length) el.variables = el.variables.filter((v) => v.id !== variableId)
    else if (existing) existing.value = value
    else el.variables.push({ id: variableId, value })
    touch()
  }

  const setTitle = (locale: string, text: string, version: string) => {
    if (!chain.value) chain.value = newDraft(version)
    const others = chain.value.title.filter((v) => v.locale !== locale)
    chain.value.title = text ? [...others, { locale, value: text }] : others
    touch()
  }

  /** Replace the draft with an imported datachain. Throws if it is not one. */
  const load = (input: unknown) => {
    const candidate = input as DtprDatachain
    if (!candidate || typeof candidate !== 'object' || typeof candidate.schema_version !== 'string' || !Array.isArray(candidate.elements)) {
      throw new Error('This is not a datachain: it needs a schema_version and an elements list.')
    }
    chain.value = {
      ...candidate,
      title: Array.isArray(candidate.title) ? candidate.title : [],
      elements: candidate.elements.map((e) => ({ ...e, variables: Array.isArray(e.variables) ? e.variables : [] })),
    }
    savedHash.value = undefined
    save()
  }

  const clear = () => {
    chain.value = null
    savedHash.value = undefined
    save()
  }

  return { chain, elements, savedHash, has, placed, add, remove, setContext, setVariable, setTitle, load, clear, save }
}
