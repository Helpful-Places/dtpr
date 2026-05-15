import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CollectionFullError,
  CollectionUnavailableError,
  __INTERNAL,
  __clearCollectionForTests,
  deleteEntry,
  loadCollection,
  renameEntry,
  saveEntry,
} from '../app/utils/datachain-visualizer-collection'

function safeClearStorage() {
  try {
    if (typeof window.localStorage?.clear === 'function') {
      window.localStorage.clear()
    } else if (typeof window.localStorage?.removeItem === 'function') {
      window.localStorage.removeItem(__INTERNAL.STORAGE_KEY)
    }
  } catch {
    // localStorage may have been swapped out by a test; ignore.
  }
}

beforeEach(() => {
  safeClearStorage()
})

afterEach(() => {
  vi.unstubAllGlobals()
  safeClearStorage()
})

describe('collection round-trip', () => {
  it('returns the empty state on a fresh origin', () => {
    expect(loadCollection()).toEqual({ entries: [], schemaVersion: 1 })
  })

  it('saveEntry writes and loadCollection reads it back byte-for-byte', () => {
    const json = JSON.stringify({ schema_version: 'ai@2026-05-06-beta', id: 'demo' })
    const entry = saveEntry({ name: 'Demo', json })
    const loaded = loadCollection()
    expect(loaded.entries).toHaveLength(1)
    expect(loaded.entries[0]).toEqual(entry)
    expect(loaded.entries[0].json).toBe(json)
  })

  it('renameEntry only updates the named entry', () => {
    const a = saveEntry({ name: 'A', json: '{"a":1}' })
    const b = saveEntry({ name: 'B', json: '{"b":2}' })
    const after = renameEntry(a.id, 'A renamed')
    expect(after.entries.find((e) => e.id === a.id)?.name).toBe('A renamed')
    expect(after.entries.find((e) => e.id === b.id)?.name).toBe('B')
  })

  it('deleteEntry removes only the named entry', () => {
    const a = saveEntry({ name: 'A', json: '{"a":1}' })
    const b = saveEntry({ name: 'B', json: '{"b":2}' })
    const after = deleteEntry(a.id)
    expect(after.entries.map((e) => e.id)).toEqual([b.id])
  })

  it('discards a corrupt stored value and returns empty', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    window.localStorage.setItem(__INTERNAL.STORAGE_KEY, '{ not json')
    expect(loadCollection()).toEqual({ entries: [], schemaVersion: 1 })
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })

  it('returns empty when the stored schemaVersion is unknown (forward-compat)', () => {
    window.localStorage.setItem(
      __INTERNAL.STORAGE_KEY,
      JSON.stringify({ schemaVersion: 99, entries: [{ id: 'x', name: 'x', savedAt: 'x', json: '{}' }] }),
    )
    expect(loadCollection()).toEqual({ entries: [], schemaVersion: 1 })
  })

  it('throws CollectionFullError without writing when the new size exceeds the cap', () => {
    saveEntry({ name: 'small', json: '{}' })
    const before = window.localStorage.getItem(__INTERNAL.STORAGE_KEY)
    const huge = 'x'.repeat(__INTERNAL.MAX_SERIALIZED_BYTES + 1)
    expect(() => saveEntry({ name: 'huge', json: `"${huge}"` })).toThrow(CollectionFullError)
    // Prior state unchanged.
    expect(window.localStorage.getItem(__INTERNAL.STORAGE_KEY)).toBe(before)
  })

  it('surfaces CollectionUnavailableError when localStorage throws', () => {
    const original = window.localStorage
    // Replace localStorage with a throwing stand-in.
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('storage disabled')
      },
    })
    try {
      expect(() => loadCollection()).toThrow(CollectionUnavailableError)
      expect(() => saveEntry({ name: 'x', json: '{}' })).toThrow(CollectionUnavailableError)
    } finally {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        value: original,
      })
    }
  })

  it('uses test seam to clear collection state', () => {
    saveEntry({ name: 'A', json: '{}' })
    __clearCollectionForTests()
    expect(loadCollection().entries).toHaveLength(0)
  })
})
