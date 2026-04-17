import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DtprElement from './DtprElement.vue'
import type { ElementDisplay } from '../core/index.js'

function makeDisplay(overrides: Partial<ElementDisplay> = {}): ElementDisplay {
  return {
    title: 'Cloud storage',
    description: 'Data held for 30 days.',
    icon: { url: '/icons/cloud.svg', alt: 'Cloud' },
    variables: [],
    citation: 'See RFC 1234',
    ...overrides,
  }
}

describe('DtprElement', () => {
  it('renders the interpolated title', () => {
    const w = mount(DtprElement, { props: { display: makeDisplay() } })
    expect(w.text()).toContain('Cloud storage')
  })

  it('renders the element icon via DtprIcon with url + alt', () => {
    const w = mount(DtprElement, { props: { display: makeDisplay() } })
    const img = w.get('img')
    expect(img.attributes('src')).toBe('/icons/cloud.svg')
    expect(img.attributes('alt')).toBe('Cloud')
  })

  it('forwards iconSize prop to inner icon', () => {
    const w = mount(DtprElement, { props: { display: makeDisplay(), iconSize: 24 } })
    const img = w.get('img')
    expect(img.attributes('width')).toBe('24')
    expect(img.attributes('height')).toBe('24')
  })

  it('uses a semantic <figure> root with dtpr-element class', () => {
    const w = mount(DtprElement, { props: { display: makeDisplay() } })
    expect(w.element.tagName).toBe('FIGURE')
    expect(w.classes()).toContain('dtpr-element')
  })
})
