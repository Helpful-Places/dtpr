import { describe, it, expect } from 'vitest'
import { renderDatachainDocument } from '../src/html/document.js'
import { SECTIONS_SAMPLE } from './fixtures/datachain-sample.js'

describe('Unit 7 — document shell smoke test (Path B)', () => {
  it('renders a stable document for the canonical fixture', async () => {
    const html = await renderDatachainDocument(SECTIONS_SAMPLE)
    expect(html).toMatchSnapshot()
  })

  it('emits exactly one <!doctype html>, one <style>, one <script>', async () => {
    const html = await renderDatachainDocument(SECTIONS_SAMPLE)
    expect((html.match(/<!doctype html>/gi) ?? []).length).toBe(1)
    expect((html.match(/<style>/g) ?? []).length).toBe(1)
    expect((html.match(/<script>/g) ?? []).length).toBe(1)
  })

  it('ARIA parity: every section has <button aria-expanded aria-controls> + region panel', async () => {
    const html = await renderDatachainDocument(SECTIONS_SAMPLE)
    const buttons = html.match(/<button[^>]*aria-expanded="[^"]*"[^>]*aria-controls="[^"]*"[^>]*data-dtpr-collapsible/g) ?? []
    expect(buttons.length).toBe(SECTIONS_SAMPLE.length)
    const panels = html.match(/role="region"/g) ?? []
    expect(panels.length).toBe(SECTIONS_SAMPLE.length)
    const labeled = html.match(/aria-labelledby="[^"]+"/g) ?? []
    expect(labeled.length).toBe(SECTIONS_SAMPLE.length)
  })

  it('deep-link parity: every section wraps in an element whose id matches ai__<category_id>', async () => {
    const html = await renderDatachainDocument(SECTIONS_SAMPLE)
    for (const section of SECTIONS_SAMPLE) {
      expect(html).toContain(`id="${section.id}"`)
      expect(section.id).toMatch(/^ai__[a-z0-9_-]+$/)
    }
  })

  it('empty fixture renders the empty-state placeholder and no sections', async () => {
    const html = await renderDatachainDocument([])
    expect(html).toContain('class="dtpr-empty"')
    expect(html).toContain('role="status"')
    expect(html).not.toMatch(/<button[^>]*data-dtpr-collapsible/)
  })
})
