import { describe, it, expect } from 'vitest'
import MiniSearch from 'minisearch'
import { buildSearchIndex, serializeIndex } from '../../cli/lib/search-index-builder.ts'
import type { Element } from '../../src/schema/element.ts'

const icon = () => ({
  url: '/dtpr-icons/foo.svg',
  format: 'svg',
  alt_text: [{ locale: 'en' as const, value: 'icon' }],
})

const elements: Element[] = [
  {
    id: 'facial_recognition',
    category_ids: ['ai__input_dataset'],
    title: [{ locale: 'en', value: 'Facial recognition' }],
    description: [{ locale: 'en', value: 'Video camera identifies people.' }],
    citation: [],
    icon: icon(),
    variables: [],
  },
  {
    id: 'accept_deny',
    category_ids: ['ai__decision'],
    title: [{ locale: 'en', value: 'Accept or deny' }],
    description: [{ locale: 'en', value: 'Binary yes/no decision.' }],
    citation: [],
    icon: icon(),
    variables: [],
  },
]

describe('buildSearchIndex', () => {
  it('finds an element by a word in its title', () => {
    const index = buildSearchIndex(elements, 'en')
    const results = index.search('facial')
    expect(results[0]?.id).toBe('facial_recognition')
  })

  it('finds an element by a word in its description', () => {
    const index = buildSearchIndex(elements, 'en')
    const results = index.search('binary')
    expect(results[0]?.id).toBe('accept_deny')
  })

  it('title boost ranks title matches above description matches', () => {
    const moreElements: Element[] = [
      ...elements,
      {
        id: 'decision_log',
        category_ids: ['ai__decision'],
        title: [{ locale: 'en', value: 'Decision log' }],
        description: [{ locale: 'en', value: 'Record of past decisions.' }],
        citation: [],
        icon: icon(),
        variables: [],
      },
      {
        id: 'retention_schedule',
        category_ids: ['ai__storage'],
        title: [{ locale: 'en', value: 'Retention schedule' }],
        description: [{ locale: 'en', value: 'How long decision metadata persists.' }],
        citation: [],
        icon: icon(),
        variables: [],
      },
    ]
    const index = buildSearchIndex(moreElements, 'en')
    const results = index.search('decision')
    // 'Decision log' has "decision" in title and 'decisions' in description — the
    // one with title match should win by the 3× title boost.
    expect(results[0]?.id).toBe('decision_log')
  })
})

describe('serializeIndex', () => {
  it('round-trips through MiniSearch.loadJSON', () => {
    const index = buildSearchIndex(elements, 'en')
    const serialized = serializeIndex(index)
    const rehydrated = MiniSearch.loadJSON(serialized, {
      fields: ['title', 'description'],
      storeFields: ['id', 'title', 'category_ids'],
    })
    expect(rehydrated.search('facial')[0]?.id).toBe('facial_recognition')
  })
})
