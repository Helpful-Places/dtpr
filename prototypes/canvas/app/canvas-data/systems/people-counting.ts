import { t } from '../loc'
import type { CanvasSystem, SystemContent } from '../types'

// DOT-NUM-58 — Sidewalk people-counting sensor (v6 system 3).
const content: SystemContent = {
  ref: 'DOT-NUM-58',
  name: t('Sidewalk people-counting sensor', 'Capteur de comptage des passants'),
  read: t(
    'City DOT runs a curbside sensor to plan mobility. It counts passers-by incidentally and anonymizes on the device — no images leave the pole.',
    'La voirie municipale exploite un capteur de trottoir pour planifier la mobilité. Il compte les passants de façon incidente et anonymise sur l’appareil — aucune image ne quitte le mât.',
  ),
  purpose: { id: 'mobility', t: t('Mobility', 'Mobilité') },
  builtby: {
    el: 'organization',
    name: 'Numina',
    role: t('Vendor', 'Fournisseur'),
    verb: t('built this system.', 'a conçu ce système.'),
  },
  runby: {
    el: 'institution',
    name: 'City DOT',
    role: t('Deployer', 'Déployeur'),
    verb: t('operates the system here.', 'exploite le système ici.'),
  },
  modes: [{ id: 'perceptive_mode', t: t('Sensing', 'Perception'), s: t('Perceptive AI', 'IA perceptive') }],
  autonomy: { id: 'human_decides' },
  input: {
    id: 'input_about_behaviour',
    type: t('About behaviour', 'Comportement'),
    instance: t('live video of passers-by', 'vidéo en direct des passants'),
    pii: 'identifiable',
    facts: [t('anonymized on the device', 'anonymisée sur l’appareil'), t('no video kept', 'aucune vidéo conservée')],
  },
  processing: {
    id: 'computer_vision',
    type: t('Computer Vision', 'Vision par ordinateur'),
    instance: t('object counting', 'comptage d’objets'),
  },
  output: {
    id: 'output_about_a_measurement',
    type: t('About a measurement', 'Mesure'),
    instance: t('counts — no images', 'des comptages, sans image'),
    pii: 'de_identified',
    facts: [t('stored on device, sent to the city', 'stockés sur l’appareil, envoyés à la ville'), t('open for download', 'en libre téléchargement')],
  },
  risks: [
    {
      harm: 'civil_liberties_harm',
      title: t('Civil liberties harm', 'Atteinte aux libertés'),
      narrative: t(
        'Re-identification would be possible if raw video were ever kept.',
        'Une ré-identification serait possible si la vidéo brute était conservée.',
      ),
      mitigation: t('Anonymized on the device; images discarded', 'Anonymisation sur l’appareil ; images supprimées'),
    },
  ],
  usedon: {
    who: t('Passers-by', 'Les passants'),
    scale: t('anyone crossing the sidewalk', 'quiconque traverse le trottoir'),
    rel: 'bystander',
  },
  rights: [
    {
      id: 'right_to_notice',
      t: t('Right to Be Informed of AI Use', 'Droit d’être informé de l’usage de l’IA'),
      s: t('signage at the pole', 'panneau sur le mât'),
      acts: [{ type: 'url', label: t('View this system’s public page', 'Voir la page publique'), target: 'https://dtpr.ai' }],
    },
    {
      id: 'right_purpose_limitation',
      t: t('Right to Purpose Limitation', 'Droit à la limitation des finalités'),
      s: t('counts, for planning only', 'comptages, planification seule'),
      acts: [{ type: 'email', label: t('Report a misuse', 'Signaler un usage abusif'), target: 'privacy@citydot.example' }],
    },
  ],
  escalate: {
    k: t('If that fails — city services', 'En cas d’échec — services municipaux'),
    acts: [{ type: 'phone', label: t('Call 311', 'Appeler le 311'), target: '311' }],
  },
}

// Version 2 — restyled onto ai@2026-08-24-beta: the curbside camera gets
// its own collection seat. Deliberately no manifestation — passers-by
// never encounter this system's output directly (counts go to planners),
// which exercises the optional downstream end.
const content2: SystemContent = {
  ...content,
  schema: 'ai@2026-08-24-beta',
  modes: [
    { id: 'senses', t: t('Senses', 'Perçoit'), s: t('counts passers-by in live video', 'compte les passants en vidéo') },
  ],
  collection: {
    id: 'camera',
    type: t('Camera', 'Caméra'),
    instance: t('curbside camera on the pole', 'caméra de trottoir sur le mât'),
    facts: [t('images processed on the device', 'images traitées sur l’appareil')],
  },
}

export const peopleCounting: CanvasSystem = {
  systemKey: 'people-counting',
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
