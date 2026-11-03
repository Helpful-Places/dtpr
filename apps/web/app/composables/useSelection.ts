// The selection: the elements picked in Explore, kept as a datachain draft.
// The drawer's open state, the pick toggle, and the ways out (package, JSON,
// share link) live here so the panes, the element entry and the Download
// menu all act on the same thing.
export function useSelection() {
  const open = useState('selection-open', () => false)
  const building = useState('selection-building', () => false)
  const { taxonomy, t, locale, version, elementById } = useTaxonomyContext()
  const draft = useDatachainDraft()
  const toast = useToast()
  const copy = useCopy()

  const count = computed(() => draft.elements.value.length)
  const countIn = (categoryId: string) => draft.elements.value.filter((e) => elementById.value.get(e.element_id)?.category_id === categoryId).length

  /** Add or remove an element. Returns what happened, for a screen reader. */
  const toggle = (element: DtprElement): string => {
    const name = dtprFill(t(element.title))
    if (draft.has(element.id)) {
      draft.remove(element.id)
      return `${name} removed from your selection.`
    }
    if (draft.add(element.id, version.value)) return `${name} added to your selection.`
    toast.add({
      title: 'Your selection is on a different schema version',
      description: `It was started on ${draft.chain.value?.schema_version}. Open the selection to switch to that version or start over.`,
      color: 'warning',
    })
    return ''
  }

  // Downloads are named for the datachain.
  const fileStem = computed(() => (dtprText(draft.chain.value?.title, locale.value) || 'datachain').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'datachain')

  async function downloadPackage() {
    const chain = draft.chain.value
    if (!chain || !chain.elements.length) return
    building.value = true
    try {
      const zip = await dtprBuildPackage({ taxonomy: taxonomy.value!, chain, locale: locale.value })
      dtprSaveBlob(zip, `${fileStem.value}-dtpr.zip`)
    }
    catch {
      toast.add({ title: 'The package could not be built', description: 'The icons did not arrive from the DTPR API. Try again in a moment.', color: 'error' })
    }
    finally {
      building.value = false
    }
  }

  const downloadJson = () => {
    if (!draft.chain.value) return
    dtprSaveBlob(new Blob([JSON.stringify(draft.chain.value, null, 2)], { type: 'application/json' }), `${fileStem.value}.datachain.json`)
  }

  // A share link opens Explore on the datachain's schema version with the datachain in the fragment.
  const shareLink = () => {
    const chain = draft.chain.value
    if (!chain) return
    const v = chain.schema_version === taxonomy.value!.versions[0]?.id ? '' : `?v=${encodeURIComponent(chain.schema_version)}`
    return copy(`${window.location.origin}/taxonomy${v}#data=${dtprEncodeShare(chain)}`, 'Share link')
  }

  return { open, building, count, countIn, toggle, fileStem, downloadPackage, downloadJson, shareLink }
}
