import { describe, it, expect } from 'vitest'
import { checkElementProvenanceKeys } from '../../src/validator/rules/element-provenance-keys.ts'
import type { ResolvedDatachainInstance } from '../../src/schema/datachain-instance-resolved.ts'
import type { LocaleCode, LocaleValue } from '../../src/schema/locale.ts'
import type { Element } from '../../src/schema/element.ts'
import type { Category } from '../../src/schema/category.ts'
import type { DatachainType } from '../../src/schema/datachain-type.ts'

const loc = (locale: LocaleCode, value: string): LocaleValue => ({ locale, value })

function dt(): DatachainType {
  return {
    id: 'ai',
    name: [loc('en', 'AI')],
    description: [],
    categories: ['ai__decision'],
    subchains: [],
    locales: ['en'],
    sources: [],
  }
}

function cat(): Category {
  return {
    id: 'ai__decision',
    name: [loc('en', 'Decision')],
    description: [],
    prompt: [],
    authoring_guidance: [],
    examples: [],
    sources: [],
    required: false,
    order: 1,
    datachain_type: 'ai',
    shape: 'hexagon',
    element_variables: [],
  }
}

function el(id: string): Element {
  return {
    id,
    category_id: 'ai__decision',
    title: [loc('en', id)],
    description: [],
    authoring_guidance: [],
    examples: [],
    sources: [],
    symbol_id: id,
    variables: [],
  }
}

function makeResolved(opts: {
  placedIds: string[]
  snapshotIds: string[]
  elementProvenance?: Record<string, { rationale?: string }>
  kind?: 'human' | 'ai_generated'
}): ResolvedDatachainInstance {
  const provenance =
    opts.elementProvenance !== undefined || opts.kind !== undefined
      ? {
          kind: (opts.kind ?? 'ai_generated') as 'ai_generated' | 'human',
          ...(opts.elementProvenance ? { element_provenance: opts.elementProvenance } : {}),
        }
      : undefined

  return {
    id: 'x',
    title: [],
    description: [],
    schema_version: 'ai@2026-04-16-beta',
    created_at: '2026-04-16T00:00:00.000Z',
    elements: opts.placedIds.map((id) => ({
      element_id: id,
      priority: 0,
      variables: [],
      actions: [],
      sources: [],
    })),
    subchain_instances: [],
    sources: [],
    linked_instance_ids: [],
    schema_snapshot: {
      datachain_type: dt(),
      categories: [cat()],
      elements: opts.snapshotIds.map(el),
    },
    suggested_elements: [],
    ...(provenance ? { authoring_provenance: provenance as ResolvedDatachainInstance['authoring_provenance'] } : {}),
  }
}

describe('checkElementProvenanceKeys', () => {
  it('returns no findings when authoring_provenance is undefined', () => {
    const r = makeResolved({ placedIds: ['accept_deny'], snapshotIds: ['accept_deny'] })
    expect(checkElementProvenanceKeys(r)).toEqual([])
  })

  it('returns no findings for human-authored disclosures', () => {
    const r = makeResolved({
      placedIds: ['accept_deny'],
      snapshotIds: ['accept_deny'],
      kind: 'human',
    })
    expect(checkElementProvenanceKeys(r)).toEqual([])
  })

  it('returns no findings when element_provenance is omitted', () => {
    const r = makeResolved({
      placedIds: ['accept_deny'],
      snapshotIds: ['accept_deny'],
      kind: 'ai_generated',
    })
    expect(checkElementProvenanceKeys(r)).toEqual([])
  })

  it('returns no findings when every key matches a placement element_id', () => {
    const r = makeResolved({
      placedIds: ['accept_deny'],
      snapshotIds: ['accept_deny'],
      elementProvenance: { accept_deny: { rationale: 'ok' } },
    })
    expect(checkElementProvenanceKeys(r)).toEqual([])
  })

  it('emits a finding for an unknown element_id key', () => {
    const r = makeResolved({
      placedIds: ['accept_deny'],
      snapshotIds: ['accept_deny'],
      elementProvenance: { ghost_element: { rationale: 'orphan' } },
    })
    const findings = checkElementProvenanceKeys(r)
    expect(findings).toHaveLength(1)
    expect(findings[0]?.code).toBe('element_provenance_unknown_element')
    expect(findings[0]?.path).toBe('authoring_provenance.element_provenance.ghost_element')
    expect(findings[0]?.message).toContain('ghost_element')
  })

  it('emits one finding per unknown key when multiple are orphaned', () => {
    const r = makeResolved({
      placedIds: ['accept_deny'],
      snapshotIds: ['accept_deny'],
      elementProvenance: {
        accept_deny: { rationale: 'fine' },
        ghost_a: {},
        ghost_b: {},
      },
    })
    const findings = checkElementProvenanceKeys(r)
    expect(findings).toHaveLength(2)
    expect(findings.map((f) => f.path).sort()).toEqual([
      'authoring_provenance.element_provenance.ghost_a',
      'authoring_provenance.element_provenance.ghost_b',
    ])
  })

  it('emits a finding when the key matches a snapshot element that is not placed', () => {
    // Snapshot has the element but the datachain does not place it —
    // an entry referencing it is dead data.
    const r = makeResolved({
      placedIds: ['accept_deny'],
      snapshotIds: ['accept_deny', 'unused_element'],
      elementProvenance: { unused_element: { rationale: 'dead' } },
    })
    const findings = checkElementProvenanceKeys(r)
    expect(findings).toHaveLength(1)
    expect(findings[0]?.path).toBe('authoring_provenance.element_provenance.unused_element')
  })
})
