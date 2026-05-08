import { describe, it, expect } from 'vitest'
import { bucketConfidence } from './confidence-bucket.js'

describe('bucketConfidence', () => {
  it('buckets values below 0.4 as low', () => {
    expect(bucketConfidence(0.0)).toBe('low')
    expect(bucketConfidence(0.39)).toBe('low')
  })

  it('buckets values in [0.4, 0.7] as medium', () => {
    expect(bucketConfidence(0.4)).toBe('medium')
    expect(bucketConfidence(0.55)).toBe('medium')
    expect(bucketConfidence(0.7)).toBe('medium')
  })

  it('buckets values above 0.7 as high', () => {
    expect(bucketConfidence(0.71)).toBe('high')
    expect(bucketConfidence(1.0)).toBe('high')
  })

  it('clamps out-of-range numbers at the boundaries before bucketing', () => {
    expect(bucketConfidence(-0.5)).toBe('low')
    expect(bucketConfidence(2)).toBe('high')
  })

  it('returns "low" for NaN / non-finite values (defensive)', () => {
    expect(bucketConfidence(Number.NaN)).toBe('low')
    expect(bucketConfidence(Number.POSITIVE_INFINITY)).toBe('low')
    expect(bucketConfidence(Number.NEGATIVE_INFINITY)).toBe('low')
  })
})
