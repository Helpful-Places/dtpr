// The Developer view: one switch, shared by the taxonomy and the docs, that shows
// ids, API calls and raw data where a page serves both audiences. It lives in a
// cookie (see plugins/developer.ts) so the server renders the right version and
// nothing shifts on load. `?dev=1` in a link turns it on; `?dev=0` turns it off.
export function useDeveloperView() {
  const state = useState<boolean>('developer-view')
  const { $setDeveloperView } = useNuxtApp()
  return computed({ get: () => state.value === true, set: $setDeveloperView })
}
