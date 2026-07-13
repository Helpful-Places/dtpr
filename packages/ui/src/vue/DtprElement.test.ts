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

  it('renders icon and title-block as direct children of the __header row', () => {
    const w = mount(DtprElement, { props: { display: makeDisplay() } })
    const header = w.get('.dtpr-element__header')
    const children = Array.from(header.element.children)
    const iconIndex = children.findIndex((c) => c.classList.contains('dtpr-element__icon'))
    const titleBlockIndex = children.findIndex((c) =>
      c.classList.contains('dtpr-element__title-block'),
    )
    expect(iconIndex).toBeGreaterThanOrEqual(0)
    expect(titleBlockIndex).toBeGreaterThanOrEqual(0)
    expect(iconIndex).toBeLessThan(titleBlockIndex)
    expect(w.get('.dtpr-element__title-block .dtpr-element__title').text()).toBe('Cloud storage')
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

  // R15b: AI-proposed indicator. Visible by default whenever
  // `display.proposed === true`; absent for snapshot-resolved
  // elements and undefined (legacy thin path) values alike.
  it('does not render the proposed indicator when display.proposed is undefined', () => {
    const w = mount(DtprElement, { props: { display: makeDisplay() } })
    expect(w.find('[data-dtpr-proposed]').exists()).toBe(false)
    expect(w.classes()).not.toContain('dtpr-element--proposed')
  })

  it('does not render the proposed indicator when display.proposed is false', () => {
    const w = mount(DtprElement, { props: { display: makeDisplay({ proposed: false }) } })
    expect(w.find('[data-dtpr-proposed]').exists()).toBe(false)
    expect(w.classes()).not.toContain('dtpr-element--proposed')
  })

  it('renders the proposed indicator when display.proposed is true', () => {
    const w = mount(DtprElement, { props: { display: makeDisplay({ proposed: true }) } })
    const badge = w.find('[data-dtpr-proposed="true"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('Proposed')
    expect(w.classes()).toContain('dtpr-element--proposed')
  })

})
