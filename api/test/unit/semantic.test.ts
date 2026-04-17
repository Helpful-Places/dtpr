import { describe, it, expect } from 'vitest'
import { validateInstance, validateVersion } from '../../src/validator/index.ts'
import type { SchemaVersionSource } from '../../src/validator/types.ts'
import type { LocaleCode, LocaleValue } from '../../src/schema/locale.ts'

// -------- test fixture helpers --------

const loc = (locale: LocaleCode, value: string): LocaleValue => ({ locale, value })

function baseSource(): SchemaVersionSource {
  return {
    manifest: {
      version: 'ai@2026-04-16-beta',
      status: 'beta',
      created_at: '2026-04-16T00:00:00.000Z',
      notes: '',
      content_hash: `sha256-${'0'.repeat(64)}`,
      locales: ['en', 'es'],
    },
    datachainType: {
      id: 'ai',
      name: [loc('en', 'AI / Algorithm')],
      description: [],
      categories: ['ai__decision', 'ai__storage'],
      locales: ['en', 'es'],
    },
    categories: [
      {
        id: 'ai__decision',
        name: [loc('en', 'Decision Type')],
        description: [loc('en', 'Type of decision.')],
        prompt: [],
        required: true,
        order: 1,
        datachain_type: 'ai',
        shape: 'hexagon',
        element_variables: [],
        context: {
          id: 'level_of_autonomy',
          name: [loc('en', 'Autonomy')],
          description: [loc('en', 'Level of human involvement.')],
          values: [
            {
              id: 'ai_only',
              name: [loc('en', 'AI only')],
              description: [loc('en', 'Fully automated.')],
              color: '#F28C28',
            },
          ],
        },
      },
      {
        id: 'ai__storage',
        name: [loc('en', 'Storage')],
        description: [loc('en', 'Where data is held.')],
        prompt: [],
        required: false,
        order: 2,
        datachain_type: 'ai',
        shape: 'rounded-square',
        element_variables: [
          {
            id: 'retention_period',
            label: [loc('en', 'Retention period')],
            required: true,
          },
        ],
      },
    ],
    elements: [
      {
        id: 'accept_deny',
        category_id: 'ai__decision',
        title: [loc('en', 'Accept or deny')],
        description: [loc('en', 'Binary yes/no decision.')],
        citation: [],
        symbol_id: 'accept_deny',
        variables: [],
      },
      {
        id: 'cloud_storage',
        category_id: 'ai__storage',
        title: [loc('en', 'Cloud storage')],
        description: [loc('en', 'Data held for {{retention_period}}.')],
        citation: [],
        symbol_id: 'cloud',
        variables: [],
      },
    ],
  }
}

// -------- version-level rule tests --------

