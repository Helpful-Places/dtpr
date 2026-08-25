import { describe, expect, it } from 'vitest'
import { shouldLocalizePath } from '../app/utils/content-links'

const LOCALES = ['en', 'fr']
const localize = (href: string) => shouldLocalizePath(href, LOCALES)

describe('shouldLocalizePath', () => {
  it('localizes bare content routes', () => {
    expect(localize('/icons/urls')).toBe(true)
    expect(localize('/mcp/tools/get-schema')).toBe(true)
    expect(localize('/cite')).toBe(true)
  })

  it('keeps anchors on content routes localizable', () => {
    expect(localize('/concepts/datachains#authoring-provenance')).toBe(true)
  })

  it('leaves protocol-qualified and protocol-relative URLs alone', () => {
    expect(localize('https://api.dtpr.io/mcp')).toBe(false)
    expect(localize('mailto:hello@dtpr.io')).toBe(false)
    expect(localize('//cdn.example.com/x')).toBe(false)
  })

  it('does not re-prefix a path that already names a locale', () => {
    expect(localize('/en')).toBe(false)
    expect(localize('/fr/index')).toBe(false)
  })

  it('leaves static assets under public/ unprefixed', () => {
    // These 404 when prefixed — they are served from the site root.
    expect(localize('/skills/manifest.json')).toBe(false)
    expect(localize('/skills/0.3.2/dtpr-skills.zip')).toBe(false)
    expect(localize('/skills/0.3.2/dtpr-translate.skill')).toBe(false)
    expect(localize('/figma-plugin/manifest.json')).toBe(false)
    expect(localize('/figma-plugin/0.1.0/dtpr-figma-plugin.zip')).toBe(false)
    expect(localize('/dtpr-for-ai.bib')).toBe(false)
  })

  it('ignores query and hash when spotting an extension', () => {
    expect(localize('/figma-plugin/manifest.json?v=2')).toBe(false)
    expect(localize('/skills/dtpr-skills.zip#sha')).toBe(false)
  })

  it('is false for an empty href', () => {
    expect(localize('')).toBe(false)
  })
})
