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
const REL: Record<string, { key: null, a: Localized, tail: Localized, legend: Localized }> = {
  subject: {
    key: null,
    a: t('Decided about', 'Décidé à son sujet'),
    tail: t('the system’s output affects each of them directly.', 'la sortie du système les affecte directement.'),
    legend: t(
      'The system produces an output about this person that affects them directly — a score, a match, an eligibility call.',
      'Le système produit un résultat sur cette personne qui l’affecte directement — un score, une correspondance, une décision d’admissibilité.',
    ),
  },
  bystander: {
    key: null,
    a: t('Caught incidentally', 'Pris de façon incidente'),
    tail: t('swept into the data; no decision is made about them.', 'intégrés aux données ; aucune décision ne les concerne.'),
    legend: t(
      'Swept into the system’s data even though it isn’t making a decision about them — a face in the background of a camera aimed elsewhere.',
      'Intégrés aux données du système sans qu’aucune décision ne les concerne — un visage à l’arrière-plan d’une caméra visant ailleurs.',
    ),
  },
  community: {
    key: null,
    a: t('Wider community', 'Communauté élargie'),
    tail: t('affected together, beyond any one person it processes.', 'affectés collectivement, au-delà de chaque personne traitée.'),
    legend: t(
      'A place or group affected collectively, beyond the individuals the system processes — a neighbourhood under watch, a ranked workforce.',
      'Un lieu ou un groupe affecté collectivement, au-delà des individus traités — un quartier surveillé, un effectif classé.',
    ),
  },
}

export const relationshipLegend = (rel: string, loc: Loc): string => tr(REL[rel]?.legend, loc)
export const relationshipLabel = (rel: string, loc: Loc): string => tr(REL[rel]?.a, loc)

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

// The "affected people" symbol is composed in-page (hexagon frame + people),
// mirroring v6's peopleIc so the affected seat matches the other icons.
export const PEOPLE_HEX_PATH =
  'M31.8564 8.8453L19 1.42265C18.3812 1.06538 17.6188 1.06538 17 1.42265L4.14359 8.8453C3.52479 9.20257 3.14359 9.86282 3.14359 10.5774V25.4226C3.14359 26.1372 3.52479 26.7974 4.14359 27.1547L17 34.5774C17.6188 34.9346 18.3812 34.9346 19 34.5774L31.8564 27.1547C32.4752 26.7974 32.8564 26.1372 32.8564 25.4226V10.5774C32.8564 9.86282 32.4752 9.20256 31.8564 8.8453Z'
export const PEOPLE_SYMBOL =
  '<path d="M13.5 10.6667C15.1569 10.6667 16.5 12.0098 16.5 13.6667C16.5 15.3235 15.1569 16.6667 13.5 16.6667C11.8431 16.6667 10.5 15.3235 10.5 13.6667C10.5 12.0098 11.8431 10.6667 13.5 10.6667Z"/><path d="M22.5 10.6667C24.1569 10.6667 25.5 12.0098 25.5 13.6667C25.5 15.3235 24.1569 16.6667 22.5 16.6667C20.8431 16.6667 19.5 15.3235 19.5 13.6667C19.5 12.0098 20.8431 10.6667 22.5 10.6667Z"/><path d="M13.5 18C10.1863 18 7.5 20.6863 7.5 24V25.3333H19.5V24C19.5 20.6863 16.8137 18 13.5 18Z"/><path d="M22.5 18C21.9316 18 21.3818 18.0791 20.8608 18.2266C22.1863 19.7061 23 21.6589 23 24V25.3333H28.5V24C28.5 20.6863 25.8137 18 22.5 18Z"/>'
