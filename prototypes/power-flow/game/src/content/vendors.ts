import type { VendorId } from './types';

export interface VendorOption {
  id: string;
  label: string;
  detail: string;
}

export interface VendorDef {
  id: VendorId;
  nm: string;
  ds: string;
  choice: string; // printed card text
  options: VendorOption[];
}

export const VENDOR_ORDER: VendorId[] = [
  'dataIsOurs', 'cloudOrDouble', 'proprietary', 'emotionUpgrade', 'referenceDiscount',
];

export const VENDOR_DEFS: Record<VendorId, VendorDef> = {
  dataIsOurs: {
    id: 'dataIsOurs', nm: '“The data is ours.”',
    ds: 'The contract you signed says match data belongs to FaceGate.',
    choice: 'If the Fine Print stands, FaceGate ships an “Insights” product: shuffle the Data Broker event in. Or renegotiate now at +1 cost.',
    options: [
      { id: 'letStand', label: 'Let it stand', detail: 'The Data Broker event shuffles into the deck.' },
      { id: 'renegotiate', label: 'Renegotiate now', detail: 'Pay the redesign cost +1. The data becomes the city’s.' },
    ],
  },
  cloudOrDouble: {
    id: 'cloudOrDouble', nm: '“Cloud, or the price doubles.”',
    ds: 'On-device is “not on the roadmap” — unless you pay for the roadmap.',
    choice: 'On-Device Matching costs +2 from now on. Redesigns get dearer the longer you wait.',
    options: [
      { id: 'acknowledge', label: 'Acknowledge', detail: 'On-Device Matching now costs +2.' },
    ],
  },
  proprietary: {
    id: 'proprietary', nm: '“That’s proprietary.”',
    ds: 'Accuracy figures are a trade secret. Even from you.',
    choice: 'Independent Audit costs +1 unless the Fine Print is renegotiated. The seal holds.',
    options: [
      { id: 'acknowledge', label: 'Acknowledge', detail: 'Independent Audit +1 while the vendor owns the data.' },
    ],
  },
  emotionUpgrade: {
    id: 'emotionUpgrade', nm: '“Free upgrade: emotion detection.”',
    ds: 'Same cameras, new model. The board would love it.',
    choice: 'Accept: Utility +1, a new purpose lands without asking — and Plaza Regulars / Station Memory trigger. Decline: nothing. The temptation card.',
    options: [
      { id: 'accept', label: 'Accept the upgrade', detail: 'Utility +1. Scope creep lands; revealed contexts bite.' },
      { id: 'decline', label: 'Decline', detail: 'Nothing happens. (With a Sunset Clause this is always free.)' },
    ],
  },
  referenceDiscount: {
    id: 'referenceDiscount', nm: '“Reference customer discount.”',
    ds: 'Take 2 budget now; your logo goes on their sales deck.',
    choice: 'Gain 2 — and every future Deflect costs +1 Legitimacy. You’re defending them now.',
    options: [
      { id: 'take', label: 'Take the discount', detail: 'Budget +2; every future Deflect −1 Legitimacy extra.' },
      { id: 'refuse', label: 'Refuse', detail: 'Nothing happens.' },
    ],
  },
};
