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
  // action (né functional_modes) · autonomy / human involvement
  autonomous: '#E76F51',
  human_decides: '#2A9D8F',
  human_executes: '#6A1B7A',
  // ai@2026-08-24-beta renames human_executes → human_oversees; same colour.
  human_oversees: '#6A1B7A',
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

/** A right-aligned classification tag. Same shape as a Mark, but rendered as
 *  a pill that sits at the far end of a row instead of inline: the published
 *  classification (PII on data, autonomy on the system) is set off from the
 *  reading line so it never breaks the sentence. Palette key → colour. */
export interface Tag {
  text: string
  color: string | null
}
export const tagOf = (text: string, key?: string | null): Tag => ({ text, color: markerColor(key) })

// ── Inline segments for composed lines (the system sentence) ──
export type Segment =
  | { kind: 'text', text: string }
  | { kind: 'mark', mark: Mark }

// ── Classification vocabularies (localized labels resolved by key) ──
// Two densities per label: `a` — the descriptor label used in the compact
// A-stack; `c` — the in-sentence phrasing used by the composed C sentence.
// PII — the coloured classification on data values.
const PII: Record<string, { key: string, a: Localized, c: Localized }> = {
  identifiable: { key: 'identifiable', a: t('Identifiable', 'Données identifiables'), c: t('identifiable', 'données identifiables') },
  de_identified: { key: 'de_identified', a: t('De-identified', 'Données anonymisées'), c: t('de-identified', 'anonymisées') },
  pseudonymous: { key: 'pseudonymous', a: t('Pseudonymous', 'Données pseudonymisées'), c: t('pseudonymous', 'pseudonymisées') },
}

