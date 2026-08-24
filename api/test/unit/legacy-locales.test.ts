import { describe, it, expect } from 'vitest'
import {
  filterLegacyCategoriesDocument,
  filterLegacyElementsDocument,
  parseLegacyLocalesQuery,
  type LegacyCategoryRecord,
  type LegacyElementRecord,
} from '../../src/rest/legacy-locales.ts'
import { parseLocalesParam } from '../../src/rest/responses.ts'

/**
 * U4: the ported legacy `?locales=` parser and filter.
 *
 * These are unit tests over the two halves of `legacy-locales.ts`. The
 * byte-level specification — the 36 captured `?locales=` variants —
 * lives in `test/api/legacy-v1.test.ts`, because what has to be
 * byte-equal is the *served* response, not an intermediate value. What
 * is pinned here is the behaviour those bytes cannot show on their own:
 * the parser's quirks against inputs the capture never exercised, the
 * fact that no branch of the filter ever drops a record, and the
 * TypeError that is R10's root cause.
 */

describe('parseLegacyLocalesQuery: the legacy parser, verbatim (KTD2)', () => {
  it('treats an absent parameter as "no filter"', () => {
    expect(parseLegacyLocalesQuery(undefined)).toBeNull()
  })

  it('treats an empty value as "no filter" — `?locales=` and bare `?locales`', () => {
    // Hono hands both shapes over as `['']`; the legacy guard is a
    // plain falsiness check, so an empty string means the full body.
    expect(parseLegacyLocalesQuery([''])).toBeNull()
  })

  it('splits a single value on commas', () => {
    expect(parseLegacyLocalesQuery(['en'])).toEqual(['en'])
    expect(parseLegacyLocalesQuery(['en,fr'])).toEqual(['en', 'fr'])
  })

  it('does NOT split when the value arrives as repeated parameters', () => {
    // The legacy branch returns the array untouched, so a repeated
    // parameter whose value itself contains a comma keeps the comma.
    expect(parseLegacyLocalesQuery(['en', 'fr'])).toEqual(['en', 'fr'])
    expect(parseLegacyLocalesQuery(['en,fr', 'km'])).toEqual(['en,fr', 'km'])
  })

  it('does not trim whitespace: `en, fr` yields a space-prefixed entry', () => {
    expect(parseLegacyLocalesQuery(['en, fr'])).toEqual(['en', ' fr'])
  })

  it('does not collapse an all-empty split: `,,,` is four empty locales', () => {
    // The subtlety KTD2 exists for. `,,,` is a non-empty string, so it
    // passes the falsiness guard, and then matches no locale at all.
    expect(parseLegacyLocalesQuery([',,,'])).toEqual(['', '', '', ''])
  })

  it('keeps repeated empty values, because an array is always truthy', () => {
    expect(parseLegacyLocalesQuery(['', ''])).toEqual(['', ''])
  })

  it('is case-sensitive', () => {
    expect(parseLegacyLocalesQuery(['EN'])).toEqual(['EN'])
  })

  it('disagrees with the house parser exactly where KTD2 says it does', () => {
    // Not a redundant restatement: this is the assertion that fails if
    // someone "simplifies" the legacy module onto `parseLocalesParam`.
    expect(parseLocalesParam('en, fr')).toEqual(new Set(['en', 'fr']))
    expect(parseLegacyLocalesQuery(['en, fr'])).toEqual(['en', ' fr'])

    expect(parseLocalesParam(',,,')).toBeNull()
    expect(parseLegacyLocalesQuery([',,,'])).toEqual(['', '', '', ''])
  })
})

/* ------------------------------------------------------------------ *
 * Filter fixtures — a two-record stand-in for each document family,
 * carrying every field the legacy handlers filter plus a few they do
 * not touch.
 * ------------------------------------------------------------------ */

const ELEMENTS_DOCUMENT = JSON.stringify([
  {
    schema: { name: 'DTPR Element', id: 'dtpr_element', version: '0.2' },
    element: {
      id: 'first',
      category_ids: ['ai__access', 'device__access'],
      version: '2025-08-29T00:00:00Z',
      icon: {
        url: '/api/v1/icons/first.svg',
        alt_text: [
          { locale: 'en', value: 'First icon' },
          { locale: 'fr', value: 'Première icône' },
        ],
        format: 'svg',
      },
      title: [
        { locale: 'en', value: 'First' },
        { locale: 'fr', value: 'Première' },
      ],
      description: [
        { locale: 'en', value: 'The first' },
        { locale: 'fr', value: 'La première' },
      ],
      citation: [
        { locale: 'en', value: 'Cited' },
        { locale: 'fr', value: 'Cité' },
      ],
      variables: [
        {
          id: 'additional_description',
          label: [
            { locale: 'en', value: 'Description' },
            { locale: 'fr', value: 'Description' },
          ],
          required: false,
        },
      ],
    },
  },
  {
    schema: { name: 'DTPR Element', id: 'dtpr_element', version: '0.2' },
    element: {
      id: 'second',
      category_ids: [],
      version: '2025-08-29T00:00:00Z',
      icon: { url: '', alt_text: [{ locale: 'fr', value: 'Deuxième icône' }], format: 'svg' },
      title: [{ locale: 'fr', value: 'Deuxième' }],
      description: [{ locale: 'fr', value: 'La deuxième' }],
      citation: [],
      variables: [],
    },
  },
])

