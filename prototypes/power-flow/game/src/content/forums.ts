import type { ForumId } from './types';
import { TUNING } from '../tuning';

export interface ForumDef {
  id: ForumId;
  nm: string;
  schema: string;
  cost: number; // deployer coins to fund (community proposal costs 1 attention)
  icon: string | null; // live DTPR element id
  unlocks: string;
  absorbs: string;
}

export const FORUM_ORDER: ForumId[] = ['notice', 'humanReview', 'contest', 'oversight', 'audit', 'sunset'];

export const FORUM_DEFS: Record<ForumId, ForumDef> = {
  notice: {
    id: 'notice', nm: 'Notice at the Gate', schema: 'rights · right_to_notice', cost: 1, icon: 'right_to_notice',
    unlocks: 'Community peeks at the top Event card each round.',
    absorbs: '“Public discovers…” surprise penalties are halved — it was never a secret.',
  },
  humanReview: {
    id: 'humanReview', nm: 'Human Review on Demand', schema: 'rights · right_to_human_review', cost: 2, icon: 'right_to_human_review',
    unlocks: 'Once per round, downgrade a false-match event one step.',
    absorbs: 'Wrongful-stop Legitimacy hits halved.',
  },
  contest: {
    id: 'contest', nm: 'Contest & Correct', schema: 'rights · right_contest + right_correction', cost: 2, icon: 'right_contest',
    unlocks: 'Once per round, discard one Backlash from the Event deck — grievances get processed instead of compounding.',
    absorbs: 'Lawsuits settle: −1 instead of −3.',
  },
  oversight: {
    id: 'oversight', nm: 'Community Oversight Seat', schema: 'accountable_to · the edge itself', cost: 3, icon: 'institution',
    unlocks: `Community privately inspects one face-down System card per round. Deflect now costs Legitimacy ${TUNING.DEFLECT_LEGIT_OVERSIGHT}.`,
    absorbs: 'Election-year swings halved — legitimacy is pre-built.',
  },
  audit: {
    id: 'audit', nm: 'Independent Audit, Published', schema: 'rights · right_algorithmic_transparency', cost: 2, icon: 'right_algorithmic_transparency',
    unlocks: 'Breaks the seal on the sealed card. Vendor “proprietary” claims are void.',
    absorbs: 'Accuracy events resolve one step milder — you knew, and said so.',
  },
  sunset: {
    id: 'sunset', nm: 'Sunset Clause', schema: 'rights · right_purpose_limitation', cost: 1, icon: 'right_purpose_limitation',
    unlocks: 'Scope-creep offers can be refused at no cost.',
    absorbs: `Collapse becomes Wound Down: both sides recover +${TUNING.WOUND_DOWN_RECOVERY}.`,
  },
};