// Affected · relationship — a NEUTRAL classification (key:null → no colour).
// `tail` closes the C sentence with what the relationship means for people.
const REL: Record<string, { key: null, a: Localized, c: Localized, tail: Localized }> = {
  subject: {
    key: null,
    a: t('Decided about', 'Décidé à son sujet'),
    c: t('decided about', 'concernés par une décision'),
    tail: t('the system’s output affects each of them directly.', 'la sortie du système les affecte directement.'),
  },
  bystander: {
    key: null,
    a: t('Caught incidentally', 'Pris de façon incidente'),
    c: t('caught incidentally', 'pris de façon incidente'),
    tail: t('swept into the data; no decision is made about them.', 'intégrés aux données ; aucune décision ne les concerne.'),
  },
  community: {
    key: null,
    a: t('Wider community', 'Communauté élargie'),
    c: t('a wider community', 'une communauté élargie'),
    tail: t('affected together, beyond any one person it processes.', 'affectés collectivement, au-delà de chaque personne traitée.'),
  },
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

/** data — the specific value leads; the type labels it. PII is no longer an
 *  inline mark: it rides out to `dataTag` as a right-aligned tag, so both
 *  densities read cleanly and the classification just sits at the row's end. */
export function dataStack(p: DataPiece, loc: Loc): AStack {
  return {
    headline: tr(p.instance, loc),
    label: tr(p.type, loc),
    mark: null,
    facts: (p.facts || []).map(f => tr(f, loc)),
  }
}

/** data — the PII classification as a right-aligned tag (or `null` when the
 *  value carries no PII, e.g. the processing step). Colour follows the same
 *  policy the inline mark used to: only published classifications earn it. */
export function dataTag(p: DataPiece, loc: Loc): Tag | null {
  return p.pii ? tagOf(tr(PII[p.pii].a, loc), PII[p.pii].key) : null
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

// ── C-sentence builders — the composed sentence density (v6 GRAMMAR.C) ──
// Each returns `Segment[]` (same shape as the system `sentence()`), so the
// renderer treats every composed line uniformly. Deployment values are
// neutral marks; only the published classification (PII) earns colour —
// the relationship stays neutral (the same policy the A-stacks follow).

const DASH: Segment = { kind: 'text', text: ' — ' }
// The data sentence links the value to its facts with a plain verb rather
// than a dash — "your face *is* kept for 24 h …" reads as a sentence.
const IS: Localized = t('is', 'est')
// Processing is an action, not data at rest, so it composes its own sentence
// ("The system runs X (Y)") instead of the value/facts shape.
const RUNS: Localized = t('The system runs', 'Le système exécute')
// The affected sentence links the group to its relationship with a verb
// ("… *are* decided about …") rather than a bare set-off dash.
const ARE: Localized = t('are', 'sont')

/** Join facts as neutral marks with the locale's list separators, so the
 *  trailing clause reads "a, b and c" with each fact set off as a mark. */
function factSegments(facts: string[], loc: Loc): Segment[] {
  return listF(loc).formatToParts(facts).map((part): Segment =>
    part.type === 'element'
      ? { kind: 'mark', mark: mk(part.value, null) }
      : { kind: 'text', text: part.value },
  )
}

/** data — `Type (instance) is facts…`. The PII classification is no longer
 *  part of the sentence (it rides out to `dataTag`), so every data value now
 *  composes a line — input, processing *and* output — instead of only the
 *  PII-bearing ones. The instance and facts are neutral marks. */
export function dataSentence(p: DataPiece, loc: Loc): Segment[] {
  const segs: Segment[] = [
    { kind: 'text', text: `${tr(p.type, loc)} (` },
    { kind: 'mark', mark: mk(tr(p.instance, loc), null) },
    { kind: 'text', text: ')' },
  ]
  const facts = (p.facts || []).map(f => tr(f, loc))
  if (facts.length) segs.push({ kind: 'text', text: ` ${tr(IS, loc)} ` }, ...factSegments(facts, loc))
  return segs
}

/** processing — `The system runs {type} ({instance})`. Unlike input/output
 *  (data at rest, described by facts), the processing step is an *action*, so
 *  it reads as its own sentence rather than the value-and-facts shape. The
 *  instance is a neutral mark, matching how input/output set off their value. */
export function processingSentence(p: DataPiece, loc: Loc): Segment[] {
  return [
    { kind: 'text', text: `${tr(RUNS, loc)} ${tr(p.type, loc)} (` },
    { kind: 'mark', mark: mk(tr(p.instance, loc), null) },
    { kind: 'text', text: ')' },
  ]
}

/** affected — `Who (scale) are relationship — tail`. The relationship is a
 *  neutral mark, joined by a verb so the row reads as a sentence; the tail
 *  closes with what that relationship means for those people. */
export function peopleSentence(p: PeoplePiece, loc: Loc): Segment[] {
  const rel = REL[p.rel]
  const sc = scaleText(p, loc)
  const segs: Segment[] = [{ kind: 'mark', mark: mk(tr(p.who, loc), null) }]
  if (sc) segs.push({ kind: 'text', text: ' (' }, { kind: 'mark', mark: mk(sc, null) }, { kind: 'text', text: ')' })
  segs.push(
    { kind: 'text', text: ` ${tr(ARE, loc)} ` },
    { kind: 'mark', mark: mk(tr(rel.c, loc), rel.key) },
    DASH,
    { kind: 'text', text: tr(rel.tail, loc) },
  )
  return segs
}

/** accountable — `Name (Role) verb`. The name is a neutral mark; the role
 *  reads as an appositive, so the verb follows without a dash. */
export function orgSentence(p: OrgPiece, loc: Loc): Segment[] {
  return [
    { kind: 'mark', mark: mk(tr(p.name, loc), null) },
    { kind: 'text', text: ` (${tr(p.role, loc)}) ${tr(p.verb, loc)}` },
  ]
}

/** The affected relationship's trailing clause — the matrix "Used on" row
 *  pairs the relationship word (from `peopleStack().mark`) with this tail. */
export function relTail(p: PeoplePiece, loc: Loc): string {
  return tr(REL[p.rel].tail, loc)
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
  // ai@2026-05-06-beta modes — autonomy-aware verb swaps compensate for a
  // vocabulary with no advisory verbs of its own.
  perceptive_mode: { d: t('senses', 'détecte') },
  semantic_mode: { d: t('understands', 'comprend') },
  analytical_mode: { d: t('decides', 'décide'), human_decides: t('recommends', 'recommande') },
  generative_mode: { d: t('creates', 'génère'), human_decides: t('drafts', 'rédige') },
  agentic_mode: { d: t('acts', 'agit'), human_executes: t('plans actions', 'planifie des actions'), human_decides: t('proposes actions', 'propose des actions') },
  physical_mode: { d: t('moves', 'se déplace'), human_executes: t('plans movements', 'planifie des mouvements'), human_decides: t('proposes movements', 'propose des mouvements') },
  // ai@2026-08-24-beta action verbs — the schema's ten-verb vocabulary
  // already separates advisory (recommends) from determinative (decides),
  // so no autonomy swaps are needed; the template tail carries the rest.
  senses: { d: t('senses', 'perçoit') },
  identifies: { d: t('identifies', 'identifie') },
  understands: { d: t('understands', 'comprend') },
  predicts: { d: t('predicts', 'prédit') },
  recommends: { d: t('recommends', 'recommande') },
  decides: { d: t('decides', 'décide') },
  creates: { d: t('creates', 'crée') },
  answers: { d: t('answers', 'répond') },
  acts: { d: t('acts', 'agit') },
  moves: { d: t('moves', 'actionne') },
}

const TEMPLATES: Record<AutonomyKey, Localized> = {
  autonomous: t('The system {verbs} *on its own*.', 'Le système {verbs} *tout seul*.'),
  human_executes: t('The system {verbs}, and *a person carries out the result*.', 'Le système {verbs}, et *une personne exécute le résultat*.'),
  human_oversees: t('The system {verbs}, and *a person oversees or carries it out*.', 'Le système {verbs}, et *une personne supervise ou exécute*.'),
  human_decides: t('The system {verbs}, and *a person decides what to do next*.', 'Le système {verbs}, et *une personne décide de la suite*.'),
}

// Autonomy — the published classification, kept *both* inside the sentence
// (the coloured phrase) and as a set-off tag at the row's end. Short labels
// for the tag; the sentence still carries the fuller "on its own" phrasing.
const AUTONOMY: Record<AutonomyKey, Localized> = {
  autonomous: t('Runs on its own', 'Fonctionne seul'),
  human_decides: t('A person decides', 'Une personne décide'),
  human_executes: t('Human executes', 'Exécution humaine'),
  human_oversees: t('A person oversees', 'Supervision humaine'),
}

/** The autonomy classification as a right-aligned tag for the system row. It
 *  duplicates (does not replace) the coloured phrase inside the sentence. */
export function autonomyTag(sys: SystemContent, loc: Loc): Tag {
  const id = sys.autonomy.id
  return tagOf(tr(AUTONOMY[id], loc), id)
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
// Content pins its own schema version (`SystemContent.schema`) so element
// ids resolve against the vocabulary they were authored in; absent → the
// original v6 pin. `VITE_DTPR_API_BASE` points local review at a
// `wrangler dev` API seeded with an unpublished version.
export const DTPR_API_BASE: string = import.meta.env?.VITE_DTPR_API_BASE ?? 'https://api.dtpr.io/api/v2'
export const DEFAULT_SCHEMA = 'ai@2026-05-06-beta'
export const iconUrl = (id: string, schema: string = DEFAULT_SCHEMA): string =>
  `${DTPR_API_BASE}/schemas/${schema}/elements/${id}/icon.svg`
