// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { renderDatachainDocument } from './document.js'
import type { RenderedSection } from './document.js'

function sample(): RenderedSection[] {
  return [
    { id: 'a', title: 'A', elements: [] },
    { id: 'b', title: 'B', elements: [] },
  ]
}

async function mountDoc(): Promise<{ button: HTMLButtonElement; panel: HTMLElement }> {
  const html = await renderDatachainDocument(sample())
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const srcScript = doc.querySelector('script')?.textContent
  if (!srcScript) throw new Error('no script found in rendered doc')
  document.documentElement.innerHTML = doc.documentElement.innerHTML
  const f = new Function(srcScript)
  f()
  const button = document.querySelector<HTMLButtonElement>('[data-dtpr-collapsible]')
  const firstId = button?.getAttribute('aria-controls') ?? ''
  const panel = document.getElementById(firstId) as HTMLElement
  return { button: button!, panel }
}

describe('rendered document accordion script', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = ''
  })

  it('toggles aria-expanded and hidden on click', async () => {
    const { button, panel } = await mountDoc()
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(panel.hasAttribute('hidden')).toBe(true)
    button.click()
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(panel.hasAttribute('hidden')).toBe(false)
    button.click()
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(panel.hasAttribute('hidden')).toBe(true)
  })

  it('ignores clicks outside [data-dtpr-collapsible]', async () => {
    const { button, panel } = await mountDoc()
    const other = document.createElement('div')
    document.body.appendChild(other)
    other.click()
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(panel.hasAttribute('hidden')).toBe(true)
  })

  it('toggles on Space key', async () => {
    const { button, panel } = await mountDoc()
    button.focus()
    button.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(panel.hasAttribute('hidden')).toBe(false)
  })
})
