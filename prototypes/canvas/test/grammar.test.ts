import { describe, it, expect } from 'vitest'
import {
  dataStack,
  dataTag,
  autonomyTag,
  peopleStack,
  orgStack,
  riskView,
  sentence,
  dataSentence,
  processingSentence,
  peopleSentence,
  orgSentence,
  mk,
  CLASSIFICATION_COLOR,
  type Segment,
} from '../app/canvas-data/grammar'
import type { DataPiece, PeoplePiece, OrgPiece, RiskPiece, SystemContent } from '../app/canvas-data/types'
import { t } from '../app/canvas-data/loc'

// Flatten segments to a readable string, marks bracketed, for text assertions.
const flat = (segs: Segment[]): string =>
  segs.map(s => (s.kind === 'text' ? s.text : `[${s.mark.text}]`)).join('')
// The coloured marks in order, for colour-policy assertions.
const marks = (segs: Segment[]) => segs.flatMap(s => (s.kind === 'mark' ? [s.mark] : []))

// Characterizes the v6 A-stack + marker/colour output the in-app renderer
// must match before any restyle (U3 execution note). The marker/colour
// policy — colour only on PII + autonomy, neutral everywhere else — is the
// R11/R12 contract enforced here.

describe('marker colour policy (U3)', () => {
  it('colours identifiable PII yellow and de-identified blue', () => {
    expect(mk('x', 'identifiable').color).toBe('#FFD700')
    expect(mk('x', 'de_identified').color).toBe('#4A90D9')
    expect(mk('x', 'pseudonymous').color).toBe('#9575CD')
  })

  it('colours autonomy values by the published palette', () => {
    expect(mk('x', 'autonomous').color).toBe(CLASSIFICATION_COLOR.autonomous)
    expect(mk('x', 'human_decides').color).toBe(CLASSIFICATION_COLOR.human_decides)
    expect(mk('x', 'human_executes').color).toBe(CLASSIFICATION_COLOR.human_executes)
  })

  it('renders neutral (no colour) for relationships, harm types, and plain values', () => {
    expect(mk('x', null).color).toBeNull()
    expect(mk('x').color).toBeNull()
    expect(mk('x', 'subject').color).toBeNull() // relationship is not in the palette
  })
})

describe('data grammar A-stack (U3)', () => {
  const input: DataPiece = {
    id: 'input_biometric',
    type: t('Biometric', 'Biométrie'),
    instance: t('your face', 'votre visage'),
    pii: 'identifiable',
    facts: [t('kept for 24 h', 'conservées 24 h'), t('on a vendor cloud', 'sur le cloud')],
  }

  it('leads with the instance and types the value; PII no longer an inline mark', () => {
    const a = dataStack(input, 'en')
    expect(a.headline).toBe('your face')
    expect(a.label).toBe('Biometric')
    expect(a.mark).toBeNull() // PII rides out to dataTag now
    expect(a.facts).toEqual(['kept for 24 h', 'on a vendor cloud'])
  })

  it('degrades a processing piece with no classification to headline + type', () => {
    const processing: DataPiece = {
      id: 'biometric_recognition',
      type: t('Biometric Recognition', 'Reconnaissance biométrique'),
      instance: t('face match', 'correspondance faciale'),
    }
    const a = dataStack(processing, 'en')
    expect(a.headline).toBe('face match')
    expect(a.label).toBe('Biometric Recognition')
    expect(a.mark).toBeNull()
    expect(a.facts).toEqual([])
  })

  it('resolves the French locale', () => {
    expect(dataStack(input, 'fr').headline).toBe('votre visage')
    expect(dataStack(input, 'fr').label).toBe('Biométrie')
  })
})

describe('data PII tag (U2)', () => {
  const input: DataPiece = {
    id: 'input_biometric',
    type: t('Biometric', 'Biométrie'),
    instance: t('your face', 'votre visage'),
    pii: 'identifiable',
  }

  it('renders the PII classification as a coloured tag', () => {
    expect(dataTag(input, 'en')).toEqual({ text: 'Identifiable', color: '#FFD700' })
    expect(dataTag(input, 'fr')).toEqual({ text: 'Données identifiables', color: '#FFD700' })
  })

  it('returns null for a piece with no PII (e.g. the processing step)', () => {
    const processing: DataPiece = { id: 'x', type: t('Recognition', 'R'), instance: t('match', 'm') }
    expect(dataTag(processing, 'en')).toBeNull()
  })
})

describe('people grammar A-stack (U3)', () => {
  it('leads with the group, marks the relationship neutrally, trails the scale', () => {
    const p: PeoplePiece = { who: t('All riders', 'Tous'), count: 2300000, noun: t('people', 'personnes'), per: t('a day', 'par jour'), rel: 'subject' }
    const a = peopleStack(p, 'en')
    expect(a.headline).toBe('All riders')
    expect(a.label).toBeUndefined()
    expect(a.mark).toEqual({ text: 'Decided about', color: null })
    expect(a.facts).toEqual(['~2.3M people a day'])
  })

  it('uses the scale phrase when there is no count', () => {
    const p: PeoplePiece = { who: t('Passers-by', 'Passants'), scale: t('anyone crossing', 'quiconque'), rel: 'bystander' }
    expect(peopleStack(p, 'en').facts).toEqual(['anyone crossing'])
  })
})