describe('validateVersion — version-level rules', () => {
  it('happy path: clean source returns ok with no errors', () => {
    const result = validateVersion(baseSource())
    expect(result.ok).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('Rule 1 (category_ref_missing): element references unknown category', () => {
    const src = baseSource()
    src.elements[0]!.category_id = 'ai__phantom'
    const r = validateVersion(src)
    expect(r.errors.some((e) => e.code === 'CATEGORY_REF_MISSING')).toBe(true)
    expect(r.errors[0]?.fix_hint).toBeTruthy()
  })

  it('Rule 2 (datachain_type_mismatch): category has wrong datachain_type', () => {
    const src = baseSource()
    src.categories[0]!.datachain_type = 'device'
    const r = validateVersion(src)
    expect(r.errors.some((e) => e.code === 'DATACHAIN_TYPE_MISMATCH')).toBe(true)
  })

  it('Rule 3 (context_value_duplicate): duplicate value id in context', () => {
    const src = baseSource()
    src.categories[0]!.context!.values.push({
      id: 'ai_only', // duplicate
      name: [loc('en', 'X')],
      description: [loc('en', 'X')],
      color: '#000000',
    })
    const r = validateVersion(src)
    expect(r.errors.some((e) => e.code === 'CONTEXT_VALUE_DUPLICATE')).toBe(true)
  })

  it('Rule 5 (category_duplicate): duplicate category id', () => {
    const src = baseSource()
    src.categories.push({ ...src.categories[0]! })
    const r = validateVersion(src)
    expect(r.errors.some((e) => e.code === 'CATEGORY_DUPLICATE')).toBe(true)
  })

  it('Rule 6 (element_duplicate): duplicate element id', () => {
    const src = baseSource()
    src.elements.push({ ...src.elements[0]! })
    const r = validateVersion(src)
    expect(r.errors.some((e) => e.code === 'ELEMENT_DUPLICATE')).toBe(true)
  })

  it('Rule 8 (variable_ref_missing): unresolved {{var}} reference', () => {
    const src = baseSource()
    src.elements[0]!.description = [loc('en', 'See {{undef_var}} for detail.')]
    const r = validateVersion(src)
    expect(r.errors.some((e) => e.code === 'VARIABLE_REF_MISSING')).toBe(true)
  })

  it('Rule 11 (locale_not_allowed): unknown locale in element title', () => {
    const src = baseSource()
    // Use a locale not in manifest.locales (which is ['en','es'])
    src.elements[0]!.title = [loc('fr', 'X') as any]
    const r = validateVersion(src)
    expect(r.errors.some((e) => e.code === 'LOCALE_NOT_ALLOWED')).toBe(true)
  })

  it('Rule 12 (locale_field_empty): empty title array', () => {
    const src = baseSource()
    src.elements[0]!.title = []
    const r = validateVersion(src)
    expect(r.errors.some((e) => e.code === 'LOCALE_FIELD_EMPTY')).toBe(true)
  })

  it('Rule 13 (context_value_color_invalid): non-hex color', () => {
    const src = baseSource()
    src.categories[0]!.context!.values[0]!.color = 'red'
    const r = validateVersion(src)
    expect(r.errors.some((e) => e.code === 'CONTEXT_VALUE_COLOR_INVALID')).toBe(true)
  })

  // Rule 14 (icon.url/format non-empty) was removed when IconSchema was
  // dropped from ElementSchema. Symbol-ref validation replaces it in a
  // later unit; its absence here is deliberate.

  // Rule 16 (cross-category variable conflict) no longer applies now
  // that `category_id` is singular — an element can only inherit from
  // one category, so there is no conflict to detect.

  it('Rule 17 (category_order_ref_missing): datachain-type references undefined category', () => {
    const src = baseSource()
    src.datachainType.categories = ['ai__decision', 'ai__phantom']
    const r = validateVersion(src)
    expect(r.errors.some((e) => e.code === 'CATEGORY_ORDER_REF_MISSING')).toBe(true)
  })

  it('Rule 17 (category_order_duplicate): datachain-type lists same category twice', () => {
    const src = baseSource()
    src.datachainType.categories = ['ai__decision', 'ai__decision', 'ai__storage']
    const r = validateVersion(src)
    expect(r.errors.some((e) => e.code === 'CATEGORY_ORDER_DUPLICATE')).toBe(true)
  })

  it('Rule 18 (locale_variable_drift): warning-only when non-en locale drops a {{var}}', () => {
    const src = baseSource()
    // Add retention_period to element's inherited vars (already from storage).
    // Put a {{retention_period}} in en and a non-en description that lacks it.
    src.elements[1]!.description = [
      loc('en', 'Data held for {{retention_period}}.'),
      loc('es', 'Datos almacenados.'), // missing the {{var}}
    ]
    const r = validateVersion(src)
    expect(r.ok).toBe(true) // warnings don't fail the build
    expect(r.warnings.some((w) => w.code === 'LOCALE_VARIABLE_DRIFT')).toBe(true)
  })

  it('collects multiple errors in one pass (no short-circuit)', () => {
    const src = baseSource()
    src.elements[0]!.category_id = 'ai__phantom'
    src.elements[1]!.title = []
    src.categories[0]!.context!.values[0]!.color = 'red'
    const r = validateVersion(src)
    const codes = new Set(r.errors.map((e) => e.code))
    expect(codes.has('CATEGORY_REF_MISSING')).toBe(true)
    expect(codes.has('LOCALE_FIELD_EMPTY')).toBe(true)
    expect(codes.has('CONTEXT_VALUE_COLOR_INVALID')).toBe(true)
  })

  it('every error carries a non-empty fix_hint', () => {
    const src = baseSource()
    src.elements[0]!.category_id = 'ai__phantom'
    src.elements[1]!.title = []
    const r = validateVersion(src)
    for (const e of r.errors) {
      expect(e.fix_hint).toBeTruthy()
      expect(e.fix_hint!.length).toBeGreaterThan(5)
    }
  })
})

// -------- instance-level rule tests --------

describe('validateInstance — instance-level rules', () => {
  const validInstance = () => ({
    id: 'worcester-lpr',
    schema_version: 'ai@2026-04-16-beta',
    created_at: '2026-04-16T00:00:00.000Z',
    elements: [
      {
        element_id: 'accept_deny',
        priority: 0,
        variables: [],
        context_type_id: 'ai_only',
      },
      {
        element_id: 'cloud_storage',
        priority: 1,
        variables: [{ id: 'retention_period', value: '30 days' }],
      },
    ],
  })

  it('happy path: valid instance against clean source', () => {
    const r = validateInstance(baseSource(), validInstance())
    expect(r.ok).toBe(true)
  })

  it('Rule 4 (context_type_unknown): instance picks an undefined context value', () => {
    const inst = validInstance()
    inst.elements[0]!.context_type_id = 'does_not_exist'
    const r = validateInstance(baseSource(), inst)
    expect(r.errors.some((e) => e.code === 'CONTEXT_TYPE_UNKNOWN')).toBe(true)
  })

  it('Rule 7 (required_category_missing): missing element from required category', () => {
    const inst = validInstance()
    // accept_deny is the only decision-category element; remove it.
    inst.elements = inst.elements.filter((e) => e.element_id !== 'accept_deny')
    const r = validateInstance(baseSource(), inst)
    expect(r.errors.some((e) => e.code === 'REQUIRED_CATEGORY_MISSING')).toBe(true)
  })

  it('Rule 9 (instance_variable_unknown): variable id not defined on element', () => {
    const inst = validInstance()
    inst.elements[1]!.variables = [{ id: 'bogus_variable', value: 'x' }]
    const r = validateInstance(baseSource(), inst)
    expect(r.errors.some((e) => e.code === 'INSTANCE_VARIABLE_UNKNOWN')).toBe(true)
  })

  it('Rule 10 (instance_required_variable_missing): required variable absent', () => {
    const inst = validInstance()
    inst.elements[1]!.variables = [] // retention_period is required on the storage element
    const r = validateInstance(baseSource(), inst)
    expect(r.errors.some((e) => e.code === 'INSTANCE_REQUIRED_VARIABLE_MISSING')).toBe(true)
  })

  it('error envelope fields are agent-actionable', () => {
    const inst = validInstance()
    inst.elements[1]!.variables = []
    const r = validateInstance(baseSource(), inst)
    const missing = r.errors.find((e) => e.code === 'INSTANCE_REQUIRED_VARIABLE_MISSING')
    expect(missing?.fix_hint).toMatch(/retention_period/)
    expect(missing?.path).toMatch(/instance\.elements\[1\]\.variables/)
  })

  it('flags unknown element_id separately from variable rules', () => {
    const inst = validInstance()
    inst.elements[0]!.element_id = 'phantom_element'
    const r = validateInstance(baseSource(), inst)
    expect(r.errors.some((e) => e.code === 'INSTANCE_ELEMENT_UNKNOWN')).toBe(true)
  })
})
