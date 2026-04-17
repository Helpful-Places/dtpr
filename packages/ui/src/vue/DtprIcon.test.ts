import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DtprIcon from './DtprIcon.vue'
import { HEXAGON_FALLBACK_DATA_URI } from '../core/index.js'

describe('DtprIcon', () => {
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
})
