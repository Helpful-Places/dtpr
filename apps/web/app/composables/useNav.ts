const fetchNav = () => queryCollection('navElements').first()

// Header and footer share one request for the nav content.
export function useNav() {
  return useAsyncData('nav', fetchNav)
}
