import { t } from '../loc'
import type { CanvasSystem, SystemContent } from '../types'

// MT-FG-104 — Face-matching fare gates (v6 system 1).
const content: SystemContent = {
  ref: 'MT-FG-104',
  name: t('Face-matching fare gates', 'Portiques à reconnaissance faciale'),
  read: t(
    'Metro Transit runs face-matching gates that decide on their own who may pass. Used on every rider; riders can opt out and ask for a human review.',
    'Metro Transit exploite des portiques à reconnaissance faciale qui décident seuls qui peut passer. Utilisé sur chaque voyageur ; les voyageurs peuvent refuser et demander un examen humain.',
  ),
  purpose: { id: 'entry', t: t('Entry', 'Accès') },
  builtby: {
    el: 'organization',
    name: 'FaceGate Inc.',
    role: t('Vendor', 'Fournisseur'),
    verb: t('built this system.', 'a conçu ce système.'),
  },
  runby: {
    el: 'institution',
    name: 'Metro Transit',
    role: t('Deployer', 'Déployeur'),
    verb: t('operates the system here.', 'exploite le système ici.'),
  },
  modes: [
    { id: 'perceptive_mode', t: t('Sensing', 'Perception'), s: t('Perceptive AI', 'IA perceptive') },
    { id: 'analytical_mode', t: t('Deciding', 'Décision'), s: t('Analytical AI', 'IA analytique') },
  ],
  autonomy: { id: 'autonomous' },
  input: {
    id: 'input_biometric',
    type: t('Biometric', 'Biométrie'),
    instance: t('your face', 'votre visage'),
    pii: 'identifiable',
    facts: [t('kept for 24 h', 'conservé 24 h'), t('on a vendor cloud', 'sur le cloud d’un fournisseur')],
  },
  processing: {
    id: 'biometric_recognition',
    type: t('Biometric Recognition', 'Reconnaissance biométrique'),
    instance: t('face match', 'correspondance faciale'),
  },
  output: {
    id: 'output_decision',
    type: t('A decision about you', 'Une décision vous concernant'),
    instance: t('match / no-match', 'correspondance ou non'),
    pii: 'identifiable',
    facts: [t('shared with transit police', 'transmise à la police des transports')],
  },
  risks: [
    {
      harm: 'civil_liberties_harm',
      title: t('Civil liberties harm', 'Atteinte aux libertés'),
      narrative: t(
        'A misidentification can stop the wrong person at the gate.',
        'Une erreur d’identification peut bloquer la mauvaise personne au portique.',
      ),
      mitigation: t('Human review on request', 'Examen humain sur demande'),
    },
  ],
  usedon: {
    who: t('All riders', 'Tous les voyageurs'),
    count: 2300000,
    noun: t('people', 'personnes'),
    per: t('a day', 'par jour'),
    rel: 'subject',
  },
  rights: [
    {
      id: 'right_object',
      t: t('Right to Stop Processing', 'Droit d’arrêter le traitement'),
      s: t('opt out, tap a card instead', 'refuser, utiliser une carte'),
      acts: [
        { type: 'url', label: t('Get a fare card', 'Obtenir une carte'), target: 'https://metrotransit.example/farecard' },
      ],
    },
    {
      id: 'right_contest',
      t: t('Right to Contest', 'Droit de contester'),
      s: t('challenge a match', 'contester une correspondance'),
      acts: [
        { type: 'form', label: t('Start an appeal', 'Déposer un recours'), target: 'https://metrotransit.example/appeals' },
      ],
    },
    {
      id: 'right_to_human_review',
      t: t('Right to a Human Review', 'Droit à un examen humain'),
      acts: [
        { type: 'email', label: t('Email the review desk', 'Écrire au service d’examen'), target: 'review@metrotransit.example' },
      ],
    },
  ],
  escalate: {
    k: t('If that fails — independent oversight', 'En cas d’échec — contrôle indépendant'),
    acts: [
      { type: 'email', label: t('Email the Transit Ombudsman', 'Écrire au médiateur des transports'), target: 'complaints@transitombudsman.example' },
    ],
  },
}

// Version 2 — restyled onto ai@2026-08-24-beta: the action verbs replace
// the six modes (Identifies is the load-bearing addition here), and the
// data flow gains its two ends — the camera that captures (collection)
// and the gate that moves (manifestation).
const content2: SystemContent = {
  ...content,
  schema: 'ai@2026-08-24-beta',
  modes: [
    { id: 'senses', t: t('Senses', 'Perçoit'), s: t('reads the camera at the gate', 'lit la caméra du portique') },
    { id: 'identifies', t: t('Identifies', 'Identifie'), s: t('matches your face to your fare account', 'associe votre visage à votre compte') },
    { id: 'decides', t: t('Decides', 'Décide'), s: t('opens the gate — or not', 'ouvre le portique — ou non') },
  ],
  collection: {
    id: 'camera',
    type: t('Camera', 'Caméra'),
    instance: t('gate camera at eye level', 'caméra du portique à hauteur des yeux'),
    facts: [t('at every fare gate', 'à chaque portique')],
  },
  manifestation: {
    id: 'gate_barrier_machine',
    type: t('A gate, barrier, or machine', 'Une barrière, un portail ou une machine'),
    instance: t('the gate opens — or stays shut', 'le portique s’ouvre — ou reste fermé'),
  },
}

export const faceGates: CanvasSystem = {
  systemKey: 'face-gates',
  variants: [
    {
      variantKey: 'v6',
      label: t('Power canvas', 'Panneau'),
      live: true,
      versions: [
        { versionKey: '1', content },
        { versionKey: '2', content: content2 },
      ],
    },
  ],
}
