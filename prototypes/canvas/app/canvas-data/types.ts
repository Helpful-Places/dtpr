import type { Localized } from './loc'

// ── Published schema classifications (the only values that earn colour) ──
/** PII classification on a data value (input/output). */
export type PiiKey = 'identifiable' | 'de_identified' | 'pseudonymous'
/** Autonomy classification on the system sentence. `human_executes` is the
 *  ai@2026-05-06-beta value; ai@2026-08-24-beta renames it `human_oversees`
 *  ("a person oversees or carries it out") — both stay valid so old
 *  versions keep rendering. */
export type AutonomyKey = 'autonomous' | 'human_decides' | 'human_executes' | 'human_oversees'
/** Affected relationship — a *neutral* classification (never coloured). */
export type RelationKey = 'subject' | 'bystander' | 'community'

// ── The typed pieces (one per canvas seat category) ──

/** Accountable org — the name leads, the role is the descriptor. */
export interface OrgPiece {
  /** DTPR element id for the composed icon (e.g. `organization`, `institution`). */
  el: string
  /** Proper noun — not localized. */
  name: string
  role: Localized
  verb: Localized
}

/** A data value in the input → processing → output flow. */
export interface DataPiece {
  /** DTPR element id for the composed icon. */
  id: string
  type: Localized
  instance: Localized
  /** PII classification — the coloured marker; absent when the value has none. */
  pii?: PiiKey
  facts?: Localized[]
}

/** A functional mode icon + label for the system sentence. */
export interface Mode {
  id: string
  t: Localized
  s: Localized
}

/** A risk: harm type leads, narrative describes, mitigation pairs (or alarms). */
export interface RiskPiece {
  /** AIAAIC harm element id for the icon. */
  harm: string
  title: Localized
  narrative: Localized
  /** `null` renders the board's one earned "no mitigation" alarm. */
  mitigation: Localized | null
}

/** The affected group — the group leads, the relationship is neutral. */
export interface PeoplePiece {
  who: Localized
  count?: number
  noun?: Localized
  per?: Localized
  scale?: Localized
  rel: RelationKey
}

export interface RightAction {
  type: 'email' | 'url' | 'form' | 'phone'
  label: Localized
  target: string
}

export interface Right {
  /** DTPR right element id for the icon. */
  id: string
  t: Localized
  s?: Localized
  acts?: RightAction[]
}

export interface Escalate {
  k: Localized
  acts: RightAction[]
}

export interface Purpose {
  id: string
  t: Localized
}

/** Everything needed to draw one canvas — the seats of a single system. */
export interface SystemContent {
  ref: string
  /** DTPR schema version the element ids resolve against (icon URLs).
   *  Absent → the original `ai@2026-05-06-beta` pin. */
  schema?: string
  name: Localized
  read: Localized
  purpose: Purpose
  builtby: OrgPiece
  runby: OrgPiece
  modes: Mode[]
  autonomy: { id: AutonomyKey }
  /** ai@2026-08-24-beta: the technology that captures the input data —
   *  the flow's upstream end (world → system). Optional; older content
   *  and pure-software systems omit it. */
  collection?: DataPiece
  input: DataPiece
  processing: DataPiece
  output: DataPiece
  /** ai@2026-08-24-beta: the form the output takes when people encounter
   *  it — the flow's downstream end (system → world). Optional. */
  manifestation?: DataPiece
  risks: RiskPiece[]
  usedon: PeoplePiece
  rights: Right[]
  escalate?: Escalate
}

// ── Register structure: system → variant → version (KD3 / R4 / R5) ──

/** One restyle of a variant. A restyle is a new version committed to the
 *  repo, so prior feedback stays attached to the look it was given on. */
export interface CanvasVersion {
  versionKey: string
  label?: Localized
  content: SystemContent
}

/** A presentation variant — one way of drawing a system — that evolves
 *  through versions. Only `live` variants surface in the register (R16). */
export interface CanvasVariant {
  variantKey: string
  label: Localized
  live: boolean
  /** Oldest → newest; the last entry is the current version. */
  versions: CanvasVersion[]
}

/** A system in the register, shown in one or more variants. */
export interface CanvasSystem {
  systemKey: string
  variants: CanvasVariant[]
}

/** A fully-resolved canvas: the coordinates plus the content to render. */
export interface ResolvedCanvas {
  systemKey: string
  variantKey: string
  versionKey: string
  live: boolean
  variantLabel: Localized
  content: SystemContent
}

// ── Stable seat keys ──
// Structural, not stored per-system: the board layout is fixed, so these
// keys are stable across restyles and are what feedback anchors to (R3).

export const SEAT = {
  purpose: 'purpose',
  runBy: 'run-by',
  builtBy: 'built-by',
  system: 'system',
  collection: 'collection',
  dataInput: 'data-input',
  processing: 'processing',
  dataOutput: 'data-output',
  manifestation: 'manifestation',
  usedOn: 'used-on',
  rights: 'rights',
} as const

export type SeatKey = (typeof SEAT)[keyof typeof SEAT] | `risk-${number}`

/** Seat key for the nth risk (0-based), e.g. `risk-0`. */
export const riskSeat = (i: number): `risk-${number}` => `risk-${i}`
