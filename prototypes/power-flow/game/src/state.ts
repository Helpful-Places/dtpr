import { TUNING } from './tuning';
import type {
  BacklashId, ContextId, EndingId, EventId, ForumId, ForumStatus, LogEntry,
  QuestionId, QuestionStatus, RedesignId, RedesignStatus, ResolvedLine,
  SystemCardId, SystemValues, VendorId,
} from './content/types';
import { SYSTEM_ORDER, SYSTEM_DEFS } from './content/system';
import { CONTEXT_ORDER } from './content/contexts';
import { QUESTION_ORDER } from './content/questions';
import { FORUM_ORDER } from './content/forums';
import { REDESIGN_ORDER } from './content/redesigns';
import { VENDOR_ORDER } from './content/vendors';

export interface PendingEvent {
  id: EventId;
  isBacklash: boolean;
  /** unrevealed contexts hooked to this event — free reaction reveals */
  eligibleReveals: ContextId[];
  awaitingCouncilPick: boolean;
  dialsBefore: { utility: number; legitimacy: number; budget: number } | null;
  resolution: ResolvedLine[] | null;
}

export interface GState {
  round: number;
  utility: number;
  legitimacy: number;
  budget: number;
  values: SystemValues;
  system: Record<SystemCardId, { faceup: boolean; sealed: boolean }>;
  contexts: Record<ContextId, { revealed: boolean }>;
  forums: Record<ForumId, { status: ForumStatus }>;
  questions: Record<QuestionId, QuestionStatus>;
  redesigns: Record<RedesignId, RedesignStatus>;
  vendorDeck: VendorId[];
  eventDeck: EventId[];
  eventDiscard: EventId[];
  backlashPool: BacklashId[];
  pending: {
    vendor: VendorId | null;
    question: { id: QuestionId; target: SystemCardId | 'board' } | null;
    event: PendingEvent | null;
    fundingWindow: boolean;
  };
  modifiers: {
    onDeviceCostDelta: number;
    proprietaryActive: boolean; // audit +1 while vendor owns the data
    deflectExtraLegit: number;
    legitScale: { factor: number; roundsLeft: number } | null;
    /** injunction: utility deltas are blocked while G.round <= this (0 = none) */
    utilityFrozenUntilRound: number;
    protestUnsurfaced: boolean;
    scopeCreepAccepted: boolean;
    fareStrikeDefused: boolean;
  };
  perRound: {
    attention: number;
    freeContextReveals: number;
    oversightUsed: boolean;
    oversightPeeked: SystemCardId | null;
    contestUsed: boolean;
  };
  counters: {
    deflects: number;
    redesignsApplied: number;
  };
  /** phase-end flags — set by moves, cleared in vendor.onBegin (never derived, so
   * boardgame.io's endIf-before-onBegin evaluation at init can't skip a phase) */
  vendorDone: boolean;
  negotiationClosed: boolean;
  eventAcked: boolean;
  upkeepDone: boolean;
  log: LogEntry[];
  ending: EndingId | null;
}

export const BACKLASH_IDS: BacklashId[] = ['fareStrike', 'court', 'councilHearing', 'gatesHeldOpen'];

/**
 * Pure initial state. `shuffle` is injected: the game passes ctx random.Shuffle;
 * tests pass identity (or a fixture) for scripted decks.
 */
export function initialState(
  shuffle: <T>(arr: T[]) => T[],
  fixed?: { vendorDeck?: VendorId[]; eventDeck?: EventId[]; backlashPool?: BacklashId[] },
): GState {
  const system = {} as GState['system'];
  for (const id of SYSTEM_ORDER) {
    system[id] = { faceup: !!SYSTEM_DEFS[id].startsFaceup, sealed: !!SYSTEM_DEFS[id].sealed };
  }
  const contexts = {} as GState['contexts'];
  for (const id of CONTEXT_ORDER) contexts[id] = { revealed: false };
  const forums = {} as GState['forums'];
  for (const id of FORUM_ORDER) forums[id] = { status: 'deck' };
  const questions = {} as GState['questions'];
  for (const id of QUESTION_ORDER) questions[id] = 'hand';
  const redesigns = {} as GState['redesigns'];
  for (const id of REDESIGN_ORDER) redesigns[id] = 'hand';

  const coreEvents: EventId[] = ['breach', 'budgetCut', 'electionYear', 'foia', 'falseMatch', 'protest', 'twins', 'ridership'];

  return {
    round: 1,
    utility: TUNING.UTILITY_START,
    legitimacy: TUNING.LEGITIMACY_START,
    budget: TUNING.BUDGET_START,
    values: {
      autonomy: 'autonomous',
      retention: 'years7',
      storage: 'vendorCloud',
      policeAccess: 'onRequest',
      outputLog: 'movementLog',
      enrollment: 'everyRider',
      dataOwner: 'vendor',
      purposes: ['farePayment'],
    },
    system, contexts, forums, questions, redesigns,
    vendorDeck: fixed?.vendorDeck ?? shuffle([...VENDOR_ORDER]),
    eventDeck: fixed?.eventDeck ?? shuffle(coreEvents),
    eventDiscard: [],
    backlashPool: fixed?.backlashPool ?? shuffle([...BACKLASH_IDS]),
    pending: { vendor: null, question: null, event: null, fundingWindow: false },
    modifiers: {
      onDeviceCostDelta: 0,
      proprietaryActive: false,
      deflectExtraLegit: 0,
      legitScale: null,
      utilityFrozenUntilRound: 0,
      protestUnsurfaced: false,
      scopeCreepAccepted: false,
      fareStrikeDefused: false,
    },
    perRound: {
      attention: TUNING.ATTENTION_PER_ROUND,
      freeContextReveals: 0,
      oversightUsed: false,
      oversightPeeked: null,
      contestUsed: false,
    },
    counters: { deflects: 0, redesignsApplied: 0 },
    vendorDone: false,
    negotiationClosed: false,
    eventAcked: false,
    upkeepDone: false,
    log: [],
    ending: null,
  };
}

export function logLine(G: GState, source: LogEntry['source'], text: string): void {
  G.log.push({ round: G.round, source, text });
}
