import { describe, it, expect } from 'vitest'
import {
  ensureId,
  getType,
  setType,
  getContact,
  setContact,
  isTagged,
  loadRespondent,
  useRespondent,
} from '../app/composables/useRespondent'

// AE1: first-time vs returning respondent, and the "ask the tag once" rule.
// localStorage is reset before each test by test/setup.ts, standing in for
// a fresh browser.

describe('respondent identity (U5)', () => {
  it('first visit generates and persists an id; the self-tag is not yet set', () => {
    expect(getType()).toBeNull()
    expect(isTagged()).toBe(false)
    const id = ensureId()
    expect(id).toMatch(/[0-9a-f-]{36}/)
    // persisted
    expect(localStorage.getItem('dtpr.respondent.id')).toBe(id)
  })

  it('a returning visit reuses the same id (survives reloads)', () => {
    const first = ensureId()
    // simulate a reload: same localStorage, call again
    const second = ensureId()
    expect(second).toBe(first)
  })

  it('sets the self-tag once and does not re-ask on return', () => {
    ensureId()
    expect(isTagged()).toBe(false)
    setType('public')
    expect(getType()).toBe('public')
    expect(isTagged()).toBe(true)
    // returning: tag already known, not re-asked
    expect(isTagged()).toBe(true)
  })

  it('accepts both respondent types', () => {
    setType('professional')
    expect(getType()).toBe('professional')
  })

  it('keeps contact optional — feedback works with no contact', () => {
    ensureId()
    setType('public')
    const snap = loadRespondent()
    expect(snap.contact).toBeNull()
    expect(snap.type).toBe('public')
    expect(snap.id).toBeTruthy()
  })

  it('stores and trims contact when provided, clears it when blank', () => {
    setContact('  jane@example.com  ')
    expect(getContact()).toBe('jane@example.com')
    setContact('')
    expect(getContact()).toBeNull()
  })

  it('useRespondent().tag() drives the reactive state and forSubmit() payload', () => {
    const r = useRespondent()
    r.tag('professional', ' me@example.com ')
    expect(r.tagged.value).toBe(true)
    expect(r.type.value).toBe('professional')

    const sub = r.forSubmit()
    expect(sub).not.toBeNull()
    expect(sub!.type).toBe('professional')
    expect(sub!.contact).toBe('me@example.com')
    expect(sub!.id).toBeTruthy()
  })
})