const CATEGORIES_DOCUMENT = JSON.stringify([
  {
    schema: { name: 'DTPR Category', id: 'dtpr_category', version: '0.2' },
    category: {
      id: 'ai__access',
      order: 1,
      required: false,
      name: [
        { locale: 'en', value: 'Access' },
        { locale: 'fr', value: 'Accéder' },
      ],
      description: [
        { locale: 'en', value: 'Data access' },
        { locale: 'fr', value: 'Accès aux données' },
      ],
      prompt: [
        { locale: 'en', value: 'Who can see it?' },
        { locale: 'fr', value: 'Qui peut le voir?' },
      ],
      version: '2025-08-29T00:00:00Z',
      element_variables: [
        {
          id: 'retention_period',
          label: [
            { locale: 'en', value: 'Retention period' },
            { locale: 'fr', value: 'Durée de conservation' },
          ],
          required: false,
        },
      ],
      context: {
        id: 'purpose',
        name: [
          { locale: 'en', value: 'Purpose' },
          { locale: 'fr', value: 'But' },
        ],
        description: [
          { locale: 'en', value: 'Why' },
          { locale: 'fr', value: 'Pourquoi' },
        ],
        values: [
          {
            id: 'safety',
            name: [
              { locale: 'en', value: 'Safety' },
              { locale: 'fr', value: 'Sécurité' },
            ],
            description: [
              { locale: 'en', value: 'Keeping people safe' },
              { locale: 'fr', value: 'Protéger les gens' },
            ],
            color: '#123456',
          },
        ],
      },
    },
  },
  {
    schema: { name: 'DTPR Category', id: 'dtpr_category', version: '0.2' },
    category: {
      id: 'device__access',
      order: null,
      required: false,
      name: [{ locale: 'fr', value: 'Accéder' }],
      description: [{ locale: 'fr', value: 'Accès aux données' }],
      prompt: [],
      version: '2025-08-29T00:00:00Z',
      element_variables: [],
    },
  },
])

/**
 * Read a filtered document back. The record types come from the module
 * under test because they describe the frozen capture, which is the
 * one shape both sides genuinely share.
 */
function elements(locales: string[]): LegacyElementRecord[] {
  const filtered = filterLegacyElementsDocument(ELEMENTS_DOCUMENT, locales)
  return JSON.parse(filtered) as LegacyElementRecord[]
}

function categories(locales: string[]): LegacyCategoryRecord[] {
  const filtered = filterLegacyCategoriesDocument(CATEGORIES_DOCUMENT, locales)
  return JSON.parse(filtered) as LegacyCategoryRecord[]
}

