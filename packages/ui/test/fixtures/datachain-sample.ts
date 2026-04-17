import type { ElementDisplay } from '../../src/core/types.js'
import type { RenderedSection } from '../../src/html/document.js'
import { CATEGORIES_SAMPLE } from './categories-sample.js'

function display(title: string, description: string): ElementDisplay {
  return {
    title,
    description,
    icon: { url: '/icons/sample.svg', alt: `icon for ${title}` },
    variables: [],
    citation: '',
  }
}

// Canonical sections for a valid datachain rendered against the
// ai@2026-04-16-beta schema version. The section ids follow the
// `ai__<category_id>` deep-link convention so consumers can link
// straight into a section.
export const SECTIONS_SAMPLE: readonly RenderedSection[] = CATEGORIES_SAMPLE.map((c) => ({
  id: `ai__${c.id}`,
  title: c.name[0]?.value ?? c.id,
  elements: [
    display(`Element 1 in ${c.id}`, `Description for element 1 of ${c.id}.`),
    display(`Element 2 in ${c.id}`, `Description for element 2 of ${c.id}.`),
  ],
}))

export const SCHEMA_VERSION = 'ai@2026-04-16-beta'
