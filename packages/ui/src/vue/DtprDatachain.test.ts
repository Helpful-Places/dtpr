import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DtprDatachain from './DtprDatachain.vue'

const sections = [
  { id: 'a', title: 'Alpha' },
  { id: 'b', title: 'Beta' },
]

describe('DtprDatachain', () => {
  it('renders a DtprCategorySection per section in provided order', () => {
    const w = mount(DtprDatachain, {
      props: { sections },
    })
    const btns = w.findAll('button.dtpr-category-section__header')
    expect(btns).toHaveLength(2)
    expect(btns[0]!.text()).toContain('Alpha')
    expect(btns[1]!.text()).toContain('Beta')
  })

  it('renders #empty slot when sections is empty, with no default text', () => {
    const w = mount(DtprDatachain, {
      props: { sections: [] },
      slots: { empty: '<p class="my-empty">Nothing here.</p>' },
    })
    expect(w.get('.my-empty').text()).toBe('Nothing here.')
  })

  it('no default empty copy when sections is empty and #empty slot missing', () => {
    const w = mount(DtprDatachain, { props: { sections: [] } })
    // The root wrapper renders but has no text content.
    expect(w.text().trim()).toBe('')
  })

  it('uncontrolled: all sections collapsed by default', () => {
    const w = mount(DtprDatachain, { props: { sections } })
    const btns = w.findAll('button.dtpr-category-section__header')
    for (const b of btns) expect(b.attributes('aria-expanded')).toBe('false')
  })

  it('uncontrolled: clicking one section opens it, clicking another closes the first', async () => {
    const w = mount(DtprDatachain, { props: { sections } })
    const btns = w.findAll('button.dtpr-category-section__header')
    await btns[0]!.trigger('click')
    const btns2 = w.findAll('button.dtpr-category-section__header')
    expect(btns2[0]!.attributes('aria-expanded')).toBe('true')
    expect(btns2[1]!.attributes('aria-expanded')).toBe('false')
    await btns2[1]!.trigger('click')
    const btns3 = w.findAll('button.dtpr-category-section__header')
    expect(btns3[0]!.attributes('aria-expanded')).toBe('false')
    expect(btns3[1]!.attributes('aria-expanded')).toBe('true')
  })

  it('controlled: openSectionId drives expanded state', async () => {
    const w = mount(DtprDatachain, { props: { sections, openSectionId: 'a' } })
    const btns = w.findAll('button.dtpr-category-section__header')
    expect(btns[0]!.attributes('aria-expanded')).toBe('true')
    expect(btns[1]!.attributes('aria-expanded')).toBe('false')
    await w.setProps({ openSectionId: 'b' })
    const btns2 = w.findAll('button.dtpr-category-section__header')
    expect(btns2[0]!.attributes('aria-expanded')).toBe('false')
    expect(btns2[1]!.attributes('aria-expanded')).toBe('true')
  })

  it('controlled: clicking a section emits update:openSectionId', async () => {
    const w = mount(DtprDatachain, { props: { sections, openSectionId: null } })
    await w.findAll('button.dtpr-category-section__header')[1]!.trigger('click')
    expect(w.emitted('update:openSectionId')).toEqual([['b']])
  })

  it('controlled: clicking the currently-open section emits null to close', async () => {
    const w = mount(DtprDatachain, { props: { sections, openSectionId: 'a' } })
    await w.findAll('button.dtpr-category-section__header')[0]!.trigger('click')
    expect(w.emitted('update:openSectionId')).toEqual([[null]])
  })

  it('disableAccordion cascades to all sections (no buttons, always expanded)', () => {
    const w = mount(DtprDatachain, {
      props: { sections, disableAccordion: true },
    })
    expect(w.findAll('button.dtpr-category-section__header')).toHaveLength(0)
    const panels = w.findAll('.dtpr-category-section__panel')
    for (const p of panels) expect(p.attributes('hidden')).toBeUndefined()
  })

  it('renders scoped slot content per section', () => {
    const w = mount(DtprDatachain, {
      props: { sections },
      slots: {
        'section-a': '<span class="sa">SLOT A</span>',
        'section-b': '<span class="sb">SLOT B</span>',
      },
    })
    expect(w.get('.sa').text()).toBe('SLOT A')
    expect(w.get('.sb').text()).toBe('SLOT B')
  })
})
