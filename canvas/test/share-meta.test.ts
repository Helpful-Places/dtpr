import { describe, it, expect } from 'vitest'
import { buildCanvasMeta } from '../app/utils/share-meta'

describe('buildCanvasMeta (U7)', () => {
  const head = buildCanvasMeta({
    title: 'Face-matching fare gates',
    description: 'Metro Transit runs face-matching gates…',
    url: 'https://canvas.dtpr.ai/s/face-gates',
  })

  const byProp = (p: string) => head.meta.find(m => m.property === p)?.content
  const byName = (n: string) => head.meta.find(m => m.name === n)?.content

  it('sets the document title', () => {
    expect(head.title).toBe('Face-matching fare gates')
  })

  it('emits OG title / description / url for the canvas', () => {
    expect(byProp('og:title')).toBe('Face-matching fare gates')
    expect(byProp('og:description')).toBe('Metro Transit runs face-matching gates…')
    expect(byProp('og:url')).toBe('https://canvas.dtpr.ai/s/face-gates')
    expect(byProp('og:type')).toBe('article')
  })

  it('emits Twitter card meta (summary without an image)', () => {
    expect(byName('twitter:card')).toBe('summary')
    expect(byName('twitter:title')).toBe('Face-matching fare gates')
  })

  it('adds a canonical link to the deep-link url', () => {
    expect(head.link).toEqual([{ rel: 'canonical', href: 'https://canvas.dtpr.ai/s/face-gates' }])
  })

  it('upgrades to summary_large_image when an image is provided', () => {
    const withImg = buildCanvasMeta({ title: 'x', description: 'y', url: 'u', image: 'https://img' })
    expect(withImg.meta.find(m => m.name === 'twitter:card')?.content).toBe('summary_large_image')
    expect(withImg.meta.find(m => m.property === 'og:image')?.content).toBe('https://img')
  })
})
