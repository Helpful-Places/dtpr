import { t } from '../loc'
import type { CanvasSystem, SystemContent } from '../types'

// PD-HSP-12 — Predictive patrol allocation (v6 system 4).
const content: SystemContent = {
  ref: 'PD-HSP-12',
  name: t('Predictive patrol allocation', 'Répartition prédictive des patrouilles'),
  read: t(
    'City Police runs a hotspot model that steers patrols. No single person is scored — but a whole neighbourhood is put under heightened watch.',
    'La police municipale exploite un modèle de points chauds qui oriente les patrouilles. Aucune personne n’est notée individuellement — mais tout un quartier est placé sous surveillance renforcée.',
  ),
  purpose: { id: 'enforcement', t: t('Enforcement', 'Application de la loi') },
  builtby: {
    el: 'organization',
    name: 'PredictOps',
    role: t('Vendor', 'Fournisseur'),
    verb: t('built this system.', 'a conçu ce système.'),
  },
  runby: {
    el: 'institution',
    name: 'City Police',
    role: t('Deployer', 'Déployeur'),
    verb: t('operates this system here.', 'exploite ce système ici.'),
  },
  modes: [{ id: 'analytical_mode', t: t('Deciding', 'Décision'), s: t('Analytical AI', 'IA analytique') }],
  autonomy: { id: 'human_decides' },
  input: {
    id: 'input_operational_data',
    type: t('Operational data', 'Données opérationnelles'),
    instance: t('past incident logs', 'historique des incidents'),
    pii: 'pseudonymous',
    facts: [t('kept for 2 years', 'conservées 2 ans'), t('on police servers', 'sur les serveurs de la police')],
  },
  processing: {
    id: 'clustering_segmentation',
    type: t('Clustering & Segmentation', 'Regroupement et segmentation'),
    instance: t('hotspot map', 'carte des points chauds'),
  },
  output: {
    id: 'output_recommendation',
    type: t('A recommendation or prediction', 'Une recommandation ou prédiction'),
    instance: t('a patrol heat-map', 'une carte de chaleur des patrouilles'),
    pii: 'de_identified',
    facts: [t('shared with patrol command', 'transmise au commandement des patrouilles')],
  },
  risks: [
    {
      harm: 'societal_cultural_harm',
      title: t('Societal & cultural harm', 'Préjudice social et culturel'),
      narrative: t(
        'Feedback loops entrench over-policing of the same blocks.',
        'Des boucles de rétroaction ancrent le surcontrôle des mêmes quartiers.',
      ),
      mitigation: t('Quarterly bias audit', 'Audit trimestriel des biais'),
    },
  ],
  usedon: {
    who: t('Precinct 7 residents', 'Les habitants du secteur 7'),
    count: 40000,
    noun: t('residents', 'habitants'),
    rel: 'community',
  },
  rights: [
    {
      id: 'right_to_notice',
      t: t('Right to Be Informed of AI Use', 'Droit d’être informé de l’usage de l’IA'),
      s: t('annual transparency report', 'rapport annuel de transparence'),
      acts: [{ type: 'url', label: t('Read the report', 'Lire le rapport'), target: 'https://citypolice.example/ai-report' }],
    },
    {
      id: 'right_algorithmic_transparency',
      t: t('Right to Algorithmic Transparency', 'Droit à la transparence algorithmique'),
      s: t('community oversight board', 'comité de surveillance citoyen'),
      acts: [
        { type: 'email', label: t('Write to the board', 'Écrire au comité'), target: 'board@police-oversight.example' },
        { type: 'url', label: t('Attend the next meeting', 'Assister à la prochaine réunion'), target: 'https://police-oversight.example/meetings' },
      ],
    },
  ],
  escalate: {
    k: t('If that fails — independent oversight', 'En cas d’échec — contrôle indépendant'),
    acts: [{ type: 'form', label: t('File with the Inspector General', 'Saisir l’inspecteur général'), target: 'https://oig.city.example/complaints' }],
  },
}

export const patrolAllocation: CanvasSystem = {
  systemKey: 'patrol-allocation',
  variants: [
    {
      variantKey: 'v6',
      label: t('Power canvas', 'Panneau'),
      live: true,
      versions: [{ versionKey: '1', content }],
    },
  ],
}