describe('org grammar A-stack (U3)', () => {
  it('leads with the name and labels the role, no mark', () => {
    const o: OrgPiece = { el: 'institution', name: 'Metro Transit', role: t('Deployer', 'Déployeur'), verb: t('operates.', 'exploite.') }
    const a = orgStack(o, 'en')
    expect(a.headline).toBe('Metro Transit')
    expect(a.label).toBe('Deployer')
    expect(a.mark).toBeNull()
  })
})

describe('risk grammar (U3)', () => {
  const risk: RiskPiece = { harm: 'financial_harm', title: t('Financial harm', 'Préjudice'), narrative: t('A wrong score denies benefits.', 'Un score erroné.'), mitigation: null }

  it('leads with the harm title and narrative, flags a missing mitigation', () => {
    const v = riskView(risk, 'en')
    expect(v.title).toBe('Financial harm')
    expect(v.narrative).toBe('A wrong score denies benefits.')
    expect(v.mitigation).toBeNull()
  })

  it('carries the mitigation when present', () => {
    const v = riskView({ ...risk, mitigation: t('Human review', 'Examen') }, 'en')
    expect(v.mitigation).toBe('Human review')
  })
})

describe('data C-sentence (U2)', () => {
  const input: DataPiece = {
    id: 'input_biometric',
    type: t('Biometric', 'Biométrie'),
    instance: t('your face', 'votre visage'),
    pii: 'identifiable',
    facts: [t('kept for 24 h', 'conservées 24 h'), t('on a vendor cloud', 'sur le cloud')],
  }

  it('composes "Type (instance) is facts" with no PII (it lives in the tag now)', () => {
    const segs = dataSentence(input, 'en')
    expect(flat(segs)).toBe('Biometric ([your face]) is [kept for 24 h] and [on a vendor cloud]')
    // instance + facts are neutral; the PII classification is no longer in the line.
    expect(marks(segs).every(m => m.color === null)).toBe(true)
  })

  it('omits the facts clause when there are none', () => {
    const noFacts: DataPiece = { id: 'x', type: t('Type', 'Type'), instance: t('val', 'val'), pii: 'de_identified' }
    expect(flat(dataSentence(noFacts, 'en'))).toBe('Type ([val])')
  })
})

describe('processing C-sentence (U2)', () => {
  const processing: DataPiece = {
    id: 'biometric_recognition',
    type: t('Biometric Recognition', 'Reconnaissance biométrique'),
    instance: t('face match', 'correspondance faciale'),
  }

  it('reads as an action sentence — "The system runs {type} ({instance})"', () => {
    expect(flat(processingSentence(processing, 'en'))).toBe('The system runs Biometric Recognition ([face match])')
    // the instance is a neutral mark; processing carries no coloured classification.
    expect(marks(processingSentence(processing, 'en')).every(m => m.color === null)).toBe(true)
  })

  it('resolves the French locale', () => {
    expect(flat(processingSentence(processing, 'fr'))).toBe('Le système exécute Reconnaissance biométrique ([correspondance faciale])')
  })
})

describe('people C-sentence (U2)', () => {
  it('composes "Who (scale) — relationship — tail" with a neutral relationship', () => {
    const p: PeoplePiece = { who: t('All riders', 'Tous'), count: 2300000, noun: t('people', 'personnes'), per: t('a day', 'par jour'), rel: 'subject' }
    const segs = peopleSentence(p, 'en')
    expect(flat(segs)).toBe('[All riders] ([~2.3M people a day]) are [decided about] — the system’s output affects each of them directly.')
    // who, scale, and the relationship are all neutral — no colour on the affected seat.
    expect(marks(segs).every(m => m.color === null)).toBe(true)
  })

  it('drops the scale clause when there is no count or scale', () => {
    const p: PeoplePiece = { who: t('Residents', 'Habitants'), rel: 'community' }
    expect(flat(peopleSentence(p, 'en'))).toBe('[Residents] are [a wider community] — affected together, beyond any one person it processes.')
  })
})

describe('org C-sentence (U2)', () => {
  it('composes "Name (Role) — verb", the name a neutral mark', () => {
    const o: OrgPiece = { el: 'institution', name: 'Metro Transit', role: t('Deployer', 'Déployeur'), verb: t('operates this system here.', 'exploite ce système ici.') }
    const segs = orgSentence(o, 'en')
    expect(flat(segs)).toBe('[Metro Transit] (Deployer) operates this system here.')
    expect(marks(segs).map(m => m.color)).toEqual([null])
  })
})

