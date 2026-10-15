// The Developer view's cookie, read once per request and shared through state.
// Each useCookie call keeps its own copy and writes it back, so one copy here
// stops a later reader from overwriting what `?dev=1` just set.
export default defineNuxtPlugin(() => {
  const cookie = useCookie<boolean | undefined>('dtpr-developer', { maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  const state = useState('developer-view', () => cookie.value === true)
  return {
    provide: {
      setDeveloperView: (on: boolean) => {
        state.value = on
        cookie.value = on
      },
    },
  }
})
