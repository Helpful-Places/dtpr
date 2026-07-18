import type { ContextId, EventId, VendorId } from './types';

export type Relationship = 'subject' | 'bystander' | 'community';

export interface ContextDef {
  id: ContextId;
  nm: string;
  rel: Relationship;
  ds: string;
  keys: string; // which cards it keys (display)
  fx: string; // reveal effect (display; mechanics live in resolvers/moves)
  /** events this context hooks — drives free reaction-reveals in the event phase */
  hooks: EventId[];
  /** vendor cards this context hooks (its teeth bite during vendorChoose) */
  vendorHooks?: VendorId[];
}

export const CONTEXT_ORDER: ContextId[] = [
  'nightShift', 'jumpers', 'noPapers', 'misread', 'leavingQuietly', 'plazaRegulars', 'stationMemory',
];

export const CONTEXT_DEFS: Record<ContextId, ContextDef> = {
  nightShift: {
    id: 'nightShift', nm: 'Night Shift', rel: 'subject',
    ds: 'Cleaners and nurses ride at 2 a.m. A gate that errs at night strands someone alone on the platform.',
    keys: 'The Model (autonomous) · Who Sees It',
    fx: 'Night false-match events hit double — unless Human at the Gate is in play.',
    hooks: ['falseMatch'],
  },
  jumpers: {
    id: 'jumpers', nm: 'The Jumpers', rel: 'subject',
    ds: 'Fare evasion here is poverty, not sport. Every flag the gate raises becomes a police contact.',
    keys: 'Who Sees It · What It Makes',
    fx: 'Enforcement events add Legitimacy −1 while police access stands.',
    hooks: ['protest'],
  },
  noPapers: {
    id: 'noPapers', nm: 'No Papers', rel: 'community',
    ds: 'Undocumented neighbors stop riding anything that asks who you are. They just disappear from the system — and the ridership.',
    keys: 'What It Reads · Who Sees It',
    fx: 'Utility −2 at the Ridership Report — unless a Tap-to-Skip lane exists.',
    hooks: ['ridership'],
  },
  misread: {
    id: 'misread', nm: 'The Misread', rel: 'subject',
    ds: 'The neighbors this system reads worst are the ones who already get stopped the most.',
    keys: 'The Error Rate (sealed) · The Model',
    fx: 'During any false-match event, force the sealed card open.',
    hooks: ['falseMatch', 'twins'],
  },
  leavingQuietly: {
    id: 'leavingQuietly', nm: 'Leaving Quietly', rel: 'subject',
    ds: 'Some riders are hiding from someone. A movement log is a weapon that keeps.',
    keys: 'What It Makes · How Long · Who Sees It',
    fx: 'Breach and access events +2 severity — unless No Location Log or the 24-hour purge.',
    hooks: ['breach'],
  },
  plazaRegulars: {
    id: 'plazaRegulars', nm: 'The Plaza Regulars', rel: 'bystander',
    ds: 'The vendors and chess players outside the station never ride. They face the cameras all day anyway.',
    keys: 'What It Reads · The Pitch',
    fx: 'Any scope-creep acceptance costs Legitimacy −2 — they never agreed to be data.',
    hooks: [],
    vendorHooks: ['emotionUpgrade'],
  },
  stationMemory: {
    id: 'stationMemory', nm: 'Station Memory', rel: 'community',
    ds: 'We remember the last “pilot.” It never left, and it never did what the flyer said.',
    keys: 'The Pitch · The Fine Print',
    fx: 'Vendor upgrade offers cost double Legitimacy — unless a Sunset Clause is seated.',
    hooks: [],
    vendorHooks: ['emotionUpgrade'],
  },
};

export const REL_LABELS: Record<Relationship, string> = {
  subject: 'Decided about',
  bystander: 'Caught incidentally',
  community: 'Wider community',
};
