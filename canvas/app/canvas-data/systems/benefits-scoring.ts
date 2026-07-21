import { t } from '../loc'
import type { CanvasSystem, SystemContent } from '../types'

// CB-ELG-207 — Benefits eligibility scoring (v6 system 2).
const content: SystemContent = {
  ref: 'CB-ELG-207',
  name: t('Benefits eligibility scoring', 'Évaluation de l’admissibilité aux aides'),
  read: t(
    'The County Benefits Dept. runs a vendor risk score that a caseworker acts on. It decides applicants’ benefits — with no notice and no appeal.',
    'Le service des aides du comté exploite un score de risque fourni par un prestataire, sur lequel un agent s’appuie. Il décide des aides des demandeurs — sans notification ni recours.',
  ),
  purpose: { id: 'eligibility_benefits', t: t('Eligibility & Public Benefits', 'Admissibilité et aides publiques') },
  builtby: {
    el: 'organization',
    name: 'RiskModel Co.',
    role: t('Vendor', 'Fournisseur'),
    verb: t('built this system.', 'a conçu ce système.'),
  },
  runby: {
    el: 'institution',
    name: 'County Benefits Dept.',
    role: t('Deployer', 'Déployeur'),
    verb: t('operates the system here.', 'exploite le système ici.'),
  },
  modes: [{ id: 'analytical_mode', t: t('Deciding', 'Décision'), s: t('Analytical AI', 'IA analytique') }],
  autonomy: { id: 'human_executes' },
  input: {
    id: 'input_sensitive_personal',
    type: t('Sensitive personal information', 'Renseignements personnels sensibles'),
    instance: t('your case records', 'votre dossier'),
    pii: 'identifiable',
    facts: [t('kept for 7 years', 'conservé 7 ans'), t('on county servers', 'sur les serveurs du comté')],
  },
  processing: {
    id: 'classification_prediction',
    type: t('Classification & Prediction', 'Classification et prédiction'),
    instance: t('risk score', 'score de risque'),
  },
  output: {
    id: 'output_recommendation',
    type: t('A recommendation or prediction', 'Une recommandation ou prédiction'),
    instance: t('a risk score', 'un score de risque'),
    pii: 'identifiable',
    facts: [t('shared with the vendor and caseworkers', 'transmis au prestataire et aux agents')],
  },
  risks: [
    {
      harm: 'financial_harm',
      title: t('Financial & business harm', 'Préjudice financier'),
      narrative: t(
        'A wrong score can deny someone the benefits they depend on.',
        'Un score erroné peut priver une personne des aides dont elle dépend.',
      ),
      mitigation: null,
    },
  ],
  usedon: {
    who: t('Benefit applicants', 'Les demandeurs d’aide'),
    scale: t('every applicant is scored', 'chaque demandeur est évalué'),
    rel: 'subject',
  },
  rights: [],
  escalate: {
    k: t('The operator lists no path — outside routes still exist', 'L’exploitant n’indique aucun recours — des voies externes existent'),
    acts: [
      { type: 'email', label: t('Email the State Benefits Ombudsman', 'Écrire au médiateur des aides'), target: 'ombudsman@benefits.state.example' },
      { type: 'form', label: t('File with the Privacy Commissioner', 'Saisir le commissaire à la vie privée'), target: 'https://privacy.state.example/complaints' },
    ],
  },
}

export const benefitsScoring: CanvasSystem = {
  systemKey: 'benefits-scoring',
  variants: [
    {
      variantKey: 'v6',
      label: t('Power canvas', 'Panneau'),
      live: true,
      versions: [{ versionKey: '1', content }],
    },
  ],
}
