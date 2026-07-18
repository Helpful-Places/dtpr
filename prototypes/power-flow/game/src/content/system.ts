import type { SystemCardId } from './types';

export type CategoryKey =
  | 'purpose' | 'accountable' | 'affected' | 'functional_modes' | 'processing'
  | 'input_dataset' | 'output_dataset' | 'storage' | 'access' | 'retention'
  | 'risks_mitigation' | 'rights';

export type Shape = 'hexagon' | 'circle' | 'rounded-square' | 'octagon';
export type Family = 'who' | 'data' | 'where' | 'people';

export const CAT: Record<CategoryKey, { shape: Shape; fam: Family; label: string }> = {
  purpose: { shape: 'hexagon', fam: 'who', label: 'Purpose' },
  accountable: { shape: 'hexagon', fam: 'who', label: 'Accountable' },
  affected: { shape: 'hexagon', fam: 'people', label: 'People affected' },
  functional_modes: { shape: 'hexagon', fam: 'who', label: 'Functional Modes' },
  processing: { shape: 'circle', fam: 'data', label: 'Algorithm / Model' },
  input_dataset: { shape: 'circle', fam: 'data', label: 'Input Data' },
  output_dataset: { shape: 'circle', fam: 'data', label: 'Output Data' },
  storage: { shape: 'rounded-square', fam: 'where', label: 'Storage' },
  access: { shape: 'rounded-square', fam: 'where', label: 'Access' },
  retention: { shape: 'rounded-square', fam: 'where', label: 'Retention' },
  risks_mitigation: { shape: 'octagon', fam: 'people', label: 'Risks & Mitigation' },
  rights: { shape: 'octagon', fam: 'people', label: 'Rights' },
};

export interface SystemCardDef {
  id: SystemCardId;
  cat: CategoryKey;
  /** live DTPR element id for the composed icon (api.dtpr.io); null → shape badge only */
  icon: string | null;
  nm: string;
  ds: string;
  schema: string;
  startsFaceup?: boolean;
  sealed?: boolean;
  /** which SystemValues field this card displays (for live value chips) */
  valueKeys?: string[];
}

export const SYSTEM_ORDER: SystemCardId[] = [
  'pitch', 'model', 'reads', 'makes', 'lives', 'sees', 'long', 'fineprint', 'error',
];

export const SYSTEM_DEFS: Record<SystemCardId, SystemCardDef> = {
  pitch: {
    id: 'pitch', cat: 'purpose', icon: 'entry', startsFaceup: true,
    nm: 'The Pitch',
    ds: 'Decide who may pass — no paper tickets, no fare inspectors, faster boarding.',
    schema: 'purpose · entry', valueKeys: ['purposes'],
  },
  model: {
    id: 'model', cat: 'functional_modes', icon: 'biometric_recognition',
    nm: 'The Model',
    ds: 'A 1-to-N face matcher: compares every face at the gate against the full rider gallery. No staff in the loop.',
    schema: 'functional_modes · biometric_recognition', valueKeys: ['autonomy'],
  },
  reads: {
    id: 'reads', cat: 'input_dataset', icon: 'input_biometric',
    nm: 'What It Reads',
    ds: 'Your live face — every rider, every tap, enrolled or not.',
    schema: 'input_dataset · input_biometric', valueKeys: ['enrollment'],
  },
  makes: {
    id: 'makes', cat: 'output_dataset', icon: 'output_decision',
    nm: 'What It Makes',
    ds: 'Match + rider ID + time + station: a movement log of the city, one tap at a time.',
    schema: 'output_dataset', valueKeys: ['outputLog'],
  },
  lives: {
    id: 'lives', cat: 'storage', icon: 'stored_on_3rd_party_cloud',
    nm: 'Where It Lives',
    ds: 'FaceGate Inc.’s cloud. Your face template leaves the station the moment it’s made.',
    schema: 'storage · stored_on_3rd_party_cloud', valueKeys: ['storage'],
  },
  sees: {
    id: 'sees', cat: 'access', icon: 'available_to_vendor',
    nm: 'Who Sees It',
    ds: 'Transit staff, FaceGate Inc. — and police on request. No warrant required in the current MOU.',
    schema: 'access · available_to_vendor', valueKeys: ['policeAccess'],
  },
  long: {
    id: 'long', cat: 'retention', icon: 'data_retained',
    nm: 'How Long',
    ds: 'Seven years. The standard records schedule, applied to faces.',
    schema: 'retention · data_retained', valueKeys: ['retention'],
  },
  fineprint: {
    id: 'fineprint', cat: 'accountable', icon: 'organization',
    nm: 'The Fine Print',
    ds: 'The contract: FaceGate retains match data. Accuracy numbers are proprietary.',
    schema: 'accountable · role: vendor', valueKeys: ['dataOwner'],
  },
  error: {
    id: 'error', cat: 'risks_mitigation', icon: 'civil_liberties_harm', sealed: true,
    nm: 'The Error Rate',
    ds: 'False matches are not evenly distributed. The gate is wrong more often about the faces it was trained on least.',
    schema: 'risks_mitigation · civil_liberties_harm',
  },
};

/** Display labels for live SystemValues chips (struck-through pre-redesign value in UI). */
export const VALUE_LABELS: Record<string, Record<string, string>> = {
  autonomy: { autonomous: 'Autonomous', human_executes: 'Human executes' },
  retention: { years7: '7 years', hours24: '24 hours' },
  storage: { vendorCloud: 'FaceGate cloud', onDevice: 'On-device' },
  policeAccess: { onRequest: 'Police on request', warrantOnly: 'Warrant only' },
  outputLog: { movementLog: 'Movement log', passOnly: 'Pass / no-pass' },
  enrollment: { everyRider: 'Every rider', enrolledOnly: 'Enrolled only' },
  dataOwner: { vendor: 'Vendor’s data', city: 'City’s data' },
};