describe('system sentence (U3)', () => {
  const base = { modes: [{ id: 'analytical_mode', t: t('Deciding', 'Décision'), s: t('Analytical AI', 'IA') }] } as Partial<SystemContent>

  it('colours the autonomy phrase and composes the verb', () => {
    const segs = sentence({ ...base, autonomy: { id: 'autonomous' } } as SystemContent, 'en')
    // text · autonomy mark · text
    expect(segs[0]).toEqual({ kind: 'text', text: 'The system decides ' })
    expect(segs[1]).toEqual({ kind: 'mark', mark: { text: 'on its own', color: CLASSIFICATION_COLOR.autonomous } })
    expect(segs[2]).toEqual({ kind: 'text', text: '.' })
  })

  it('switches the verb and phrase under human_decides', () => {
    const segs = sentence({ ...base, autonomy: { id: 'human_decides' } } as SystemContent, 'en')
    const text = segs.map(s => (s.kind === 'text' ? s.text : `[${s.mark.text}]`)).join('')
    expect(text).toBe('The system recommends, and [a person decides what to do next].')
    const mark = segs.find(s => s.kind === 'mark')
    expect(mark && mark.kind === 'mark' && mark.mark.color).toBe(CLASSIFICATION_COLOR.human_decides)
  })

  it('composes multiple modes into a conjoined verb list', () => {
    const segs = sentence({
      modes: [
        { id: 'perceptive_mode', t: t('Sensing', 'S'), s: t('Perceptive', 'P') },
        { id: 'analytical_mode', t: t('Deciding', 'D'), s: t('Analytical', 'A') },
      ],
      autonomy: { id: 'autonomous' },
    } as SystemContent, 'en')
    const text = segs.map(s => (s.kind === 'text' ? s.text : `[${s.mark.text}]`)).join('')
    expect(text).toBe('The system senses and decides [on its own].')
  })

  it('falls back to the mode label when a mode has no verb entry', () => {
    const segs = sentence({
      modes: [{ id: 'unknown_mode', t: t('Whirring', 'W'), s: t('X', 'X') }],
      autonomy: { id: 'autonomous' },
    } as SystemContent, 'en')
    const text = segs.map(s => (s.kind === 'text' ? s.text : `[${s.mark.text}]`)).join('')
    expect(text).toBe('The system whirring [on its own].')
  })
})

describe('autonomy tag (U2)', () => {
  it('renders the autonomy classification as a coloured tag, by locale', () => {
    const sys = { autonomy: { id: 'autonomous' } } as SystemContent
    expect(autonomyTag(sys, 'en')).toEqual({ text: 'Runs on its own', color: CLASSIFICATION_COLOR.autonomous })
    expect(autonomyTag(sys, 'fr')).toEqual({ text: 'Fonctionne seul', color: CLASSIFICATION_COLOR.autonomous })
  })

  it('colours by the published autonomy palette across values', () => {
    expect(autonomyTag({ autonomy: { id: 'human_decides' } } as SystemContent, 'en'))
      .toEqual({ text: 'A person decides', color: CLASSIFICATION_COLOR.human_decides })
    expect(autonomyTag({ autonomy: { id: 'human_executes' } } as SystemContent, 'en'))
      .toEqual({ text: 'Human executes', color: CLASSIFICATION_COLOR.human_executes })
    // ai@2026-08-24-beta renames human_executes → human_oversees; same colour.
    expect(autonomyTag({ autonomy: { id: 'human_oversees' } } as SystemContent, 'en'))
      .toEqual({ text: 'A person oversees', color: CLASSIFICATION_COLOR.human_executes })
  })
})

describe('ai@2026-08-24-beta action verbs (system sentence)', () => {
  const flatten = (segs: Segment[]) =>
    segs.map(s => (s.kind === 'text' ? s.text : `[${s.mark.text}]`)).join('')

  it('composes the new verb ids without autonomy swaps — Recommends is its own verb', () => {
    const segs = sentence({
      modes: [
        { id: 'predicts', t: t('Predicts', 'Prédit'), s: t('x', 'x') },
        { id: 'recommends', t: t('Recommends', 'Recommande'), s: t('x', 'x') },
      ],
      autonomy: { id: 'human_decides' },
    } as SystemContent, 'en')
    expect(flatten(segs)).toBe('The system predicts and recommends, and [a person decides what to do next].')
  })

  it('composes senses + identifies + decides under full autonomy', () => {
    const segs = sentence({
      modes: [
        { id: 'senses', t: t('Senses', 'Perçoit'), s: t('x', 'x') },
        { id: 'identifies', t: t('Identifies', 'Identifie'), s: t('x', 'x') },
        { id: 'decides', t: t('Decides', 'Décide'), s: t('x', 'x') },
      ],
      autonomy: { id: 'autonomous' },
    } as SystemContent, 'en')
    expect(flatten(segs)).toBe('The system senses, identifies, and decides [on its own].')
  })

  it('renders the human_oversees template', () => {
    const segs = sentence({
      modes: [{ id: 'predicts', t: t('Predicts', 'Prédit'), s: t('x', 'x') }],
      autonomy: { id: 'human_oversees' },
    } as SystemContent, 'en')
    expect(flatten(segs)).toBe('The system predicts, and [a person oversees or carries it out].')
  })
})
