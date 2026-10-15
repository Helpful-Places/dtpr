// Focus handling for a panel that acts as a modal dialog: focus moves into it
// when it opens, Tab stays inside it, and focus goes back where it came from
// when it closes. `fallback` is used when the opener is gone or hidden.
export function useModalFocus(
  panel: Ref<HTMLElement | undefined>,
  open: Ref<boolean>,
  fallback?: () => HTMLElement | null | undefined,
) {
  let opener: HTMLElement | null = null

  const visible = (el?: HTMLElement | null) => !!el?.isConnected && el.getClientRects().length > 0
  const focusable = () =>
    [...panel.value?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ) ?? []].filter(visible)

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab' || !open.value || !panel.value) return
    const items = focusable()
    const first = items[0]
    const last = items.at(-1)
    if (!first || !last) return
    const active = document.activeElement
    const leaving = !panel.value.contains(active) || active === (event.shiftKey ? first : last)
      || (event.shiftKey && active === panel.value)
    if (!leaving) return
    event.preventDefault()
    ;(event.shiftKey ? last : first).focus()
  }

  watch(open, async (isOpen) => {
    if (isOpen) {
      opener = document.activeElement as HTMLElement | null
      await nextTick()
      panel.value?.focus()
    }
    else {
      await nextTick()
      const target = visible(opener) ? opener : fallback?.()
      opener = null
      // Another dialog may have opened in the same step; leave focus with it.
      if (document.activeElement?.closest('[aria-modal="true"]')) return
      target?.focus()
    }
  }, { flush: 'post' })

  onMounted(() => document.addEventListener('keydown', onKeydown))
  onUnmounted(() => document.removeEventListener('keydown', onKeydown))
}
