import { describe, it, expect } from 'vitest'
import { aggregateSummary, seatLabel, THIN_SAMPLE_THRESHOLD, type SummaryRow } from '../app/utils/compare'

const row = (o: Partial<SummaryRow> & Pick<SummaryRow, 'reaction' | 'respondentType' | 'count'>): SummaryRow => ({
  variant: 'v6',
  version: '1',
  seat: null,
  ...o,
})

describe('aggregateSummary (U8)', () => {
  it('keeps public and professional as distinct buckets, never one number (AE3)', () => {
    const cols = aggregateSummary([
      row({ reaction: 'clear', respondentType: 'public', count: 3 }),
      row({ reaction: 'confusing', respondentType: 'professional', count: 2 }),
    ])
    expect(cols).toHaveLength(1)
    expect(cols[0].canvas.public.clear).toBe(3)
    expect(cols[0].canvas.professional.confusing).toBe(2)
    // No merged all-audiences total exists on the shape.
    expect(cols[0].canvas.public.total).toBe(3)
    expect(cols[0].canvas.professional.total).toBe(2)
  })

  it('flags a variant below the response threshold as not-yet-decidable', () => {
    const thin = aggregateSummary([row({ reaction: 'clear', respondentType: 'public', count: 2 })])
    expect(thin[0].thin).toBe(true)

    const enough = aggregateSummary([
      row({ reaction: 'clear', respondentType: 'public', count: THIN_SAMPLE_THRESHOLD }),
    ])
    expect(enough[0].thin).toBe(false)
  })

  it('renders a restyle as a new column while the prior version persists (AE2)', () => {
    const cols = aggregateSummary([
      row({ version: '1', reaction: 'confusing', respondentType: 'public', count: 4 }),
      row({ version: '2', reaction: 'clear', respondentType: 'public', count: 4 }),
    ])
    expect(cols.map(c => c.version)).toEqual(['1', '2'])
    expect(cols[0].canvas.public.confusing).toBe(4)
    expect(cols[1].canvas.public.clear).toBe(4)
  })

  it('collects per-seat confusion and ranks the most-confusing seat first', () => {
    const cols = aggregateSummary([
      row({ seat: 'processing', reaction: 'confusing', respondentType: 'public', count: 5 }),
      row({ seat: 'data-input', reaction: 'confusing', respondentType: 'public', count: 1 }),
      row({ seat: 'data-input', reaction: 'clear', respondentType: 'professional', count: 2 }),
    ])
    const seats = cols[0].seats
    expect(seats[0].seat).toBe('processing')
    expect(seats[0].confusionScore).toBe(5)
    const input = seats.find(s => s.seat === 'data-input')!
    expect(input.public.confusing).toBe(1)
    expect(input.professional.clear).toBe(2)
  })

  it('sums the column total across seat and canvas rows', () => {
    const cols = aggregateSummary([
      row({ reaction: 'clear', respondentType: 'public', count: 2 }),
      row({ seat: 'processing', reaction: 'confusing', respondentType: 'public', count: 3 }),
    ])
    expect(cols[0].total).toBe(5)
  })
})

describe('seatLabel (U8)', () => {
  it('prettifies stable seat keys', () => {
    expect(seatLabel('data-input')).toBe('Data input')
    expect(seatLabel('run-by')).toBe('Run by')
    expect(seatLabel('risk-0')).toBe('Risk 1')
    expect(seatLabel('risk-2')).toBe('Risk 3')
  })
})
