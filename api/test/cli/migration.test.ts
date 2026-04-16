import { describe, it, expect } from 'vitest'
import { parseFrontmatter } from '../../migrations/lib/frontmatter.ts'
import { transformElement } from '../../migrations/lib/transform-element.ts'
import { transformCategory } from '../../migrations/lib/transform-category.ts'
import { transformDatachainType } from '../../migrations/lib/transform-datachain.ts'
import type { LocaleBundle, MigrationWarning } from '../../migrations/lib/types.ts'

/**
 * Characterization test for the v1→new migration transforms.
 * Three elements per Unit 5's "Happy path" test scenario:
 *  - One AI-only element
 *  - One shared element (ai + device categories)
 *  - One device-only element (expected to be excluded)
 *
 * Plus one category migration check and one datachain-type check.
 */

// ---- Fixtures: minimal frontmatter matching v1 shape ----

const aiOnlyEn = `---
category:
  - ai__decision
name: Accept or deny
id: accept_deny
description: Binary yes/no decision on input.
icon: /dtpr-icons/dm_accept-or-deny.svg
symbol: /dtpr-icons/symbols/dm_accept-or-deny.svg
context_type_id: ai_only
updated_at: 2025-08-29T00:00:00Z
---
`

const aiOnlyEs = `---
category:
  - ai__decision
name: Aceptar o denegar
id: accept_deny
description: Decisión binaria sí/no sobre la entrada.
icon: /dtpr-icons/dm_accept-or-deny.svg
context_type_id: ai_only
---
`

const sharedEn = `---
category:
  - device__access
  - ai__access
name: 'Available for resale  '
id: available_for_resale
description: The data collected may be resold to other 3rd parties.
icon: /dtpr-icons/available_for_resale.svg
symbol: /dtpr-icons/symbols/available_for_resale.svg
updated_at: 2025-08-29T00:00:00Z
---
`

const sharedEs = `---
category:
  - device__access
  - ai__access
name: Disponible para reventa
id: available_for_resale
description: Los datos recopilados pueden revenderse a terceros.
icon: /dtpr-icons/available_for_resale.svg
---
`

const deviceOnlyEn = `---
category:
  - device__tech
name: Camera sensor
id: camera_sensor
description: A camera sensor on the device.
icon: /dtpr-icons/camera.svg
---
`

// ---- Helper: build a fake LocaleBundle with only en + es (others missing) ----

function bundle(enRaw: string, esRaw?: string): LocaleBundle {
  return {
    en: parseFrontmatter(enRaw),
    es: esRaw ? parseFrontmatter(esRaw) : null,
  }
}

// ---- Element transform tests ----

describe('transformElement — characterization', () => {
  it('AI-only element: ports with categories intact', () => {
    const warnings: MigrationWarning[] = []
    const el = transformElement('list-ai__decision__accept_deny.md', bundle(aiOnlyEn, aiOnlyEs), warnings)
    expect(el).not.toBeNull()
    expect(el!.id).toBe('accept_deny')
    expect(el!.category_ids).toEqual(['ai__decision'])
    expect(el!.title).toEqual([
      { locale: 'en', value: 'Accept or deny' },
      { locale: 'es', value: 'Aceptar o denegar' },
    ])
    expect(el!.citation).toEqual([]) // seeded empty
    expect(el!.icon.url).toBe('/dtpr-icons/dm_accept-or-deny.svg')
    expect(el!.icon.format).toBe('svg')
    expect(warnings).toEqual([])
  })

  it('AI-only element: drops element-level context_type_id, symbol, updated_at', () => {
    const warnings: MigrationWarning[] = []
    const el = transformElement('list-ai__decision__accept_deny.md', bundle(aiOnlyEn), warnings)
    // The emitted element shape has no context_type_id / symbol / updated_at fields at all.
    const keys = Object.keys(el as unknown as Record<string, unknown>)
    expect(keys).not.toContain('context_type_id')
    expect(keys).not.toContain('symbol')
    expect(keys).not.toContain('updated_at')
  })

  it('shared element: strips device__* from category_ids', () => {
    const warnings: MigrationWarning[] = []
    const el = transformElement('access__available_for_resale.md', bundle(sharedEn, sharedEs), warnings)
    expect(el).not.toBeNull()
    expect(el!.category_ids).toEqual(['ai__access'])
  })

  it('shared element: trims trailing whitespace on title values', () => {
    const warnings: MigrationWarning[] = []
    const el = transformElement('access__available_for_resale.md', bundle(sharedEn), warnings)
    expect(el!.title[0]!.value).toBe('Available for resale') // trailing spaces gone
  })

  it('device-only element: returns null (excluded from AI port)', () => {
    const warnings: MigrationWarning[] = []
    const el = transformElement('tech__camera_sensor.md', bundle(deviceOnlyEn), warnings)
    expect(el).toBeNull()
    expect(warnings).toEqual([]) // no warning — device-only is a silent skip
  })

  it('missing en frontmatter: emits warning and returns null', () => {
    const warnings: MigrationWarning[] = []
    const el = transformElement('broken.md', { en: null, es: parseFrontmatter(aiOnlyEs) }, warnings)
    expect(el).toBeNull()
    expect(warnings.some((w) => w.code === 'ELEMENT_MISSING_EN')).toBe(true)
  })

  it('missing title (0-byte source for all locales): emits warning, returns null', () => {
    const emptyFm = parseFrontmatter('---\nid: foo\ncategory:\n  - ai__decision\nicon: /x.svg\n---\n')
    const warnings: MigrationWarning[] = []
    const el = transformElement('empty.md', { en: emptyFm }, warnings)
    expect(el).toBeNull()
    expect(warnings.some((w) => w.code === 'ELEMENT_NO_TITLE')).toBe(true)
  })

  it('icon alt_text is built per-locale from the title with " icon" suffix', () => {
    const warnings: MigrationWarning[] = []
    const el = transformElement('list-ai__decision__accept_deny.md', bundle(aiOnlyEn, aiOnlyEs), warnings)
    expect(el!.icon.alt_text).toEqual([
      { locale: 'en', value: 'Accept or deny icon' },
      { locale: 'es', value: 'Aceptar o denegar icon' },
    ])
  })
})

