import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * Reactive dark-mode flag that mirrors the host page's color mode.
 *
 * Resolution order, matching how `@nuxt/color-mode` (with Nuxt UI's
 * `classSuffix: ""`) drives Docus and how a standalone iframe inherits
 * the user's system preference:
 *
 *  1. `<html class="dark">` → true (explicit user toggle).
 *  2. `<html class="light">` → false (explicit user toggle).
 *  3. otherwise: `prefers-color-scheme: dark` media query.
 *
 * Server-side (no `document` / `window`) it returns false — the SSR
 * snapshot renders the light icon, then the client mount swaps if
 * needed. Components that surface this state should accept a brief
 * mount-time flicker as the cost of avoiding hydration mismatches.
 */
export function useDtprDarkMode(): Ref<boolean> {
  const isDark = ref(false)

  // SSR: bail without registering observers.
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return isDark
  }

  let mediaQuery: MediaQueryList | null = null
  let classObserver: MutationObserver | null = null

  function compute(): boolean {
    const cl = document.documentElement.classList
    if (cl.contains('dark')) return true
    if (cl.contains('light')) return false
    return mediaQuery?.matches ?? false
  }

  function update() {
    isDark.value = compute()
  }

  onMounted(() => {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    update()
    mediaQuery.addEventListener('change', update)
    classObserver = new MutationObserver(update)
    classObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
  })

  onBeforeUnmount(() => {
    mediaQuery?.removeEventListener('change', update)
    classObserver?.disconnect()
  })

  return isDark
}
