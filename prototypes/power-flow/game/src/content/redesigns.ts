import type { RedesignId, SystemCardId, SystemValues } from './types';

export interface RedesignDef {
  id: RedesignId;
  nm: string;
  cost: number; // base coins; effective cost may add vendor deltas
  carry: 'pattern' | 'scenario';
  recurring?: boolean; // pays upkeep every round or lapses
  swapFrom: string;
  swapTo: string;
  fx: string;
  /** the SystemValues field it swaps */
  field: keyof SystemValues | 'purposes';
  to: string;
  /** the system card the swap discloses (flipped face-up on play) */
  flips: SystemCardId;
  utilityDelta?: number; // immediate dial cost of the swap itself
}

export const REDESIGN_ORDER: RedesignId[] = [
  'onDevice', 'purge24', 'tapToSkip', 'noLocationLog', 'humanAtGate', 'warrantOnly', 'renegotiate',
];

export const REDESIGN_DEFS: Record<RedesignId, RedesignDef> = {
  onDevice: {
    id: 'onDevice', nm: 'On-Device Matching', cost: 3, carry: 'pattern',
    swapFrom: 'FaceGate cloud', swapTo: 'inside the gate — nothing leaves',
    fx: 'Breach events: nothing to leak. Vendor reprices +2 after “Cloud, or the price doubles.”',
    field: 'storage', to: 'onDevice', flips: 'lives',
  },
  purge24: {
    id: 'purge24', nm: 'Purge at Tap + 24h', cost: 1, carry: 'pattern',
    swapFrom: '7 years', swapTo: '24 hours',
    fx: 'FOIA and breach severity collapse. The cheapest card in the deck. Ask why it wasn’t default.',
    field: 'retention', to: 'hours24', flips: 'long',
  },
  tapToSkip: {
    id: 'tapToSkip', nm: 'Tap-to-Skip Lane', cost: 2, carry: 'pattern',
    swapFrom: 'every rider', swapTo: 'enrolled riders only — card lane stays open',
    fx: 'Utility −1 (a slower lane). Defuses No Papers. This is right_object, built in concrete.',
    field: 'enrollment', to: 'enrolledOnly', flips: 'reads', utilityDelta: -1,
  },
  noLocationLog: {
    id: 'noLocationLog', nm: 'No Location Log', cost: 2, carry: 'pattern',
    swapFrom: 'match + ID + time + station', swapTo: 'pass / no-pass, nothing kept',
    fx: 'Kills the movement log. Leaving Quietly is defused. Billing still works — ask the vendor why it logged.',
    field: 'outputLog', to: 'passOnly', flips: 'makes',
  },
  humanAtGate: {
    id: 'humanAtGate', nm: 'Human at the Gate', cost: 1, carry: 'pattern', recurring: true,
    swapFrom: 'Autonomous', swapTo: 'Human executes',
    fx: 'Costs 1 every round — staffing. Utility −1 at peak. Safeguards you must keep paying for are safeguards that lapse (see: Budget Cut).',
    field: 'autonomy', to: 'human_executes', flips: 'model', utilityDelta: -1,
  },
  warrantOnly: {
    id: 'warrantOnly', nm: 'Warrant Required', cost: 2, carry: 'pattern',
    swapFrom: 'police on request', swapTo: 'warrant only',
    fx: 'Protest-related requests die at the gate. −1 political capital with the department.',
    field: 'policeAccess', to: 'warrantOnly', flips: 'sees',
  },
  renegotiate: {
    id: 'renegotiate', nm: 'Renegotiate the Fine Print', cost: 3, carry: 'scenario',
    swapFrom: 'vendor retains match data', swapTo: 'data is the city’s; accuracy disclosed to auditor',
    fx: 'Voids “The Data Is Ours” and “Proprietary.” Expensive because you’re buying back what you gave away at procurement.',
    field: 'dataOwner', to: 'city', flips: 'fineprint',
  },
};