// ---- Category transform tests ----

const decisionCategoryEn = `---
id: ai__decision
name: Decision Type
description: The type of decision being made by the AI system.
prompt: What is the type of decision being made?
required: true
order: 3
datachain_type: ai
element_variables:
  - id: additional_description
    label: Description
context:
  id: level_of_autonomy
  name: Level of Autonomy
  description: Degree of human involvement.
  values:
    - id: ai_only
      name: AI decides and executes
      description: AI processes, decides, and executes without human involvement.
      color: "#F28C28"
updated_at: 2025-08-29T00:00:00Z
---
`

const decisionCategoryEs = `---
id: ai__decision
name: Tipo de decisión
datachain_type: ai
element_variables:
  - id: additional_description
    label: Descripción
required: true
order: 3
description: El tipo de decisión que toma el sistema de IA.
prompt: ¿Qué tipo de decisión?
context:
  id: level_of_autonomy
  name: Nivel de autonomía
  description: Grado de involucramiento humano.
  values:
    - id: ai_only
      name: La IA decide y ejecuta
      description: La IA procesa, decide y ejecuta sin humanos.
---
`

describe('transformCategory — characterization', () => {
  it('merges en + es into localized arrays, preserves context values + colors', () => {
    const warnings: MigrationWarning[] = []
    const cat = transformCategory('ai__decision.md', bundle(decisionCategoryEn, decisionCategoryEs), warnings)
    expect(cat).not.toBeNull()
    expect(cat!.id).toBe('ai__decision')
    expect(cat!.required).toBe(true)
    expect(cat!.order).toBe(3)
    expect(cat!.datachain_type).toBe('ai')
    expect(cat!.name).toEqual([
      { locale: 'en', value: 'Decision Type' },
      { locale: 'es', value: 'Tipo de decisión' },
    ])
    expect(cat!.context?.id).toBe('level_of_autonomy')
    expect(cat!.context?.values).toHaveLength(1)
    expect(cat!.context?.values[0]!.color).toBe('#F28C28')
    expect(cat!.context?.values[0]!.name).toEqual([
      { locale: 'en', value: 'AI decides and executes' },
      { locale: 'es', value: 'La IA decide y ejecuta' },
    ])
  })

  it('element_variables merges per-locale labels', () => {
    const warnings: MigrationWarning[] = []
    const cat = transformCategory('ai__decision.md', bundle(decisionCategoryEn, decisionCategoryEs), warnings)
    expect(cat!.element_variables).toHaveLength(1)
    const v = cat!.element_variables[0]!
    expect(v.id).toBe('additional_description')
    expect(v.label).toEqual([
      { locale: 'en', value: 'Description' },
      { locale: 'es', value: 'Descripción' },
    ])
  })
})

// ---- Datachain-type transform tests ----

describe('transformDatachainType', () => {
  it('builds a datachain type from ai.md locale bundle with ordered categories', () => {
    const en = `---
id: ai
name: AI / Algorithm
---
`
    const es = `---
id: ai
name: IA / Algoritmo
---
`
    const dt = transformDatachainType(bundle(en, es), ['ai__decision', 'ai__storage'])
    expect(dt.id).toBe('ai')
    expect(dt.name).toEqual([
      { locale: 'en', value: 'AI / Algorithm' },
      { locale: 'es', value: 'IA / Algoritmo' },
    ])
    expect(dt.categories).toEqual(['ai__decision', 'ai__storage'])
    expect(dt.locales).toEqual(['en', 'es', 'fr', 'km', 'pt', 'tl'])
  })
})
