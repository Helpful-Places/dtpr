import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import DtprIcon from './DtprIcon.vue'
import { HEXAGON_FALLBACK_DATA_URI } from '../core/index.js'

describe('DtprIcon', () => {
  // Reset html class so a stray `.dark` from one test cannot leak into
  // the next and silently flip the mode under another assertion.
  afterEach(() => {
    document.documentElement.classList.remove('dark', 'light')
  })

  it('renders img with src, alt, and size-driven width/height', () => {
    const w = mount(DtprIcon, { props: { src: '/x.svg', alt: 'X', size: 32 } })
    const img = w.get('img')
    expect(img.attributes('src')).toBe('/x.svg')
    expect(img.attributes('alt')).toBe('X')
    expect(img.attributes('width')).toBe('32')
    expect(img.attributes('height')).toBe('32')
    expect(img.classes()).toContain('dtpr-icon')
  })

  it('renders hexagon fallback data URI when src is empty', () => {
    const w = mount(DtprIcon, { props: { src: '', alt: 'Empty' } })
    expect(w.get('img').attributes('src')).toBe(HEXAGON_FALLBACK_DATA_URI)
  })

  it('renders hexagon fallback data URI when src is not provided', () => {
    const w = mount(DtprIcon, { props: { alt: 'None' } })
    expect(w.get('img').attributes('src')).toBe(HEXAGON_FALLBACK_DATA_URI)
  })

  it('swaps to hexagon fallback on @error event', async () => {
    const w = mount(DtprIcon, { props: { src: '/does-not-exist.svg', alt: 'Broken' } })
    expect(w.get('img').attributes('src')).toBe('/does-not-exist.svg')
    await w.get('img').trigger('error')
    expect(w.get('img').attributes('src')).toBe(HEXAGON_FALLBACK_DATA_URI)
    expect(w.emitted('error')).toBeTruthy()
  })

  it('resets failed state when src prop changes', async () => {
    const w = mount(DtprIcon, { props: { src: '/a.svg', alt: 'A' } })
    await w.get('img').trigger('error')
    expect(w.get('img').attributes('src')).toBe(HEXAGON_FALLBACK_DATA_URI)
    await w.setProps({ src: '/b.svg' })
    expect(w.get('img').attributes('src')).toBe('/b.svg')
  })

  it('decorative mode (alt="") renders empty alt and role="presentation"', () => {
    const w = mount(DtprIcon, { props: { src: '/deco.svg', alt: '' } })
    const img = w.get('img')
    expect(img.attributes('alt')).toBe('')
    expect(img.attributes('role')).toBe('presentation')
  })

  it('non-decorative usage does not set role attribute', () => {
    const w = mount(DtprIcon, { props: { src: '/x.svg', alt: 'Meaningful' } })
    expect(w.get('img').attributes('role')).toBeUndefined()
  })

  it('defaults size to 48 when not provided', () => {
    const w = mount(DtprIcon, { props: { alt: 'X' } })
    const img = w.get('img')
    expect(img.attributes('width')).toBe('48')
    expect(img.attributes('height')).toBe('48')
  })

  describe('dark-mode swap', () => {
    // Force matchMedia to a known light baseline so each test starts
    // from a deterministic state regardless of the host system pref.
    beforeEach(() => {
      vi.stubGlobal(
        'matchMedia',
        (q: string): MediaQueryList => ({
          matches: false,
          media: q,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
      )
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('uses src in light mode even when darkSrc is provided', async () => {
      const w = mount(DtprIcon, {
        props: { src: '/light.svg', darkSrc: '/dark.svg', alt: 'X' },
      })
      await flushPromises()
      expect(w.get('img').attributes('src')).toBe('/light.svg')
    })

    it('swaps to darkSrc when html.dark is added after mount', async () => {
      const w = mount(DtprIcon, {
        props: { src: '/light.svg', darkSrc: '/dark.svg', alt: 'X' },
      })
      await flushPromises()
      expect(w.get('img').attributes('src')).toBe('/light.svg')

      document.documentElement.classList.add('dark')
      // MutationObserver delivers asynchronously — yield twice to let
      // the callback run and Vue flush the resulting computed update.
      await new Promise((resolve) => setTimeout(resolve, 0))
      await nextTick()
      expect(w.get('img').attributes('src')).toBe('/dark.svg')
    })

    it('falls back to src when darkSrc is omitted, even in dark mode', async () => {
      document.documentElement.classList.add('dark')
      const w = mount(DtprIcon, { props: { src: '/light.svg', alt: 'X' } })
      await flushPromises()
      expect(w.get('img').attributes('src')).toBe('/light.svg')
    })

    it('respects prefers-color-scheme when no html class is set', async () => {
      vi.stubGlobal(
        'matchMedia',
        (q: string): MediaQueryList => ({
          matches: q.includes('dark'),
          media: q,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
      )
      const w = mount(DtprIcon, {
        props: { src: '/light.svg', darkSrc: '/dark.svg', alt: 'X' },
      })
      await flushPromises()
      expect(w.get('img').attributes('src')).toBe('/dark.svg')
    })

    it('html.light overrides prefers-color-scheme: dark', async () => {
      vi.stubGlobal(
        'matchMedia',
        (q: string): MediaQueryList => ({
          matches: q.includes('dark'),
          media: q,
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
      )
      document.documentElement.classList.add('light')
      const w = mount(DtprIcon, {
        props: { src: '/light.svg', darkSrc: '/dark.svg', alt: 'X' },
      })
      await flushPromises()
      expect(w.get('img').attributes('src')).toBe('/light.svg')
    })
  })
})
