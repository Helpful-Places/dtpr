import { describe, it, expect } from 'vitest'
import { checkVariableRationaleKeys } from '../../src/validator/rules/variable-rationale-keys.ts'
import type { DatachainInstance } from '../../src/schema/datachain-instance.ts'
import type { LocaleCode, LocaleValue } from '../../src/schema/locale.ts'
import type { Element } from '../../src/schema/element.ts'
import type { Category } from '../../src/schema/category.ts'
import type { DatachainType } from '../../src/schema/datachain-type.ts'
import type { SchemaVersionSource } from '../../src/validator/types.ts'

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

function cat(variableIds: string[] = ['retention_period']): Category {
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
    element_variables: variableIds.map((id) => ({
      kind: 'localized_text' as const,
      id,
      label: [loc('en', id)],
      required: false,
    })),
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

function source(variableIds: string[] = ['retention_period']): SchemaVersionSource {
  return {
    manifest: {
      version: 'ai@2026-04-16-beta',
      status: 'beta',
      created_at: '2026-04-16T00:00:00.000Z',
      notes: '',
      content_hash: `sha256-${'0'.repeat(64)}`,
      locales: ['en'],
    },
    datachainType: dt(),
    categories: [cat(variableIds)],
    elements: [el('accept_deny')],
    symbols: {},
  }
}

function makeThin(opts: {
  placedIds?: string[]
  variableRationale?: Record<string, string>
  rationaleElementId?: string
  kind?: 'human' | 'ai_generated'
}): DatachainInstance {
  const placedIds = opts.placedIds ?? ['accept_deny']
  const provenance =
    opts.kind === 'human'
      ? { kind: 'human' as const }
      : opts.variableRationale !== undefined
        ? {
            kind: 'ai_generated' as const,
            element_provenance: {
              [opts.rationaleElementId ?? placedIds[0]!]: {
                variable_rationale: opts.variableRationale,
              },
            },
          }
        : undefined

  return {
    id: 'x',
    title: [],
    description: [],
    schema_version: 'ai@2026-04-16-beta',
    created_at: '2026-04-16T00:00:00.000Z',
    elements: placedIds.map((id) => ({
      element_id: id,
      priority: 0,
      variables: [],
      actions: [],
      sources: [],
    })),
    subchain_instances: [],
    sources: [],
    linked_instance_ids: [],
    ...(provenance ? { authoring_provenance: provenance } : {}),
  }
}

describe('checkVariableRationaleKeys', () => {
  it('returns no findings when authoring_provenance is undefined', () => {
    const t = makeThin({})
    expect(checkVariableRationaleKeys(source(), t)).toEqual([])
  })

  it('returns no findings for human-authored disclosures', () => {
    const t = makeThin({ kind: 'human' })
    expect(checkVariableRationaleKeys(source(), t)).toEqual([])
  })

  it('returns no findings when every key is a declared variable', () => {
    const t = makeThin({
      variableRationale: { retention_period: '90 days from the privacy notice' },
    })
    expect(checkVariableRationaleKeys(source(), t)).toEqual([])
  })

  it('emits a finding for an unknown variable key', () => {
    const t = makeThin({
      variableRationale: { stale_variable: 'after a rename' },
    })
    const findings = checkVariableRationaleKeys(source(), t)
    expect(findings).toHaveLength(1)
    expect(findings[0]?.code).toBe('variable_rationale_unknown_variable')
    expect(findings[0]?.path).toBe(
      'authoring_provenance.element_provenance.accept_deny.variable_rationale.stale_variable',
    )
  })

  it('emits one finding per orphan variable key', () => {
    const t = makeThin({
      variableRationale: {
        retention_period: 'fine',
        ghost_a: 'stale',
        ghost_b: 'stale too',
      },
    })
    const findings = checkVariableRationaleKeys(source(), t)
    expect(findings).toHaveLength(2)
    expect(findings.map((f) => f.path).sort()).toEqual([
      'authoring_provenance.element_provenance.accept_deny.variable_rationale.ghost_a',
      'authoring_provenance.element_provenance.accept_deny.variable_rationale.ghost_b',
    ])
  })

  it('skips entries whose outer element_id is not placed (covered by element-key rule)', () => {
    // The entry is keyed under `ghost_element`, which is not placed.
    // checkElementProvenanceKeys handles that orphan; this rule must
    // not pile on a duplicate finding for the inner variable keys.
    const t = makeThin({
      placedIds: ['accept_deny'],
      rationaleElementId: 'ghost_element',
      variableRationale: { retention_period: 'whatever' },
    })
    expect(checkVariableRationaleKeys(source(), t)).toEqual([])
  })
})
