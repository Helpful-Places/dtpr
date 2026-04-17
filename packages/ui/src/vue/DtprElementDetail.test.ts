import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DtprElementDetail from './DtprElementDetail.vue'
import type { ElementDisplay, ElementDisplayVariable } from '../core/index.js'

function makeVar(overrides: Partial<ElementDisplayVariable> = {}): ElementDisplayVariable {
  return {
    id: 'retention_period',
    label: 'Retention period',
    value: '30 days',
    type: 'text',
    required: false,
    ...overrides,
  }
}

function makeDisplay(overrides: Partial<ElementDisplay> = {}): ElementDisplay {
  return {
    title: 'Cloud storage',
    description: 'Data held for {{retention_period}}.',
    icon: { url: '/icons/cloud.svg', alt: 'Cloud' },
    variables: [makeVar()],
    citation: 'See RFC 1234',
    ...overrides,
  }
}

describe('DtprElementDetail', () => {
  it('renders title, description (interpolated), variables list, and citation', () => {
    const w = mount(DtprElementDetail, { props: { display: makeDisplay() } })
    expect(w.text()).toContain('Cloud storage')
    expect(w.text()).toContain('Data held for')
    expect(w.text()).toContain('30 days')
    expect(w.text()).toContain('Retention period')
    expect(w.text()).toContain('See RFC 1234')
  })

  it('highlights variable segments in the plain-text description path', () => {
    const w = mount(DtprElementDetail, { props: { display: makeDisplay() } })
    const highlight = w.get('.dtpr-variable-highlight')
    expect(highlight.text()).toBe('30 days')
    expect(highlight.attributes('data-variable-id')).toBe('retention_period')
  })

  it('marks missing variable placeholders in the description', () => {
    const display = makeDisplay({
      variables: [makeVar({ value: '' })],
    })
    const w = mount(DtprElementDetail, { props: { display } })
    const missing = w.get('.dtpr-variable-missing')
    expect(missing.text()).toBe('{{retention_period}}')
  })

  it('renders descriptionHtml via v-html WITHOUT sanitizing (explicit trust boundary)', () => {
    // Security contract: library does not sanitize descriptionHtml. This test
    // proves the boundary is explicit — callers MUST sanitize upstream.
    const display = makeDisplay({ variables: [] })
    const w = mount(DtprElementDetail, {
      props: {
        display,
        descriptionHtml: '<p>Safe</p><script data-evil="1">x</script>',
      },
    })
    // Inspect the description container directly (raw innerHTML bypasses
    // happy-dom's pretty-printing in outerHTML serialization).
    const desc = w.get('.dtpr-element-detail__description')
    expect(desc.element.innerHTML).toContain('<script data-evil="1">x</script>')
    expect(desc.find('script').exists()).toBe(true)
  })

  it('the plain-text description path escapes HTML via Vue default text interpolation', () => {
    const display = makeDisplay({
      description: '<script>alert(1)</script>',
      variables: [],
    })
    const w = mount(DtprElementDetail, { props: { display } })
    // Vue escapes text nodes. Rendered HTML should contain the encoded form,
    // not a live script tag.
    expect(w.html()).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(w.html()).not.toContain('<script>alert(1)')
  })

  it('renders inline warning with role="alert" for required variables with empty values', () => {
    const display = makeDisplay({
      variables: [makeVar({ value: '', required: true })],
    })
    const w = mount(DtprElementDetail, { props: { display } })
    const warn = w.get('[role="alert"]')
    expect(warn.text()).toContain('Retention period')
  })

  it('does not render a warning when required vars have values', () => {
    const w = mount(DtprElementDetail, {
      props: { display: makeDisplay({ variables: [makeVar({ required: true })] }) },
    })
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })

  it('#overlay slot replaces default icon + title header content', () => {
    const w = mount(DtprElementDetail, {
      props: { display: makeDisplay() },
      slots: { overlay: '<div class="custom-overlay">OVER</div>' },
    })
    expect(w.get('.custom-overlay').text()).toBe('OVER')
    // Default <h2> should be gone when overlay slot is used.
    expect(w.find('h2.dtpr-element-detail__title').exists()).toBe(false)
  })

  it('#after-description, #after-variables, #after-citation slots render in order', () => {
    const w = mount(DtprElementDetail, {
      props: { display: makeDisplay() },
      slots: {
        'after-description': '<div data-test="after-desc">AD</div>',
        'after-variables': '<div data-test="after-vars">AV</div>',
        'after-citation': '<div data-test="after-cite">AC</div>',
      },
    })
    const html = w.html()
    const i1 = html.indexOf('after-desc')
    const i2 = html.indexOf('after-vars')
    const i3 = html.indexOf('after-cite')
    expect(i1).toBeGreaterThan(-1)
    expect(i2).toBeGreaterThan(i1)
    expect(i3).toBeGreaterThan(i2)
  })

  describe('variable-type rendering', () => {
    it('url with https://... renders as anchor with rel noopener noreferrer', () => {
      const display = makeDisplay({
        variables: [makeVar({ id: 'link', label: 'Link', value: 'https://example.com', type: 'url' })],
      })
      const w = mount(DtprElementDetail, { props: { display } })
      const a = w.get('a.dtpr-variable-url')
      expect(a.attributes('href')).toBe('https://example.com')
      expect(a.attributes('rel')).toBe('noopener noreferrer')
      expect(a.attributes('target')).toBe('_blank')
    })

    it('url with javascript: scheme falls back to text rendering (XSS guard)', () => {
      const display = makeDisplay({
        variables: [
          makeVar({ id: 'xss', label: 'X', value: 'javascript:alert(1)', type: 'url' }),
        ],
      })
      const w = mount(DtprElementDetail, { props: { display } })
      expect(w.find('a.dtpr-variable-url').exists()).toBe(false)
      const textSpan = w.get('.dtpr-element-detail__variable .dtpr-variable-value')
      expect(textSpan.text()).toBe('javascript:alert(1)')
    })

    it('boolean renders as <span data-value="true|false">', () => {
      const display = makeDisplay({
        variables: [
          makeVar({ id: 'b1', label: 'On', value: 'true', type: 'boolean' }),
          makeVar({ id: 'b2', label: 'Off', value: 'false', type: 'boolean' }),
        ],
      })
      const w = mount(DtprElementDetail, { props: { display, yesNoLabels: { yes: 'Yes', no: 'No' } } })
      const spans = w.findAll('span.dtpr-variable-bool')
      expect(spans).toHaveLength(2)
      expect(spans[0]!.attributes('data-value')).toBe('true')
      expect(spans[0]!.text()).toBe('Yes')
      expect(spans[1]!.attributes('data-value')).toBe('false')
      expect(spans[1]!.text()).toBe('No')
    })

    it('number renders via Intl.NumberFormat with provided locale', () => {
      const display = makeDisplay({
        variables: [makeVar({ id: 'n', label: 'N', value: '1234567', type: 'number' })],
      })
      const w = mount(DtprElementDetail, { props: { display, locale: 'en-US' } })
      const span = w.get('span.dtpr-variable-number')
      // en-US uses comma grouping.
      expect(span.text()).toBe('1,234,567')
    })

    it('date renders as <time datetime="..."> with formatted body', () => {
      const display = makeDisplay({
        variables: [makeVar({ id: 'd', label: 'D', value: '2025-01-15', type: 'date' })],
      })
      const w = mount(DtprElementDetail, { props: { display, locale: 'en-US' } })
      const t = w.get('time.dtpr-variable-date')
      expect(t.attributes('datetime')).toBe('2025-01-15')
      // Intl output varies but must contain something date-like.
      expect(t.text().length).toBeGreaterThan(0)
    })

    it('unknown type falls back to text with data-dtpr-unknown-type attribute', () => {
      const display = makeDisplay({
        variables: [
          {
            id: 'u',
            label: 'U',
            value: 'hey',
            type: 'mystery' as unknown as 'text',
            required: false,
          },
        ],
      })
      const w = mount(DtprElementDetail, { props: { display } })
      const span = w.get('[data-dtpr-unknown-type]')
      expect(span.attributes('data-dtpr-unknown-type')).toBe('mystery')
      expect(span.text()).toBe('hey')
    })
  })
})
