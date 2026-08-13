import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useFeedback } from '../app/composables/useFeedback'
import { useRespondent } from '../app/composables/useRespondent'

// The self-tag gating + pending-flush branch (R12): a reaction from an
// untagged respondent is held and the self-tag prompt opens; nothing posts
// until they tag, then exactly the held reaction flushes. Nuxt's
// auto-imports ($fetch / useToast / useI18n) are stubbed as globals.

const fetchMock = vi.fn().mockResolvedValue({ success: true })

beforeEach(() => {
  fetchMock.mockClear()
  // @ts-expect-error test globals standing in for Nuxt auto-imports
  globalThis.$fetch = fetchMock
  // @ts-expect-error
  globalThis.useToast = () => ({ add: vi.fn() })
  // @ts-expect-error
  globalThis.useI18n = () => ({ t: (k: string) => k })
})

const coords = { system: 'face-gates', variant: 'v6', version: '1' }

describe('useFeedback gating + flush (U6 / R12)', () => {
  it('holds an untagged reaction, opens the self-tag, then flushes exactly it', async () => {
    const fb = useFeedback(() => coords)
    // Untagged: submit must NOT post; it opens the self-tag instead.
    await fb.submit('confusing', { scope: 'seat', seat: 'processing', note: 'huh' })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(fb.selfTagOpen.value).toBe(true)

    // Tag, then flush the held reaction.
    useRespondent().tag('public')
    await fb.onTagged()
    expect(fb.selfTagOpen.value).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, opts] = fetchMock.mock.calls[0] as [string, { body: Record<string, unknown> }]
    expect(url).toBe('/api/feedback')
    expect(opts.body).toMatchObject({
      system: 'face-gates',
      seat: 'processing',
      scope: 'seat',
      reaction: 'confusing',
      note: 'huh',
    })
    expect((opts.body.respondent as { type: string }).type).toBe('public')
  })

  it('posts immediately once already tagged', async () => {
    useRespondent().tag('professional')
    const fb = useFeedback(() => coords)
    await fb.submit('clear', { scope: 'canvas' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, opts] = fetchMock.mock.calls[0] as [string, { body: Record<string, unknown> }]
    expect(opts.body.scope).toBe('canvas')
    expect(opts.body.seat).toBeNull()
  })

  it('onTagged with no pending reaction posts nothing', async () => {
    useRespondent().tag('public')
    const fb = useFeedback(() => coords)
    await fb.onTagged()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
