// Pure aggregation for the compare view (U8 / R6): turn the flat, segmented
// summary rows from /api/feedback/summary into per-(variant, version)
// columns. Public and professional are ALWAYS kept as separate audience
// buckets and never merged (AE3 / R12). Each restyle is its own column, so
// a prior version's feedback persists beside the new one (AE2).

// Local (non-exported) to avoid colliding with the same names auto-imported
// from the composables; consumers use SummaryRow / VariantColumn, not these.
type Reaction = 'clear' | 'confusing' | 'unsure'
type RespondentType = 'public' | 'professional'

export interface SummaryRow {
  variant: string
  version: string
  seat: string | null
  reaction: Reaction
  respondentType: RespondentType
  count: number
}

export interface AudienceClarity {
  clear: number
  confusing: number
  unsure: number
  total: number
}

export interface SeatConfusion {
  seat: string
  public: AudienceClarity
  professional: AudienceClarity
  /** confusing + unsure across both audiences — used to rank/sort seats. */
  confusionScore: number
}

export interface VariantColumn {
  variant: string
  version: string
  canvas: { public: AudienceClarity, professional: AudienceClarity }
  seats: SeatConfusion[]
  total: number
  /** Below the response threshold → not yet decidable. */
  thin: boolean
}

/** Minimum responses on a variant before compare treats it as decidable. */
export const THIN_SAMPLE_THRESHOLD = 5

const emptyClarity = (): AudienceClarity => ({ clear: 0, confusing: 0, unsure: 0, total: 0 })

function addTo(c: AudienceClarity, reaction: Reaction, count: number) {
  c[reaction] += count
  c.total += count
}

export function aggregateSummary(
  rows: SummaryRow[],
  threshold: number = THIN_SAMPLE_THRESHOLD,
): VariantColumn[] {
  const columns = new Map<string, VariantColumn>()
  const seatMaps = new Map<string, Map<string, SeatConfusion>>()

  for (const row of rows) {
    const colKey = `${row.variant}::${row.version}`
    let col = columns.get(colKey)
    if (!col) {
      col = {
        variant: row.variant,
        version: row.version,
        canvas: { public: emptyClarity(), professional: emptyClarity() },
        seats: [],
        total: 0,
        thin: true,
      }
      columns.set(colKey, col)
      seatMaps.set(colKey, new Map())
    }
    col.total += row.count

    if (row.seat === null) {
      addTo(col.canvas[row.respondentType], row.reaction, row.count)
    } else {
      const seats = seatMaps.get(colKey)!
      let sc = seats.get(row.seat)
      if (!sc) {
        sc = { seat: row.seat, public: emptyClarity(), professional: emptyClarity(), confusionScore: 0 }
        seats.set(row.seat, sc)
      }
      addTo(sc[row.respondentType], row.reaction, row.count)
      if (row.reaction === 'confusing' || row.reaction === 'unsure') sc.confusionScore += row.count
    }
  }

  const result: VariantColumn[] = []
  for (const [colKey, col] of columns) {
    // Seats where confusion clusters first.
    col.seats = [...seatMaps.get(colKey)!.values()].sort(
      (a, b) => b.confusionScore - a.confusionScore || a.seat.localeCompare(b.seat),
    )
    col.thin = col.total < threshold
    result.push(col)
  }
  // Stable column order: variant, then version.
  result.sort((a, b) => a.variant.localeCompare(b.variant) || a.version.localeCompare(b.version))
  return result
}

/** Human-friendly seat label from a stable key: `data-input` → `Data input`,
 *  `risk-0` → `Risk 1`. */
export function seatLabel(seat: string): string {
  const risk = seat.match(/^risk-(\d+)$/)
  if (risk) return `Risk ${Number(risk[1]) + 1}`
  const s = seat.replace(/-/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}
