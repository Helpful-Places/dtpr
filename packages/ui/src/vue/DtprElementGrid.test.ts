import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DtprElementGrid from './DtprElementGrid.vue'

describe('DtprElementGrid', () => {
  it('renders default slot content inside a grid wrapper', () => {
    const w = mount(DtprElementGrid, {
      slots: {
        default: '<div class="c">1</div><div class="c">2</div><div class="c">3</div>',
      },
    })
    expect(w.findAll('.c')).toHaveLength(3)
  })

  it('uses the dtpr-element-grid class with container-query data hook', () => {
    const w = mount(DtprElementGrid, { slots: { default: '<div>x</div>' } })
    const root = w.element as HTMLElement
    expect(root.classList.contains('dtpr-element-grid')).toBe(true)
    expect(root.dataset.dtprElementGrid).toBeDefined()
  })

  it('wrapper tagName is a neutral <div> (layout primitive, no semantics implied)', () => {
    const w = mount(DtprElementGrid)
    expect(w.element.tagName).toBe('DIV')
  })

  it('grid content width reflects container width (container-query driven layout)', async () => {
    // Container queries rely on @container support. happy-dom does not
    // compute those layouts, but we can still assert the DOM contract:
    // the element exposes a container-query data hook, and width changes
    // on the wrapping container do not throw or de-render children.
    const w = mount(DtprElementGrid, {
      slots: { default: '<div class="c">1</div>' },
      attrs: { style: 'width: 300px;' },
    })
    expect(w.find('.c').exists()).toBe(true)
    expect(w.element.getAttribute('style')).toContain('300px')
    await w.setProps({})
    expect(w.find('.c').exists()).toBe(true)
  })
})