describe('filterLegacyElementsDocument', () => {
  it('filters every locale array the legacy element handler filtered', () => {
    const element = elements(['en'])[0]!.element
    expect(element.title).toEqual([{ locale: 'en', value: 'First' }])
    expect(element.description).toEqual([{ locale: 'en', value: 'The first' }])
    expect(element.icon.alt_text).toEqual([{ locale: 'en', value: 'First icon' }])
    expect(element.citation).toEqual([{ locale: 'en', value: 'Cited' }])
    expect(element.variables[0]!.label).toEqual([{ locale: 'en', value: 'Description' }])
  })

  it('never changes which records appear, even when nothing matches (R3, AE2)', () => {
    for (const locales of [['en'], ['zz'], ['EN'], ['', '', '', '']]) {
      const records = elements(locales)
      expect(records.map((record) => record.element.id)).toEqual(['first', 'second'])
    }
  })

  it('leaves records present with empty locale arrays for an absent locale (AE2)', () => {
    const element = elements(['zz'])[0]!.element
    expect(element.title).toEqual([])
    expect(element.description).toEqual([])
    expect(element.icon.alt_text).toEqual([])
    expect(element.variables[0]!.label).toEqual([])
  })

  it('is case-sensitive: `EN` empties everything', () => {
    expect(elements(['EN'])[0]!.element.title).toEqual([])
  })

  it('leaves non-localized fields untouched', () => {
    const first = elements(['en'])[0]!
    expect(first.schema).toEqual({ name: 'DTPR Element', id: 'dtpr_element', version: '0.2' })
    expect(first.element.category_ids).toEqual(['ai__access', 'device__access'])
    expect(first.element.version).toBe('2025-08-29T00:00:00Z')
    expect(first.element.icon.url).toBe('/api/v1/icons/first.svg')
    expect(first.element.icon.format).toBe('svg')
    expect(first.element.variables[0]!.id).toBe('additional_description')
    expect(first.element.variables[0]!.required).toBe(false)
  })

  it('preserves key order, which byte-identity depends on', () => {
    const first = elements(['en'])[0]!
    expect(Object.keys(first)).toEqual(['schema', 'element'])
    expect(Object.keys(first.element)).toEqual([
      'id',
      'category_ids',
      'version',
      'icon',
      'title',
      'description',
      'citation',
      'variables',
    ])
    expect(Object.keys(first.element.icon)).toEqual(['url', 'alt_text', 'format'])
  })

  it('re-serialises with default separators — no spaces, no indentation', () => {
    const out = filterLegacyElementsDocument(ELEMENTS_DOCUMENT, ['en'])
    expect(out.startsWith('[{"schema":{"name":"DTPR Element"')).toBe(true)
    expect(out).not.toContain('\n')
    expect(out).not.toContain(': ')
  })

  it('throws on a variable with no label — this is R10’s root cause', () => {
    // `/api/v1/elements` (untyped) emitted variables shaped
    // `{id, type, required, default}` with no `label` key, and the
    // handler then called `.filter()` on it. That TypeError is what
    // h3 rendered as the captured 500. `legacy-v1.ts` must therefore
    // answer 500 *without* routing the untyped document through here;
    // this assertion is what fails if the guard is ever removed.
    const malformed = JSON.stringify([
      {
        schema: {},
        element: {
          id: 'x',
          category_ids: [],
          version: '',
          icon: { url: '', alt_text: [], format: 'svg' },
          title: [],
          description: [],
          citation: [],
          variables: [{ id: 'additional_description', type: 'string', required: true, default: '' }],
        },
      },
    ])
    expect(() => filterLegacyElementsDocument(malformed, ['en'])).toThrow(TypeError)
  })
})

describe('filterLegacyCategoriesDocument', () => {
  it('filters every locale array the legacy category handler filtered', () => {
    const category = categories(['en'])[0]!.category
    expect(category.name).toEqual([{ locale: 'en', value: 'Access' }])
    expect(category.description).toEqual([{ locale: 'en', value: 'Data access' }])
    expect(category.prompt).toEqual([{ locale: 'en', value: 'Who can see it?' }])
    expect(category.element_variables[0]!.label).toEqual([
      { locale: 'en', value: 'Retention period' },
    ])
    const context = category.context!
    expect(context.name).toEqual([{ locale: 'en', value: 'Purpose' }])
    expect(context.description).toEqual([{ locale: 'en', value: 'Why' }])
    expect(context.values[0]!.name).toEqual([{ locale: 'en', value: 'Safety' }])
    expect(context.values[0]!.description).toEqual([
      { locale: 'en', value: 'Keeping people safe' },
    ])
  })

  it('never changes which records appear, nor their order (R3)', () => {
    for (const locales of [['en'], ['zz'], ['', '', '', '']]) {
      const records = categories(locales)
      expect(records.map((record) => record.category.id)).toEqual([
        'ai__access',
        'device__access',
      ])
    }
  })

  it('leaves non-localized fields untouched', () => {
    const [first, second] = categories(['en'])
    expect(first!.category.order).toBe(1)
    expect(first!.category.required).toBe(false)
    expect(first!.category.version).toBe('2025-08-29T00:00:00Z')
    expect(first!.category.element_variables[0]!.id).toBe('retention_period')
    expect(first!.category.context!.id).toBe('purpose')
    expect(first!.category.context!.values[0]!.color).toBe('#123456')
    expect(second!.category.order).toBeNull()
  })

  it('preserves key order, including the trailing optional context', () => {
    const [first, second] = categories(['en'])
    expect(Object.keys(first!.category)).toEqual([
      'id',
      'order',
      'required',
      'name',
      'description',
      'prompt',
      'version',
      'element_variables',
      'context',
    ])
    // A record with no `context` does not grow one.
    expect(Object.keys(second!.category)).not.toContain('context')
  })

  it('leaves an already-empty prompt and element_variables alone', () => {
    const [, second] = categories(['zz'])
    expect(second!.category.prompt).toEqual([])
    expect(second!.category.element_variables).toEqual([])
    expect(second!.category.name).toEqual([])
  })

  it('re-serialises with default separators', () => {
    const out = filterLegacyCategoriesDocument(CATEGORIES_DOCUMENT, ['en'])
    expect(out).not.toContain('\n')
    expect(out).not.toContain(': ')
  })
})
