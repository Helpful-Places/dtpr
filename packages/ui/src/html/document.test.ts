import { describe, it, expect } from 'vitest'
import { renderDatachainDocument, type RenderedSection } from './document.js'
import type { ElementDisplay } from '../core/types.js'

function makeDisplay(title: string): ElementDisplay {
  return {
    title,
    description: 'desc',
    icon: { url: '/i.svg', alt: `alt for ${title}` },
    variables: [],
    citation: '',
  }
}

function sampleSections(count: number, perSection: number): RenderedSection[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: `ai__cat_${i}`,
    title: `Category ${i}`,
    elements: Array.from({ length: perSection }).map((__, j) => makeDisplay(`Element ${i}.${j}`)),
  }))
}

describe('renderDatachainDocument', () => {
  it('returns a full HTML document', async () => {
    const html = await renderDatachainDocument(sampleSections(2, 1))
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html.endsWith('</html>')).toBe(true)
    expect(html).toContain('<html lang="en">')
    expect(html).toContain('<meta charset="utf-8">')
  })

  it('emits exactly one <style> and one <script>', async () => {
    const html = await renderDatachainDocument(sampleSections(10, 3))
    const styleCount = (html.match(/<style>/g) ?? []).length
    const scriptCount = (html.match(/<script>/g) ?? []).length
    expect(styleCount).toBe(1)
    expect(scriptCount).toBe(1)
  })

  it('includes the rendered DtprDatachain in the body', async () => {
    const html = await renderDatachainDocument(sampleSections(1, 2))
    expect(html).toContain('dtpr-datachain')
    expect(html).toContain('ai__cat_0')
    expect(html).toContain('Category 0')
    expect(html).toContain('Element 0.0')
  })

  it('emits a button with aria-expanded + data-dtpr-collapsible per section', async () => {
    const html = await renderDatachainDocument(sampleSections(3, 0))
    const buttonOpens = (html.match(/<button[^>]*data-dtpr-collapsible/g) ?? []).length
    expect(buttonOpens).toBe(3)
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('aria-controls=')
  })

  it('escapes XSS in a section title', async () => {
    const html = await renderDatachainDocument([
      {
        id: 'ai__x',
        title: "<script>alert('x')</script>",
        elements: [],
      },
    ])
    expect(html).not.toContain("<script>alert('x')</script>")
    expect(html).toMatch(/&lt;script&gt;alert\(/)
  })

  it('escapes XSS in the document title option', async () => {
    const html = await renderDatachainDocument([], { title: '<img src=x onerror=1>' })
    expect(html).not.toContain('<img src=x onerror=1>')
    expect(html).toContain('&lt;img src=x onerror=1&gt;')
  })

  it('renders an empty-state placeholder when no sections are provided', async () => {
    const html = await renderDatachainDocument([])
    expect(html).toContain('class="dtpr-empty"')
    expect(html).toContain('role="status"')
  })

  it('honors custom locale in <html lang>', async () => {
    const html = await renderDatachainDocument(sampleSections(1, 1), { locale: 'pt' })
    expect(html).toContain('<html lang="pt">')
  })

  // Soft ceiling. Unit 0.5 measured p99 ~10ms in workerd for the same
  // 30-element fixture; Node + happy-dom is comparatively slower, so this
  // threshold is a regression guard, not the production SLA.
  it('performance smoke: p99 stays under 300ms in Node on a 30-element fixture', async () => {
    const fixture = sampleSections(10, 3)
    const iterations = 50
    const times: number[] = []
    for (let i = 0; i < iterations; i++) {
      const t0 = performance.now()
      await renderDatachainDocument(fixture)
      times.push(performance.now() - t0)
    }
    times.sort((a, b) => a - b)
    const idx = Math.floor(times.length * 0.99)
    const p99 = times[idx] ?? times[times.length - 1]!
    expect(p99).toBeLessThan(300)
  })
})
