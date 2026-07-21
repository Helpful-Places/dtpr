import { describe, it, expect } from 'vitest'
import {
  dataStack,
  peopleStack,
  orgStack,
  riskView,
  sentence,
  mk,
  CLASSIFICATION_COLOR,
} from '../app/canvas-data/grammar'
import type { DataPiece, PeoplePiece, OrgPiece, RiskPiece, SystemContent } from '../app/canvas-data/types'
import { t } from '../app/canvas-data/loc'

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

  it('leads with the instance, types the value, and colours the PII classification', () => {
    const a = dataStack(input, 'en')
    expect(a.headline).toBe('your face')
    expect(a.label).toBe('Biometric')
    expect(a.mark).toEqual({ text: 'Identifiable', color: '#FFD700' })
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
    expect(dataStack(input, 'fr').mark).toEqual({ text: 'Données identifiables', color: '#FFD700' })
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
