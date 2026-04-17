import { describe, it, expect } from 'vitest'
import {
  groupElementsByCategory,
  sortCategoriesByOrder,
  findCategoryDefinition,
} from './categories.js'

type MinElement = { id: string; category_ids: string[] }
type MinCategory = { id: string; order?: number; name?: unknown }

describe('groupElementsByCategory', () => {
  it('groups elements under their single category', () => {
    const elements: MinElement[] = [
      { id: 'a', category_ids: ['cat-1'] },
      { id: 'b', category_ids: ['cat-1'] },
      { id: 'c', category_ids: ['cat-2'] },
    ]
    const categories: MinCategory[] = [{ id: 'cat-1' }, { id: 'cat-2' }]
    const result = groupElementsByCategory(elements, categories)
    expect(result['cat-1']?.map((e) => e.id)).toEqual(['a', 'b'])
    expect(result['cat-2']?.map((e) => e.id)).toEqual(['c'])
  })

  it('puts an element with multiple category_ids into each of its groups', () => {
    const elements: MinElement[] = [{ id: 'shared', category_ids: ['cat-1', 'cat-2'] }]
    const categories: MinCategory[] = [{ id: 'cat-1' }, { id: 'cat-2' }]
    const result = groupElementsByCategory(elements, categories)
    expect(result['cat-1']?.map((e) => e.id)).toEqual(['shared'])
    expect(result['cat-2']?.map((e) => e.id)).toEqual(['shared'])
  })

  it('emits an empty array for a category with no matching elements', () => {
    const elements: MinElement[] = [{ id: 'a', category_ids: ['cat-1'] }]
    const categories: MinCategory[] = [{ id: 'cat-1' }, { id: 'cat-empty' }]
    const result = groupElementsByCategory(elements, categories)
    expect(result['cat-empty']).toEqual([])
  })

  it('ignores element category_ids that are not in the categories list', () => {
    const elements: MinElement[] = [{ id: 'orphan', category_ids: ['cat-ghost'] }]
    const categories: MinCategory[] = [{ id: 'cat-1' }]
    const result = groupElementsByCategory(elements, categories)
    expect(result['cat-1']).toEqual([])
    expect(result['cat-ghost']).toBeUndefined()
  })

  it('preserves the relative order of elements within a group', () => {
    const elements: MinElement[] = [
      { id: 'third', category_ids: ['cat-1'] },
      { id: 'first', category_ids: ['cat-1'] },
      { id: 'second', category_ids: ['cat-1'] },
    ]
    const categories: MinCategory[] = [{ id: 'cat-1' }]
    const result = groupElementsByCategory(elements, categories)
    expect(result['cat-1']?.map((e) => e.id)).toEqual(['third', 'first', 'second'])
  })
})

describe('sortCategoriesByOrder', () => {
  it('sorts categories by ascending order', () => {
    const grouped = { a: [], b: [], c: [] }
    const categories: MinCategory[] = [
      { id: 'a', order: 3 },
      { id: 'b', order: 1 },
      { id: 'c', order: 2 },
    ]
    const result = sortCategoriesByOrder(grouped, categories)
    expect(result.map((r) => r.id)).toEqual(['b', 'c', 'a'])
  })

  it('puts missing order entries last, sorted lexicographically by id', () => {
    const grouped = { zed: [], alpha: [], beta: [], gamma: [] }
    const categories: MinCategory[] = [
      { id: 'alpha', order: 0 },
      { id: 'beta' }, // no order
      { id: 'gamma' }, // no order
      { id: 'zed', order: 1 },
    ]
    const result = sortCategoriesByOrder(grouped, categories)
    expect(result.map((r) => r.id)).toEqual(['alpha', 'zed', 'beta', 'gamma'])
  })

  it('breaks order ties lexicographically by id', () => {
    const grouped = { a: [], b: [], c: [] }
    const categories: MinCategory[] = [
      { id: 'c', order: 1 },
      { id: 'a', order: 1 },
      { id: 'b', order: 1 },
    ]
    const result = sortCategoriesByOrder(grouped, categories)
    expect(result.map((r) => r.id)).toEqual(['a', 'b', 'c'])
  })

  it('carries grouped elements through the sort', () => {
    const elA = { id: 'a', category_ids: ['cat-1'] }
    const elB = { id: 'b', category_ids: ['cat-2'] }
    const grouped = { 'cat-1': [elA], 'cat-2': [elB] }
    const categories: MinCategory[] = [
      { id: 'cat-2', order: 1 },
      { id: 'cat-1', order: 2 },
    ]
    const result = sortCategoriesByOrder(grouped, categories)
    expect(result[0]?.id).toBe('cat-2')
    expect(result[0]?.elements).toEqual([elB])
    expect(result[1]?.id).toBe('cat-1')
    expect(result[1]?.elements).toEqual([elA])
  })

  it('only emits categories that appear in the grouped map', () => {
    const grouped = { a: [] }
    const categories: MinCategory[] = [
      { id: 'a', order: 0 },
      { id: 'ghost', order: 1 },
    ]
    const result = sortCategoriesByOrder(grouped, categories)
    expect(result.map((r) => r.id)).toEqual(['a'])
  })
})

describe('findCategoryDefinition', () => {
  it('returns the matching category by id', () => {
    const categories: MinCategory[] = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]
    expect(findCategoryDefinition('b', categories as never)).toEqual({ id: 'b', name: 'B' })
  })

  it('returns undefined when no category matches', () => {
    const categories: MinCategory[] = [{ id: 'a' }]
    expect(findCategoryDefinition('ghost', categories as never)).toBeUndefined()
  })
})
