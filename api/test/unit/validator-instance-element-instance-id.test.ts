import { describe, it, expect } from 'vitest'
import { checkInstance } from '../../src/validator/rules/instance.ts'
import type { DatachainInstance } from '../../src/schema/datachain-instance.ts'
import type { SchemaVersionSource } from '../../src/validator/types.ts'
import type { LocaleCode, LocaleValue } from '../../src/schema/locale.ts'

const loc = (locale: LocaleCode, value: string): LocaleValue => ({ locale, value })

function source(): SchemaVersionSource {
  return {
    manifest: {
      version: 'ai@2026-05-06-beta',
      status: 'beta',
      created_at: '2026-05-06T00:00:00.000Z',
      notes: '',
      content_hash: `sha256-${'0'.repeat(64)}`,
      locales: ['en'],
    },
    datachainType: {
      id: 'ai',
      name: [loc('en', 'AI')],
      description: [],
      categories: ['ai__decision'],
      subchains: [],
      locales: ['en'],
      sources: [],
    },
    categories: [
      {
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
      },
    ],
    elements: [
      {
        id: 'institution',
        category_id: 'ai__decision',
        title: [loc('en', 'Institution')],
        description: [],
        authoring_guidance: [],
        examples: [],
        sources: [],
        symbol_id: 'institution',
        variables: [],
      },
      {
        id: 'vendor_acs',
        category_id: 'ai__decision',
        title: [loc('en', 'Vendor ACS')],
        description: [],
        authoring_guidance: [],
        examples: [],
        sources: [],
        symbol_id: 'vendor_acs',
        variables: [],
      },
    ],
    symbols: {},
  }
}

function instance(
  placements: Array<{ element_id?: string; element_instance_id?: string }>,
): DatachainInstance {
  return {
    id: 'inst',
    title: [],
    description: [],
    schema_version: 'ai@2026-05-06-beta',
    created_at: '2026-05-06T00:00:00.000Z',
    elements: placements.map((p) => ({
      element_id: p.element_id ?? 'institution',
      priority: 0,
      variables: [],
      actions: [],
      sources: [],
      ...(p.element_instance_id !== undefined
        ? { element_instance_id: p.element_instance_id }
        : {}),
    })),
    subchain_instances: [],
    sources: [],
    linked_instance_ids: [],
  }
}

describe('checkInstance — element_instance_id uniqueness', () => {
  it('emits INSTANCE_ELEMENT_INSTANCE_ID_DUPLICATE when two placements share the id', () => {
    const findings = checkInstance(
      source(),
      instance([
        { element_instance_id: 'deployer_acs' },
        { element_instance_id: 'deployer_acs' },
      ]),
    )
    const dup = findings.filter(
      (f) => f.code === 'INSTANCE_ELEMENT_INSTANCE_ID_DUPLICATE',
    )
    expect(dup).toHaveLength(1)
    expect(dup[0]?.path).toBe('instance.elements[1].element_instance_id')
  })

  it('no finding when element_instance_ids are distinct', () => {
    const findings = checkInstance(
      source(),
      instance([
        { element_instance_id: 'deployer_acs' },
        { element_instance_id: 'vendor_acs' },
      ]),
    )
    expect(
      findings.some((f) => f.code === 'INSTANCE_ELEMENT_INSTANCE_ID_DUPLICATE'),
    ).toBe(false)
  })

  it('no finding when element_instance_id is absent on every placement', () => {
    const findings = checkInstance(source(), instance([{}, {}]))
    expect(
      findings.some((f) => f.code === 'INSTANCE_ELEMENT_INSTANCE_ID_DUPLICATE'),
    ).toBe(false)
  })

  it('emits INSTANCE_ELEMENT_INSTANCE_ID_COLLIDES_WITH_ELEMENT_ID when an element_instance_id matches a placed element_id', () => {
    // Greptile case: placement A has element_instance_id 'vendor_acs',
    // and a separate placement B has element_id 'vendor_acs'. The
    // renderer would resolve the provenance key under both branches.
    const findings = checkInstance(
      source(),
      instance([
        { element_id: 'institution', element_instance_id: 'vendor_acs' },
        { element_id: 'vendor_acs' },
      ]),
    )
    const collide = findings.filter(
      (f) => f.code === 'INSTANCE_ELEMENT_INSTANCE_ID_COLLIDES_WITH_ELEMENT_ID',
    )
    expect(collide).toHaveLength(1)
    expect(collide[0]?.path).toBe('instance.elements[0].element_instance_id')
  })

  it('no collision finding when element_instance_id is disjoint from every element_id', () => {
    const findings = checkInstance(
      source(),
      instance([
        { element_id: 'institution', element_instance_id: 'deployer_acs' },
        { element_id: 'institution', element_instance_id: 'partner_acs' },
      ]),
    )
    expect(
      findings.some(
        (f) => f.code === 'INSTANCE_ELEMENT_INSTANCE_ID_COLLIDES_WITH_ELEMENT_ID',
      ),
    ).toBe(false)
  })
})
