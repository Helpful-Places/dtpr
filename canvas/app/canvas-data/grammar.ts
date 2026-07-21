// The composition grammar, formalized from the v6 prototype
// (`prototypes/power-flow/canvas-affected-v6.html`). v6 emitted HTML
// strings; here the grammar returns *structured* output (segments +
// marks) so Vue renders it, tests assert tiers/colours, and each seat
// can carry a stable feedback key. The marker/colour policy is the load-
// bearing contract this module preserves (R2 / R3, KTD4):
//
//   • Deployment values render as highlighter markers.
//   • Colour is spent ONLY on published schema classifications — PII and
//     autonomy. Relationships and harm types are neutral (no colour).
//
// This renderer is expected to change often; keep it self-contained.

import { tr, listF, compact, type Loc, type Localized, t } from './loc'
import type { AutonomyKey, DataPiece, OrgPiece, PeoplePiece, RiskPiece, SystemContent } from './types'

// ── Colour: only published classifications earn it (KD3 / R12) ──
export const CLASSIFICATION_COLOR: Record<string, string> = {
  // input/output · PII
  identifiable: '#FFD700',
  de_identified: '#4A90D9',
  pseudonymous: '#9575CD',
  // functional_modes · autonomy
  autonomous: '#E76F51',
  human_decides: '#2A9D8F',
  human_executes: '#6A1B7A',
}

/** Palette colour for a classification key, or `null` for a neutral mark. */
export const markerColor = (key?: string | null): string | null =>
  (key && CLASSIFICATION_COLOR[key]) || null

/** A highlighter marker: `color: null` renders as neutral grey. */
export interface Mark {
  text: string
  color: string | null
}

/** `mk(text, key)` — a marker; palette key → colour, else neutral. */
export const mk = (text: string, key?: string | null): Mark => ({ text, color: markerColor(key) })

// ── Inline segments for composed lines (the system sentence) ──
export type Segment =
  | { kind: 'text', text: string }
  | { kind: 'mark', mark: Mark }

// ── Classification vocabularies (localized labels resolved by key) ──
// PII — the coloured classification on data values.
const PII: Record<string, { key: string, a: Localized }> = {
  identifiable: { key: 'identifiable', a: t('Identifiable', 'Données identifiables') },
  de_identified: { key: 'de_identified', a: t('De-identified', 'Données anonymisées') },
  pseudonymous: { key: 'pseudonymous', a: t('Pseudonymous', 'Données pseudonymisées') },
}

// Affected · relationship — a NEUTRAL classification (key:null → no colour).
const REL: Record<string, { key: null, a: Localized }> = {
  subject: { key: null, a: t('Decided about', 'Décidé à son sujet') },
  bystander: { key: null, a: t('Caught incidentally', 'Pris de façon incidente') },
  community: { key: null, a: t('Wider community', 'Communauté élargie') },
}

// ── A-stack builders — the compact stack rendered by PieceStack ──
// A normalized shape across data/people/org: headline + an optional
// second line (bold label and/or a mark) + trailing muted facts.
export interface AStack {
  headline: string
  /** Bold descriptor on line 2 (type / role); absent for people. */
  label?: string
  /** Coloured or neutral classification mark on line 2; null when none. */
  mark?: Mark | null
  /** Muted trailing line 3, `·`-joined. */
  facts: string[]
}

const scaleText = (p: PeoplePiece, loc: Loc): string =>
  p.count != null
    ? `~${compact(p.count, loc)} ${tr(p.noun, loc)}${p.per ? ' ' + tr(p.per, loc) : ''}`
    : tr(p.scale, loc)

/** data — the specific value leads; PII is the coloured classification.
 *  A piece with no PII degrades to headline + type (no mark). */
export function dataStack(p: DataPiece, loc: Loc): AStack {
  return {
    headline: tr(p.instance, loc),
    label: tr(p.type, loc),
    mark: p.pii ? mk(tr(PII[p.pii].a, loc), PII[p.pii].key) : null,
    facts: (p.facts || []).map(f => tr(f, loc)),
  }
}

/** affected — the group leads; the relationship is a NEUTRAL mark. */
export function peopleStack(p: PeoplePiece, loc: Loc): AStack {
  const rel = REL[p.rel]
  const sc = scaleText(p, loc)
  return {
    headline: tr(p.who, loc),
    mark: mk(tr(rel.a, loc), rel.key),
    facts: sc ? [sc] : [],
  }
}

/** accountable — the org name leads; role is the descriptor, no mark. */
export function orgStack(p: OrgPiece, loc: Loc): AStack {
  return {
    headline: tr(p.name, loc),
    label: tr(p.role, loc),
    mark: null,
    facts: [],
  }
}

// ── risk — its own A-only grammar: harm leads, narrative describes,
// mitigation pairs (or a missing one raises the board's one alarm). ──
export interface RiskView {
  title: string
  narrative: string
  /** null → render the "no mitigation" alarm. */
  mitigation: string | null
}

export function riskView(p: RiskPiece, loc: Loc): RiskView {
  return {
    title: tr(p.title, loc),
    narrative: tr(p.narrative, loc),
    mitigation: p.mitigation ? tr(p.mitigation, loc) : null,
  }
}

// ── The system sentence — autonomy is a coloured marker, not an underline ──
const VERBS: Record<string, Partial<Record<AutonomyKey | 'd', Localized>>> = {
  perceptive_mode: { d: t('senses', 'détecte') },
  semantic_mode: { d: t('understands', 'comprend') },
  analytical_mode: { d: t('decides', 'décide'), human_decides: t('recommends', 'recommande') },
  generative_mode: { d: t('creates', 'génère'), human_decides: t('drafts', 'rédige') },
  agentic_mode: { d: t('acts', 'agit'), human_executes: t('plans actions', 'planifie des actions'), human_decides: t('proposes actions', 'propose des actions') },
  physical_mode: { d: t('moves', 'se déplace'), human_executes: t('plans movements', 'planifie des mouvements'), human_decides: t('proposes movements', 'propose des mouvements') },
}

const TEMPLATES: Record<AutonomyKey, Localized> = {
  autonomous: t('The system {verbs} *on its own*.', 'Le système {verbs} *tout seul*.'),
  human_executes: t('The system {verbs}, and *a person carries out the result*.', 'Le système {verbs}, et *une personne exécute le résultat*.'),
  human_decides: t('The system {verbs}, and *a person decides what to do next*.', 'Le système {verbs}, et *une personne décide de la suite*.'),
}

/** Compose the system sentence as segments, the autonomy phrase a coloured mark. */
export function sentence(sys: SystemContent, loc: Loc): Segment[] {
  const a = sys.autonomy.id
  const verbs = listF(loc).format(
    sys.modes.map((m) => {
      const v = VERBS[m.id]
      const chosen = v && (v[a] || v.d)
      return chosen ? tr(chosen, loc) : tr(m.t, loc).toLowerCase()
    }),
  )
  const filled = tr(TEMPLATES[a], loc).replace('{verbs}', verbs)
  const match = filled.match(/^([\s\S]*?)\*([\s\S]+?)\*([\s\S]*)$/)
  if (!match) return [{ kind: 'text', text: filled }]
  return [
    { kind: 'text', text: match[1] },
    { kind: 'mark', mark: mk(match[2], a) },
    { kind: 'text', text: match[3] },
  ]
}

// ── Icons: real composed DTPR icons, loaded from the API (as in v6) ──
export const ICON_API = 'https://api.dtpr.io/api/v2/schemas/ai@2026-05-06-beta/elements/'
export const iconUrl = (id: string): string => `${ICON_API}${id}/icon.svg`
