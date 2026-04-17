import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DtprCategorySection from './DtprCategorySection.vue'

describe('DtprCategorySection', () => {
  it('renders with <button aria-expanded="false"> and hidden panel by default', () => {
    const w = mount(DtprCategorySection, {
      props: { id: 'ai', title: 'AI' },
      slots: { default: '<p>body</p>' },
    })
    const btn = w.get('button')
    expect(btn.attributes('aria-expanded')).toBe('false')
    expect(btn.attributes('aria-controls')).toBe('dtpr-section-ai-panel')
    expect(btn.attributes('type')).toBe('button')
    expect(btn.attributes('data-dtpr-collapsible')).toBeDefined()
    const panel = w.get(`#${btn.attributes('aria-controls')}`)
    // hidden attribute present means collapsed.
    expect(panel.attributes('hidden')).toBeDefined()
    expect(panel.attributes('role')).toBe('region')
    expect(panel.attributes('aria-labelledby')).toBe('dtpr-section-ai-button')
  })

  it('clicking the header toggles aria-expanded + panel visibility', async () => {
    const w = mount(DtprCategorySection, {
      props: { id: 'ai', title: 'AI' },
      slots: { default: '<p>body</p>' },
    })
    await w.get('button').trigger('click')
    const btn = w.get('button')
    expect(btn.attributes('aria-expanded')).toBe('true')
    expect(w.emitted('update:expanded')).toEqual([[true]])
    expect(w.emitted('toggle')).toEqual([[true]])
    const panel = w.get(`#${btn.attributes('aria-controls')}`)
    expect(panel.attributes('hidden')).toBeUndefined()
  })

  it('Enter key on header toggles state', async () => {
    const w = mount(DtprCategorySection, { props: { id: 'x', title: 'X' } })
    await w.get('button').trigger('keydown', { key: 'Enter' })
    expect(w.get('button').attributes('aria-expanded')).toBe('true')
  })

  it('Space key on header toggles state', async () => {
    const w = mount(DtprCategorySection, { props: { id: 'x', title: 'X' } })
    await w.get('button').trigger('keydown', { key: ' ' })
    expect(w.get('button').attributes('aria-expanded')).toBe('true')
  })

  it('unrelated keys do not toggle state', async () => {
    const w = mount(DtprCategorySection, { props: { id: 'x', title: 'X' } })
    await w.get('button').trigger('keydown', { key: 'ArrowDown' })
    expect(w.get('button').attributes('aria-expanded')).toBe('false')
    expect(w.emitted('update:expanded')).toBeUndefined()
  })

  it('respects controlled expanded prop', async () => {
    const w = mount(DtprCategorySection, {
      props: { id: 'x', title: 'X', expanded: true },
    })
    expect(w.get('button').attributes('aria-expanded')).toBe('true')
    await w.setProps({ expanded: false })
    expect(w.get('button').attributes('aria-expanded')).toBe('false')
  })

  it('disableAccordion renders a heading + always-visible panel with no button', () => {
    const w = mount(DtprCategorySection, {
      props: { id: 'x', title: 'Static', disableAccordion: true },
      slots: { default: '<p>body</p>' },
    })
    expect(w.find('button').exists()).toBe(false)
    const panel = w.get('.dtpr-category-section__panel')
    expect(panel.attributes('hidden')).toBeUndefined()
    expect(panel.attributes('role')).toBe('region')
    expect(w.text()).toContain('Static')
    expect(w.text()).toContain('body')
  })

  it('uses <button> not <div tabindex="0"> (a11y guard)', () => {
    const w = mount(DtprCategorySection, { props: { id: 'x', title: 'X' } })
    expect(w.get('button').element.tagName).toBe('BUTTON')
  })

  it('sets container-type style via the dtpr-category-section class', () => {
    const w = mount(DtprCategorySection, { props: { id: 'x', title: 'X' } })
    expect(w.classes()).toContain('dtpr-category-section')
  })
})
