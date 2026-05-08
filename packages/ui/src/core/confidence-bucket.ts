/**
 * Bucket a numeric confidence score in [0, 1] into a qualitative
 * `'low' | 'medium' | 'high'` label.
 *
 * Renderer policy (R10/R15c): the raw decimal is treated as reviewer
 * metadata and is NOT surfaced in public-facing UI surfaces. Public
 * surfaces show the qualitative bucket so non-technical readers don't
 * try to over-interpret a precision the model can't justify.
 *
 * Strawman thresholds (per the plan's Open Questions):
 *
 *   - `< 0.4`           → 'low'
 *   - `>= 0.4 && <= 0.7` → 'medium'
 *   - `> 0.7`           → 'high'
 *
 * Inputs outside [0, 1] are clamped at the boundaries before bucketing
 * (the schema constrains the wire shape, but the renderer is defensive).
 * `NaN` falls through to `'low'` so a malformed value never escalates
 * the displayed confidence.
 */
export type ConfidenceBucket = 'low' | 'medium' | 'high'

export function bucketConfidence(value: number): ConfidenceBucket {
  if (!Number.isFinite(value)) return 'low'
  const v = value < 0 ? 0 : value > 1 ? 1 : value
  if (v < 0.4) return 'low'
  if (v <= 0.7) return 'medium'
  return 'high'
}
