import { describe, it, expect } from 'vitest'
import { ElementSchema, CategorySchema, SchemaManifestSchema } from '@dtpr/api/schema'
import { validateInstance } from '@dtpr/api/validator'

const validElement = {
  id: 'test-element',
  category_id: 'cat-1',
  title: [{ locale: 'en', value: 'Test Element' }],
  description: [{ locale: 'en', value: 'Description' }],
  citation: [],
  symbol_id: 'signal',
  variables: [],
}

describe('@dtpr/api/schema subpath export', () => {
  it('parses a valid element via ElementSchema.parse', () => {
    const parsed = ElementSchema.parse(validElement)
    expect(parsed.id).toBe('test-element')
    expect(parsed.title[0]?.value).toBe('Test Element')
  })

  it('exposes CategorySchema and SchemaManifestSchema', () => {
    expect(CategorySchema).toBeDefined()
    expect(SchemaManifestSchema).toBeDefined()
  })

  it('rejects invalid element with ZodError-compatible shape', () => {
    const bad = { ...validElement, id: 'not valid!' } // id regex failure
    const result = ElementSchema.safeParse(bad)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0)
    }
  })
})

describe('@dtpr/api/validator subpath export', () => {
  it('exposes validateInstance', () => {
    expect(typeof validateInstance).toBe('function')
  })
})
