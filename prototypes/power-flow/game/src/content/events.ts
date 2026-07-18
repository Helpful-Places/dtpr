import { TUNING as T } from '../tuning';
import type { BoardView } from '../logic/selectors';
import type { Deltas, EventId, LineTag, RawLine, SystemCardId } from './types';
import { SYSTEM_DEFS } from './system';

export interface EventDef {
  id: EventId;
  nm: string;
  carry: 'core' | 'scenario';
  isBacklash: boolean;
  seed?: string; // backlash flavor: what seeds it
  /**
   * Pure resolver: emits EVERY condition line, fired or not (unfired lines render muted).
   * extra carries the council-hearing pick.
   */
  resolve: (v: BoardView, extra?: { councilPick?: SystemCardId }) => RawLine[];
}

const line = (fired: boolean, cond: string, text: string, deltas?: Deltas, tags?: LineTag[]): RawLine =>
  ({ cond, text, fired, deltas, tags });

export const EVENT_DEFS: Record<EventId, EventDef> = {
  breach: {
    id: 'breach', nm: 'Breach at the Vendor', carry: 'core', isBacklash: false,
    resolve: (v) => {
      const exposed = v.values.storage === 'vendorCloud' && v.values.retention === 'years7';
      const quietly = exposed && v.revealed('leavingQuietly') && v.values.outputLog === 'movementLog';
      return [
        line(exposed, 'Cloud + years of retention:',
          `riders’ faces and movement logs leak. Legitimacy ${T.BREACH_BAD_LEGIT}.`,
          { legitimacy: T.BREACH_BAD_LEGIT }),
        line(quietly, 'Leaving Quietly:',
          `the movement log was a weapon that keeps. Legitimacy ${T.LEAVING_QUIETLY_BREACH_EXTRA}.`,
          { legitimacy: T.LEAVING_QUIETLY_BREACH_EXTRA }),
        line(!exposed, 'On-device, or 24h purge:',
          `“nothing to leak.” Legitimacy +${T.BREACH_SAFE_LEGIT} — the told-you-so bonus.`,
          { legitimacy: T.BREACH_SAFE_LEGIT }),
      ];
    },
  },

  budgetCut: {
    id: 'budgetCut', nm: 'Budget Cut', carry: 'core', isBacklash: false,
    resolve: (v) => [
      line(true, 'Always:', `Budget ${T.BUDGET_CUT}.`, { budget: T.BUDGET_CUT }),
      line(v.humanAtGateApplied, 'Human at the Gate is active:',
        'keep paying its upkeep at round end, or it lapses — the dial snaps back to autonomous. Safeguards decay.'),
    ],
  },

  electionYear: {
    id: 'electionYear', nm: 'Election Year', carry: 'core', isBacklash: false,
    resolve: (v) => {
      const halved = v.seated('oversight');
      return [
        line(!halved, 'This round:', 'every Legitimacy change is doubled, both directions — through next upkeep.',
          { legitScale: { factor: T.ELECTION_SCALE, rounds: T.ELECTION_ROUNDS } }),
        line(halved, 'Oversight Seat in play:', 'halved instead. Legitimacy you built is legitimacy you keep.',
          { legitScale: { factor: T.ELECTION_SCALE_OVERSIGHT, rounds: T.ELECTION_ROUNDS } }),
      ];
    },
  },

  foia: {
    id: 'foia', nm: 'The FOIA', carry: 'core', isBacklash: false,
    resolve: (v) => [
      line(v.deflects > 0, `Per prior Deflect (×${v.deflects}):`,
        `Legitimacy ${T.FOIA_PER_DEFLECT_LEGIT * v.deflects} — deflections become receipts.`,
        { legitimacy: T.FOIA_PER_DEFLECT_LEGIT * v.deflects }, ['publicDiscovers']),
      line(v.protestUnsurfaced, 'The gate-log handover surfaces:',
        `the quiet compliance is public. Legitimacy ${T.PROTEST_SURFACED_LEGIT}.`,
        { legitimacy: T.PROTEST_SURFACED_LEGIT, clearProtest: true }, ['publicDiscovers']),
      line(v.allFaceup, 'Everything already face-up:',
        `Legitimacy +${T.FOIA_ALL_FACEUP_LEGIT}. “Nothing to find” is a story too.`,
        { legitimacy: T.FOIA_ALL_FACEUP_LEGIT }),
    ],
  },

  falseMatch: {
    id: 'falseMatch', nm: 'False Match at Gate 7', carry: 'scenario', isBacklash: false,
    resolve: (v) => {
      const handled = v.values.autonomy === 'human_executes' || v.seated('humanReview');
      const night = v.revealed('nightShift') && !handled;
      const mult = night ? T.NIGHTSHIFT_FALSEMATCH_MULT : 1;
      return [
        line(true, 'A nurse, 2 a.m., held 40 minutes.', ''),
        line(night, 'Night Shift keys this:', 'night false-matches hit double.'),
        // the seal breaks before the penalties land — a floor breach must not save the secret
        line(v.revealed('misread') && v.sealedIntact, 'The Misread:',
          'the pattern is undeniable — the sealed card is forced open.', { flipCard: 'error' }),
        line(!handled, 'Autonomous + no recourse:',
          `Legitimacy ${T.FALSEMATCH_BAD_LEGIT * mult}, seed a Backlash.`,
          { legitimacy: T.FALSEMATCH_BAD_LEGIT * mult, seedBacklash: T.FALSEMATCH_BAD_SEEDS },
          ['falseMatch', 'accuracy']),
        line(handled, 'Human at the Gate, or Human Review seated:',
          `held two minutes, waved through. Legitimacy ${T.FALSEMATCH_HANDLED_LEGIT}…`,
          { legitimacy: T.FALSEMATCH_HANDLED_LEGIT }, ['falseMatch', 'accuracy']),
        line(handled, '…then', `+${T.FALSEMATCH_HANDLED_BONUS} back — handled well is a story that helps.`,
          { legitimacy: T.FALSEMATCH_HANDLED_BONUS }),
      ];
    },
  },

  protest: {
    id: 'protest', nm: 'Protest at the Plaza', carry: 'scenario', isBacklash: false,
    resolve: (v) => {
      const logExists = v.values.outputLog === 'movementLog';
      const onRequest = v.values.policeAccess === 'onRequest';
      const complies = onRequest && logExists;
      return [
        line(true, 'PD requests gate logs for the crowd.', ''),
        line(complies, 'Access “on request” + the log exists:',
          `comply quietly — Legitimacy ${T.PROTEST_SURFACED_LEGIT} when it surfaces (and The FOIA surfaces it).`,
          { surfaceProtest: true }),
        line(complies && v.revealed('jumpers'), 'The Jumpers:',
          `every flag is a police contact. Legitimacy ${T.JUMPERS_ENFORCEMENT_LEGIT}.`,
          { legitimacy: T.JUMPERS_ENFORCEMENT_LEGIT }),
        line(onRequest && !logExists, 'Nothing to hand over:', 'pass / no-pass, nothing kept. The request returns empty.'),
        line(!onRequest, 'Warrant Required:', `the request dies at the gate. Legitimacy +${T.PROTEST_WARRANT_LEGIT}.`,
          { legitimacy: T.PROTEST_WARRANT_LEGIT }),
      ];
    },
  },

  twins: {
    id: 'twins', nm: 'The Twins', carry: 'scenario', isBacklash: false,
    resolve: (v) => [
      line(true, 'One sibling billed for the other’s rides.', 'A small, human-sized failure.'),
      line(v.seated('contest'), 'Contest & Correct seated:',
        `fixed in a day. Legitimacy +${T.TWINS_FIXED_LEGIT} — charm.`, { legitimacy: T.TWINS_FIXED_LEGIT }),
      line(!v.seated('contest'), 'No recourse:',
        `Legitimacy ${T.TWINS_BAD_LEGIT}, and it’s a local-news segment.`,
        { legitimacy: T.TWINS_BAD_LEGIT }, ['falseMatch', 'accuracy']),
    ],
  },

  ridership: {
    id: 'ridership', nm: 'Ridership Report', carry: 'scenario', isBacklash: false,
    resolve: (v) => {
      const skipLane = v.values.enrollment === 'enrolledOnly';
      const noPapersLive = v.revealed('noPapers') && !skipLane;
      return [
        line(true, 'Count Utility honestly.', ''),
        line(noPapersLive, 'No Papers revealed and unaddressed:',
          `neighbors have stopped riding. Utility ${T.RIDERSHIP_NOPAPERS_UTILITY} sticks. Avoidance is invisible until you count.`,
          { utility: T.RIDERSHIP_NOPAPERS_UTILITY }),
        line(skipLane, 'Tap-to-Skip exists:', `Utility ${T.RIDERSHIP_SKIPLANE_UTILITY} only.`,
          { utility: T.RIDERSHIP_SKIPLANE_UTILITY }),
        line(!noPapersLive && !skipLane, 'Full gates:', `Utility +${T.RIDERSHIP_CONFIRMED_UTILITY} confirmed.`,
          { utility: T.RIDERSHIP_CONFIRMED_UTILITY }),
      ];
    },
  },

  dataBroker: {
    id: 'dataBroker', nm: '“Insights,” by FaceGate', carry: 'scenario', isBacklash: false,
    resolve: (v) => {
      const vendorOwns = v.values.dataOwner === 'vendor';
      const logExists = v.values.outputLog === 'movementLog';
      return [
        line(vendorOwns && logExists, 'The contract stood, and the log exists:',
          `FaceGate ships “Insights” — rider movement patterns, for sale. Legitimacy ${T.DATABROKER_BAD_LEGIT}.`,
          { legitimacy: T.DATABROKER_BAD_LEGIT }, ['publicDiscovers']),
        line(vendorOwns && !logExists, 'The contract stood, but the product is thin:',
          `pass / no-pass only. Legitimacy ${T.DATABROKER_THIN_LEGIT}.`,
          { legitimacy: T.DATABROKER_THIN_LEGIT }, ['publicDiscovers']),
        line(!vendorOwns, 'Fine print renegotiated:',
          `the data is the city’s. “Insights” dies in legal review. Legitimacy +${T.DATABROKER_VOIDED_LEGIT}.`,
          { legitimacy: T.DATABROKER_VOIDED_LEGIT }),
      ];
    },
  },

  /* ---- backlash ---- */

  fareStrike: {
    id: 'fareStrike', nm: 'Fare Strike', carry: 'scenario', isBacklash: true, seed: 'organized refusal',
    resolve: (v) => {
      const defused = v.seated('contest') && !v.fareStrikeDefused;
      return [
        line(defused, 'Contest & Correct:',
          'the grievance gets processed instead of compounding — defused, once.', { defuseFareStrike: true }),
        line(!defused, 'Organized non-payment:',
          `Utility ${T.FARESTRIKE_UTILITY}, Legitimacy ${T.FARESTRIKE_LEGIT}.`,
          { utility: T.FARESTRIKE_UTILITY, legitimacy: T.FARESTRIKE_LEGIT }),
      ];
    },
  },

  court: {
    id: 'court', nm: 'See You in Court', carry: 'core', isBacklash: true, seed: 'every deck has lawyers',
    resolve: (v) => [
      line(v.seated('contest'), 'With Contest & Correct:',
        `settle for Budget ${T.COURT_SETTLE_BUDGET} instead.`, { budget: T.COURT_SETTLE_BUDGET }),
      line(!v.seated('contest'), 'Injunction:',
        `Utility frozen ${T.COURT_FREEZE_ROUNDS} round.`, { freezeUtility: T.COURT_FREEZE_ROUNDS }),
    ],
  },

  councilHearing: {
    id: 'councilHearing', nm: 'The Council Hearing', carry: 'core', isBacklash: true, seed: 'forced disclosure',
    resolve: (v, extra) => {
      const pick = extra?.councilPick;
      const pickDef = pick ? SYSTEM_DEFS[pick] : null;
      const sealBreaks = !!pick && pick === 'error' && v.sealedIntact;
      return [
        line(true, 'Subpoena the deck:', 'the deployer flips one face-down card of the community’s choice. In public.'),
        line(!!pick, 'Flipped:',
          `${pickDef?.nm ?? ''}.${sealBreaks ? ' The seal breaks in chambers.' : ''}`,
          pick ? { flipCard: pick } : undefined),
        line(!pick, 'Nothing left face-down:', 'the hearing finds a fully public board. Adjourned.'),
      ];
    },
  },

  gatesHeldOpen: {
    id: 'gatesHeldOpen', nm: 'Gates Held Open', carry: 'scenario', isBacklash: true, seed: 'quiet noncompliance',
    resolve: () => [
      line(true, 'Jumping is normalized; staff look away:',
        `Utility ${T.GATES_OPEN_UTILITY}. The system works and nobody obeys it.`,
        { utility: T.GATES_OPEN_UTILITY }),
    ],
  },
};
