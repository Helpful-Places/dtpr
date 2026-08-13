import { describe, it, expect } from 'vitest'
import { validateFeedback, insertFeedback, getSummary } from '../server/utils/db'
import { makeTestD1 } from './d1'

const respondent = (over: Partial<{ id: string, type: string, contact: string }> = {}) => ({
  id: 'r-1',
  type: 'public',
  ...over,
})

const seatBody = (over: Record<string, unknown> = {}) => ({
  system: 'face-gates',
  variant: 'v6',
  version: '1',
  scope: 'seat',
  seat: 'data-input',
  reaction: 'confusing',
  respondent: respondent(),
  ...over,
})

describe('validateFeedback (U4)', () => {
  it('accepts a well-formed seat payload and normalizes it', () => {
    const r = validateFeedback(seatBody({ note: '  unclear  ' }))
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.seat).toBe('data-input')
      expect(r.value.scope).toBe('seat')
      expect(r.value.note).toBe('unclear')
      expect(r.value.respondent.contact).toBeNull()
    }
  })

  it('rejects a missing required field with an error (→ 400)', () => {
    expect(validateFeedback(seatBody({ system: '' })).ok).toBe(false)
    expect(validateFeedback(seatBody({ version: undefined })).ok).toBe(false)
    expect(validateFeedback({ ...seatBody(), respondent: undefined }).ok).toBe(false)
  })

  it('requires a seat for scope "seat" and drops it for scope "canvas" (AE4)', () => {
    expect(validateFeedback(seatBody({ scope: 'seat', seat: undefined })).ok).toBe(false)

    const canvas = validateFeedback(seatBody({ scope: 'canvas', seat: 'data-input', reaction: 'clear' }))
    expect(canvas.ok).toBe(true)
    if (canvas.ok) expect(canvas.value.seat).toBeNull()
  })

  it('rejects an unknown reaction and an unknown respondent type', () => {
    expect(validateFeedback(seatBody({ reaction: 'love' })).ok).toBe(false)
    expect(validateFeedback(seatBody({ respondent: respondent({ type: 'robot' }) })).ok).toBe(false)
  })

  it('rejects over-length keys and caps note/contact length (storage-abuse guard)', () => {
    const huge = 'x'.repeat(5000)
    // keys (system/variant/version/seat/respondent.id) are hard-rejected
    expect(validateFeedback(seatBody({ system: huge })).ok).toBe(false)
    expect(validateFeedback(seatBody({ seat: huge })).ok).toBe(false)
    expect(validateFeedback(seatBody({ respondent: respondent({ id: huge }) })).ok).toBe(false)
    // free-text note/contact are truncated, not rejected
    const r = validateFeedback(seatBody({ note: huge, respondent: respondent({ contact: huge }) }))
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.note!.length).toBe(2000)
      expect(r.value.respondent.contact!.length).toBe(256)
    }
  })
})

describe('insertFeedback + getSummary against real SQL (U4)', () => {
  it('persists a valid payload as a row', async () => {
    const db = makeTestD1()
    const r = validateFeedback(seatBody())
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const id = await insertFeedback(db, r.value)
    expect(id).toBeTruthy()
    const rows = await getSummary(db, 'face-gates')
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ variant: 'v6', version: '1', seat: 'data-input', reaction: 'confusing', respondentType: 'public', count: 1 })
  })

  it('records the seat for seat scope and NULL for canvas scope (AE4)', async () => {
    const db = makeTestD1()
    const seat = validateFeedback(seatBody())
    const canvas = validateFeedback(seatBody({ scope: 'canvas', reaction: 'clear', seat: undefined }))
    if (seat.ok) await insertFeedback(db, seat.value)
    if (canvas.ok) await insertFeedback(db, canvas.value)

    const rows = await getSummary(db, 'face-gates')
    const seats = rows.map(r => r.seat).sort()
    expect(seats).toContain('data-input')
    expect(seats).toContain(null)
  })

  it('keeps public and professional as separate buckets, never merged (AE3)', async () => {
    const db = makeTestD1()
    // Two publics + one professional react "confusing" on the same seat.
    for (const id of ['pub-1', 'pub-2']) {
      const r = validateFeedback(seatBody({ respondent: respondent({ id, type: 'public' }) }))
      if (r.ok) await insertFeedback(db, r.value)
    }
    const pro = validateFeedback(seatBody({ respondent: respondent({ id: 'pro-1', type: 'professional' }) }))
    if (pro.ok) await insertFeedback(db, pro.value)

    const rows = await getSummary(db, 'face-gates')
    const byType = Object.fromEntries(rows.map(r => [r.respondentType, r.count]))
    expect(byType.public).toBe(2)
    expect(byType.professional).toBe(1)
    // Never collapsed into a single all-audiences number.
    expect(rows.some(r => r.count === 3)).toBe(false)
  })

  it('sets the self-tag once and does not overwrite it on return visits', async () => {
    const db = makeTestD1()
    const first = validateFeedback(seatBody({ respondent: respondent({ id: 'r-x', type: 'public' }) }))
    if (first.ok) await insertFeedback(db, first.value)
    // Same id later — even if a different type were sent, the original stands.
    const again = validateFeedback(seatBody({ reaction: 'clear', respondent: respondent({ id: 'r-x', type: 'professional' }) }))
    if (again.ok) await insertFeedback(db, again.value)

    const rows = await getSummary(db, 'face-gates')
    // Both responses aggregate under the original 'public' tag.
    expect(rows.every(r => r.respondentType === 'public')).toBe(true)
    expect(rows.reduce((n, r) => n + r.count, 0)).toBe(2)
  })

  it('fills contact on a return visit when it was empty, but never overwrites an existing one', async () => {
    const db = makeTestD1()
    const readContact = () =>
      db.prepare('SELECT contact FROM respondent WHERE respondent_id = ?')
        .bind('r-c').first<{ contact: string | null }>()

    // First visit: no contact.
    const a = validateFeedback(seatBody({ respondent: respondent({ id: 'r-c' }) }))
    if (a.ok) await insertFeedback(db, a.value)
    expect((await readContact())?.contact).toBeNull()

    // Return visit provides a contact → fills the empty slot.
    const b = validateFeedback(seatBody({ reaction: 'clear', respondent: respondent({ id: 'r-c', contact: 'jane@example.com' }) }))
    if (b.ok) await insertFeedback(db, b.value)
    expect((await readContact())?.contact).toBe('jane@example.com')

    // A later, different contact must NOT overwrite the stored one.
    const c = validateFeedback(seatBody({ reaction: 'unsure', respondent: respondent({ id: 'r-c', contact: 'evil@example.com' }) }))
    if (c.ok) await insertFeedback(db, c.value)
    expect((await readContact())?.contact).toBe('jane@example.com')
  })
})
