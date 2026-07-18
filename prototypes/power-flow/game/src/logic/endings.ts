import { TUNING as T } from '../tuning';
import type { GState } from '../state';
import type { EndingId } from '../content/types';
import { anyForumSeated, backlashLeftInDeck } from './selectors';

export interface EndingInfo {
  id: EndingId;
  title: string;
  kind: 'win' | 'solo' | 'lose';
  blurb: string;
}

export const ENDING_INFO: Record<EndingId, EndingInfo> = {
  deployedTrusted: {
    id: 'deployedTrusted', title: 'Deployed & Trusted', kind: 'win',
    blurb: `Utility ≥${T.TRUSTED} and Legitimacy ≥${T.TRUSTED}, a Forum card in play. Both win.`,
  },
  redesignedTrusted: {
    id: 'redesignedTrusted', title: 'Redesigned & Trusted', kind: 'win',
    blurb: `Both dials ≥${T.REDESIGNED_MIN_DIAL}, ${T.REDESIGNED_MIN_COUNT}+ Redesigns, a Forum card in play. Both win — the deployer paid for it. The good ending costs.`,
  },
  overObjection: {
    id: 'overObjection', title: 'Deployed Over Objection', kind: 'solo',
    blurb: 'Utility holds, Legitimacy below 6. The deployer scores now, minus every Backlash still in the deck. See you next election.',
  },
  collapse: {
    id: 'collapse', title: 'Collapse', kind: 'lose',
    blurb: `A dial hit ${T.FLOOR}. Project dead — and the community loses the service too.`,
  },
  woundDown: {
    id: 'woundDown', title: 'Wound Down', kind: 'solo',
    blurb: `A dial hit the floor, but the Sunset Clause held: an orderly wind-down. Both sides recover +${T.WOUND_DOWN_RECOVERY}.`,
  },
  stalled: {
    id: 'stalled', title: 'Stalled', kind: 'lose',
    blurb: 'No ending’s terms were met. The system is shelved — nobody launches, nobody wins.',
  },
};

/**
 * End-of-round-5 precedence: collapse/woundDown fire immediately at the floor
 * (never here); then deployedTrusted → redesignedTrusted → overObjection → stalled.
 */
export function computeEnding(G: GState): EndingId {
  const forum = anyForumSeated(G);
  const u = G.utility;
  const l = G.legitimacy;
  if (u >= T.TRUSTED && l >= T.TRUSTED && forum) return 'deployedTrusted';
  if (u >= T.REDESIGNED_MIN_DIAL && l >= T.REDESIGNED_MIN_DIAL
    && G.counters.redesignsApplied >= T.REDESIGNED_MIN_COUNT && forum) return 'redesignedTrusted';
  if (u >= T.OVER_OBJECTION_MIN_UTILITY && l <= T.OVER_OBJECTION_MAX_LEGIT) return 'overObjection';
  return 'stalled';
}

export interface GameoverPayload {
  ending: EndingId;
  utility: number;
  legitimacy: number;
  redesignsApplied: number;
  backlashLeft: number;
  /** overObjection only: utility minus every Backlash still in the deck */
  deployerScore: number | null;
}

export function gameoverPayload(G: GState): GameoverPayload {
  const ending = G.ending ?? computeEnding(G);
  const backlashLeft = backlashLeftInDeck(G);
  return {
    ending,
    utility: G.utility,
    legitimacy: G.legitimacy,
    redesignsApplied: G.counters.redesignsApplied,
    backlashLeft,
    deployerScore: ending === 'overObjection' ? G.utility - backlashLeft : null,
  };
}
