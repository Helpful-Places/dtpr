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

  it('uses a semantic <article> root with dtpr-element class', () => {
    const w = mount(DtprElement, { props: { display: makeDisplay() } })
    expect(w.element.tagName).toBe('ARTICLE')
    expect(w.classes()).toContain('dtpr-element')
  })

  it('renders icon and title as direct children of the __header row', () => {
    const w = mount(DtprElement, { props: { display: makeDisplay() } })
    const header = w.get('.dtpr-element__header')
    const children = Array.from(header.element.children)
    const iconIndex = children.findIndex((c) => c.classList.contains('dtpr-element__icon'))
    const titleIndex = children.findIndex((c) => c.classList.contains('dtpr-element__title'))
    expect(iconIndex).toBeGreaterThanOrEqual(0)
    expect(titleIndex).toBeGreaterThanOrEqual(0)
    expect(iconIndex).toBeLessThan(titleIndex)
  })

  it('renders footer slot content with --has-footer modifier and a __footer wrapper', () => {
    const w = mount(DtprElement, {
      props: { display: makeDisplay() },
      slots: { footer: '<a class="view-link" href="/x">View element</a>' },
    })
    expect(w.classes()).toContain('dtpr-element--has-footer')
    expect(w.get('.dtpr-element__footer .view-link').text()).toBe('View element')
  })

  it('omits footer wrapper and modifier when no footer slot is provided', () => {
    const w = mount(DtprElement, { props: { display: makeDisplay() } })
    expect(w.classes()).not.toContain('dtpr-element--has-footer')
    expect(w.find('.dtpr-element__footer').exists()).toBe(false)
  })

  it('does not render the description by default', () => {
    const w = mount(DtprElement, { props: { display: makeDisplay() } })
    expect(w.find('.dtpr-element__description').exists()).toBe(false)
    expect(w.text()).not.toContain('Data held for 30 days.')
  })

  it('renders the description when showDescription is true', () => {
    const w = mount(DtprElement, {
      props: { display: makeDisplay(), showDescription: true },
    })
    const desc = w.get('.dtpr-element__description')
    expect(desc.text()).toBe('Data held for 30 days.')
  })

  it('omits the description block when showDescription is true but description is empty', () => {
    const w = mount(DtprElement, {
      props: {
        display: makeDisplay({ description: '' }),
        showDescription: true,
      },
    })
    expect(w.find('.dtpr-element__description').exists()).toBe(false)
  })
})
