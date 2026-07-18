import { INVALID_MOVE, TurnOrder } from 'boardgame.io/core';
import type { Game, Move } from 'boardgame.io';
import { TUNING as T } from './tuning';
import type { GState } from './state';
import { initialState, logLine } from './state';
import {
  COMMUNITY, DEPLOYER,
  type ContextId, type EventId, type ForumId, type QuestionId,
  type RedesignId, type SystemCardId, type VendorId,
} from './content/types';
import { SYSTEM_DEFS } from './content/system';
import { CONTEXT_DEFS } from './content/contexts';
import { QUESTION_DEFS } from './content/questions';
import { FORUM_DEFS } from './content/forums';
import { REDESIGN_DEFS } from './content/redesigns';
import { VENDOR_DEFS } from './content/vendors';
import { EVENT_DEFS } from './content/events';
import { applyDelta } from './logic/dials';
import { computeEnding, gameoverPayload } from './logic/endings';
import { forceFlip, resolveAndApply, seedBacklash } from './logic/resolveEvent';
import {
  deflectLegitCost, deflectSeedCount, effectiveForumCost, effectiveRedesignCost,
} from './logic/selectors';

/* ---------------- round bookkeeping ---------------- */

/** vendor.onBegin — the top of every round. */
function beginRound(G: GState): void {
  G.vendorDone = false;
  G.negotiationClosed = false;
  G.eventAcked = false;
  G.upkeepDone = false;
  G.pending.fundingWindow = false;
  G.perRound = {
    attention: T.ATTENTION_PER_ROUND,
    freeContextReveals: 0,
    oversightUsed: false,
    oversightPeeked: null,
    contestUsed: false,
  };
  const vendorId = G.vendorDeck.shift() ?? null;
  G.pending.vendor = vendorId;
  if (!vendorId) G.vendorDone = true; // no card left to play — skip the phase
  logLine(G, 'system', `— Round ${G.round} of ${T.ROUNDS} —`);
  if (vendorId) logLine(G, 'vendor', `FaceGate plays: ${VENDOR_DEFS[vendorId].nm}`);
}

/** event.onBegin — draw and stage the world's move. */
function drawEvent(G: GState): void {
  const id = G.eventDeck.shift() as EventId | undefined;
  if (!id) {
    G.pending.event = null;
    G.eventAcked = true; // nothing to resolve; skip the phase
    logLine(G, 'system', 'The event deck is empty — the world holds its breath.');
    return;
  }
  G.eventDiscard.push(id);
  const def = EVENT_DEFS[id];
  G.pending.event = {
    id,
    isBacklash: def.isBacklash,
    eligibleReveals: (Object.keys(CONTEXT_DEFS) as ContextId[])
      .filter((cid) => !G.contexts[cid].revealed && CONTEXT_DEFS[cid].hooks.includes(id)),
    awaitingCouncilPick: false,
    dialsBefore: null,
    resolution: null,
  };
  logLine(G, 'event', `The world draws: ${def.nm}${def.isBacklash ? ' (Backlash)' : ''}`);
}

function applyRedesignEffect(G: GState, id: RedesignId): void {
  const def = REDESIGN_DEFS[id];
  if (def.field === 'purposes') return; // no redesign adds purposes; scope creep is the vendor's move
  (G.values[def.field] as string) = def.to;
  if (def.utilityDelta) applyDelta(G, { utility: def.utilityDelta });
  if (T.REDESIGN_FLIPS_TARGET_FACEUP && !G.system[def.flips].sealed) {
    G.system[def.flips].faceup = true;
  }
  G.redesigns[id] = 'applied';
  G.counters.redesignsApplied += 1;
}

/* ---------------- vendor phase ---------------- */

const vendorChoose: Move<GState> = ({ G, random }, optionId: string) => {
  const vid = G.pending.vendor;
  if (!vid) return INVALID_MOVE;
  const def = VENDOR_DEFS[vid];
  if (!def.options.some((o) => o.id === optionId)) return INVALID_MOVE;

  switch (`${vid}:${optionId}` as `${VendorId}:${string}`) {
    case 'dataIsOurs:letStand': {
      G.eventDeck = random.Shuffle([...G.eventDeck, 'dataBroker' as EventId]);
      logLine(G, 'deployer', 'The fine print stands. FaceGate’s “Insights” product enters the world (Data Broker shuffled in).');
      break;
    }
    case 'dataIsOurs:renegotiate': {
      const cost = effectiveRedesignCost(G, 'renegotiate') + T.RENEGOTIATE_NOW_SURCHARGE;
      if (G.budget < cost) return INVALID_MOVE;
      applyDelta(G, { budget: -cost });
      applyRedesignEffect(G, 'renegotiate');
      if (!T.VENDOR_RENEGOTIATE_COUNTS_AS_REDESIGN) G.counters.redesignsApplied -= 1;
      logLine(G, 'deployer', `Renegotiate now (${cost}): the data is the city’s; accuracy disclosed to the auditor.`);
      break;
    }
    case 'cloudOrDouble:acknowledge': {
      G.modifiers.onDeviceCostDelta += T.ONDEVICE_COST_DELTA;
      logLine(G, 'vendor', `On-Device Matching now costs +${T.ONDEVICE_COST_DELTA}. Redesigns get dearer the longer you wait.`);
      break;
    }
    case 'proprietary:acknowledge': {
      G.modifiers.proprietaryActive = true;
      logLine(G, 'vendor', 'Accuracy is a trade secret. Independent Audit costs +1 while the vendor owns the data.');
      break;
    }
    case 'emotionUpgrade:accept': {
      applyDelta(G, { utility: T.UPGRADE_UTILITY });
      G.values.purposes.push('emotion');
      G.modifiers.scopeCreepAccepted = true;
      let legit = 0;
      if (G.contexts.plazaRegulars.revealed) legit += T.PLAZA_SCOPE_CREEP_LEGIT;
      if (legit < 0 && G.contexts.stationMemory.revealed && G.forums.sunset.status !== 'seated') {
        legit *= T.STATION_MEMORY_UPGRADE_MULT;
      }
      if (legit) applyDelta(G, { legitimacy: legit });
      logLine(G, 'deployer',
        `Accepted the emotion-detection upgrade: Utility +${T.UPGRADE_UTILITY}, a new purpose lands without asking.` +
        (legit ? ` The plaza never agreed to be data: Legitimacy ${legit}.` : ''));
      break;
    }
    case 'emotionUpgrade:decline': {
      if (T.UPGRADE_DECLINE_COST) applyDelta(G, { budget: -T.UPGRADE_DECLINE_COST });
      logLine(G, 'deployer', 'Declined the free upgrade. The cameras keep doing only what the flyer said.');
      break;
    }
    case 'referenceDiscount:take': {
      applyDelta(G, { budget: T.DISCOUNT_BUDGET });
      G.modifiers.deflectExtraLegit += T.DISCOUNT_DEFLECT_SURCHARGE;
      logLine(G, 'deployer', `Took the discount: Budget +${T.DISCOUNT_BUDGET}. Every future Deflect costs +${T.DISCOUNT_DEFLECT_SURCHARGE} Legitimacy — you’re defending them now.`);
      break;
    }
    case 'referenceDiscount:refuse': {
      logLine(G, 'deployer', 'Refused the reference-customer discount. The logo stays off the sales deck.');
      break;
    }
    default:
      return INVALID_MOVE;
  }
  G.pending.vendor = null;
  G.vendorDone = true;
};

/* ---------------- negotiation phase: community acts ---------------- */

const askQuestion: Move<GState> = ({ G, events }, qid: QuestionId) => {
  if (G.pending.question || G.questions[qid] !== 'hand') return INVALID_MOVE;
  if (G.perRound.attention < T.COST_QUESTION) return INVALID_MOVE;
  G.perRound.attention -= T.COST_QUESTION;
  G.questions[qid] = 'pending';
  G.pending.question = { id: qid, target: QUESTION_DEFS[qid].target };
  logLine(G, 'community', `Question: “${QUESTION_DEFS[qid].q}” — aimed at ${QUESTION_DEFS[qid].targetLabel}.`);
  events.setActivePlayers({ value: { [DEPLOYER]: 'respond' } });
};

const revealContext: Move<GState> = ({ G }, cid: ContextId) => {
  if (G.contexts[cid].revealed) return INVALID_MOVE;
  if (G.perRound.freeContextReveals > 0) {
    G.perRound.freeContextReveals -= 1;
  } else if (G.perRound.attention >= T.COST_REVEAL_CONTEXT) {
    G.perRound.attention -= T.COST_REVEAL_CONTEXT;
  } else {
    return INVALID_MOVE;
  }
  G.contexts[cid].revealed = true;
  logLine(G, 'community', `Context revealed: ${CONTEXT_DEFS[cid].nm} — ${CONTEXT_DEFS[cid].fx}`);
};

const proposeForum: Move<GState> = ({ G }, fid: ForumId) => {
  if (G.forums[fid].status !== 'deck') return INVALID_MOVE;
  if (G.perRound.attention < T.COST_PROPOSE_FORUM) return INVALID_MOVE;
  G.perRound.attention -= T.COST_PROPOSE_FORUM;
  G.forums[fid].status = 'proposed';
  logLine(G, 'community', `Forum proposed: ${FORUM_DEFS[fid].nm} (deployer funds: ${effectiveForumCost(G, fid)}).`);
};

const oversightInspect: Move<GState> = ({ G }, sid: SystemCardId) => {
  if (G.forums.oversight.status !== 'seated' || G.perRound.oversightUsed) return INVALID_MOVE;
  if (G.system[sid].faceup || G.system[sid].sealed) return INVALID_MOVE;
  G.perRound.oversightUsed = true;
  G.perRound.oversightPeeked = sid;
  logLine(G, 'community', 'Oversight Seat: the community privately inspects a face-down card.');
};

const contestDiscardBacklash: Move<GState> = ({ G }) => {
  if (G.forums.contest.status !== 'seated' || G.perRound.contestUsed) return INVALID_MOVE;
  const idx = G.eventDeck.findIndex((id) => EVENT_DEFS[id].isBacklash);
  if (idx === -1) return INVALID_MOVE;
  const [removed] = G.eventDeck.splice(idx, 1);
  G.eventDiscard.push(removed);
  G.perRound.contestUsed = true;
  logLine(G, 'community', `Contest & Correct: a Backlash (${EVENT_DEFS[removed].nm}) is processed out of the deck.`);
};

const communityPass: Move<GState> = ({ G, events }) => {
  if (G.pending.question) return INVALID_MOVE;
  G.pending.fundingWindow = true;
  logLine(G, 'community', 'The community rests. The deployer may fund forums, then close.');
  events.setActivePlayers({ value: { [DEPLOYER]: 'respond' } });
};

/* ---------------- negotiation phase: deployer responds ---------------- */

const answerQuestion: Move<GState> = ({ G, events }) => {
  const q = G.pending.question;
  if (!q) return INVALID_MOVE;
  if (q.target === 'board') {
    G.perRound.freeContextReveals += 1;
    logLine(G, 'deployer', 'Answer: the deployer names who it’s used on. The community reveals one Context card free.');
  } else if (G.system[q.target].sealed) {
    applyDelta(G, { legitimacy: T.SEALED_ANSWER_LEGIT });
    logLine(G, 'deployer', `Answer: “we don’t know.” The card is sealed — a legal answer that costs Legitimacy ${T.SEALED_ANSWER_LEGIT}.`);
  } else {
    G.system[q.target].faceup = true;
    logLine(G, 'deployer', `Answer: ${SYSTEM_DEFS[q.target].nm} flips face-up. Now it’s public.`);
  }
  G.questions[q.id] = 'answered';
  G.pending.question = null;
  events.setActivePlayers({ value: { [COMMUNITY]: 'act' } });
};

const deflect: Move<GState> = ({ G, random, events }) => {
  const q = G.pending.question;
  if (!q) return INVALID_MOVE;
  const legit = deflectLegitCost(G);
  const seeds = deflectSeedCount(G);
  applyDelta(G, { legitimacy: legit });
  G.counters.deflects += 1;
  seedBacklash(G, random, seeds);
  G.questions[q.id] = 'deflected';
  G.pending.question = null;
  logLine(G, 'deployer', `Deflect: Legitimacy ${legit}, ${seeds} Backlash seeded. Unilateral power works — the costs arrive later.`);
  events.setActivePlayers({ value: { [COMMUNITY]: 'act' } });
};

const playRedesign: Move<GState> = ({ G, events }, rid: RedesignId) => {
  const q = G.pending.question;
  if (!q && !T.ALLOW_SPONTANEOUS_REDESIGN) return INVALID_MOVE;
  if (G.redesigns[rid] !== 'hand') return INVALID_MOVE;
  const cost = effectiveRedesignCost(G, rid);
  if (G.budget < cost) return INVALID_MOVE;
  applyDelta(G, { budget: -cost });
  applyRedesignEffect(G, rid);
  const def = REDESIGN_DEFS[rid];
  logLine(G, 'deployer', `Redesign (${cost}): ${def.nm} — ${def.swapFrom} → ${def.swapTo}.`);
  if (q) {
    G.questions[q.id] = 'redesigned';
    G.pending.question = null;
  }
  events.setActivePlayers({ value: { [COMMUNITY]: 'act' } });
};

const fundForum: Move<GState> = ({ G }, fid: ForumId) => {
  if (G.forums[fid].status !== 'proposed') return INVALID_MOVE;
  const cost = effectiveForumCost(G, fid);
  if (G.budget < cost) return INVALID_MOVE;
  applyDelta(G, { budget: -cost });
  G.forums[fid].status = 'seated';
  logLine(G, 'deployer', `Funded (${cost}): ${FORUM_DEFS[fid].nm} is seated at the table.`);
  if (fid === 'audit' && G.system.error.sealed) {
    forceFlip(G, 'error');
    logLine(G, 'deployer', 'The audit publishes: the seal on The Error Rate is broken. “Proprietary” is void.');
  }
  // does NOT close the window and does NOT resolve a pending question
};

const deployerDone: Move<GState> = ({ G }) => {
  if (G.pending.question || !G.pending.fundingWindow) return INVALID_MOVE;
  G.negotiationClosed = true;
  logLine(G, 'deployer', 'Negotiation closes.');
};

/* ---------------- event phase ---------------- */

const reactionReveal: Move<GState> = ({ G }, cid: ContextId) => {
  const ev = G.pending.event;
  if (!ev || ev.resolution) return INVALID_MOVE;
  if (!ev.eligibleReveals.includes(cid)) return INVALID_MOVE;
  G.contexts[cid].revealed = true;
  ev.eligibleReveals = ev.eligibleReveals.filter((c) => c !== cid);
  logLine(G, 'community', `Reaction: ${CONTEXT_DEFS[cid].nm} revealed — this event keys it.`);
};

const passReaction: Move<GState> = ({ G, random, events }) => {
  const ev = G.pending.event;
  if (!ev || ev.resolution) return INVALID_MOVE;
  const anyFacedown = (Object.keys(G.system) as SystemCardId[]).some((id) => !G.system[id].faceup);
  if (ev.id === 'councilHearing' && anyFacedown) {
    ev.awaitingCouncilPick = true;
    logLine(G, 'event', 'The council subpoenas the deck: the community picks one face-down card to flip. In public.');
    events.setActivePlayers({ value: { [COMMUNITY]: 'councilPick' } });
    return;
  }
  resolveAndApply(G, random);
  if (G.ending) return; // floor breach mid-resolution: the game is over
  events.setActivePlayers({ value: { [DEPLOYER]: 'ack' } });
};

const councilPick: Move<GState> = ({ G, random, events }, sid: SystemCardId) => {
  const ev = G.pending.event;
  if (!ev || !ev.awaitingCouncilPick || ev.resolution) return INVALID_MOVE;
  if (G.system[sid].faceup) return INVALID_MOVE;
  ev.awaitingCouncilPick = false;
  resolveAndApply(G, random, { councilPick: sid });
  if (G.ending) return;
  events.setActivePlayers({ value: { [DEPLOYER]: 'ack' } });
};

const acknowledgeEvent: Move<GState> = ({ G }) => {
  if (!G.pending.event?.resolution) return INVALID_MOVE;
  G.eventAcked = true;
};

/* ---------------- upkeep phase ---------------- */

const endRound: Move<GState> = ({ G }, opts?: { payHumanAtGate?: boolean }) => {
  if (G.upkeepDone) return INVALID_MOVE;

  if (G.redesigns.humanAtGate === 'applied') {
    if (opts?.payHumanAtGate && G.budget >= T.HUMAN_AT_GATE_UPKEEP) {
      applyDelta(G, { budget: -T.HUMAN_AT_GATE_UPKEEP });
      logLine(G, 'deployer', `Upkeep paid (${T.HUMAN_AT_GATE_UPKEEP}): the human stays at the gate.`);
    } else {
      G.redesigns.humanAtGate = 'lapsed';
      G.values.autonomy = 'autonomous';
      applyDelta(G, { utility: -REDESIGN_DEFS.humanAtGate.utilityDelta! }); // the peak-hours drag lifts
      logLine(G, 'deployer', 'Human at the Gate lapses — the dial snaps back to autonomous. Safeguards decay.');
    }
  }

  if (G.modifiers.legitScale) {
    G.modifiers.legitScale.roundsLeft -= 1;
    if (G.modifiers.legitScale.roundsLeft < 0) G.modifiers.legitScale = null;
  }
  // (the utility freeze is an absolute round marker — no decrement needed)

  if (G.ending) { G.upkeepDone = true; return; }
  if (G.round >= T.ROUNDS) {
    G.ending = computeEnding(G);
    logLine(G, 'system', 'The launch deadline arrives.');
  } else {
    G.round += 1;
  }
  G.upkeepDone = true;
};

/* ---------------- the game ---------------- */

export interface GameOpts {
  /** fixed decks for scripted tests — skips shuffling */
  vendorDeck?: VendorId[];
  eventDeck?: EventId[];
  backlashPool?: import('./content/types').BacklashId[];
  seed?: string | number;
}

export function createGame(opts: GameOpts = {}): Game<GState> {
  return {
    name: 'power-flow',
    seed: opts.seed,
    setup: ({ random }) => initialState((arr) => random.Shuffle(arr), opts),
    endIf: ({ G }) => (G.ending ? gameoverPayload(G) : undefined),

    // boardgame.io evaluates a phase's endIf on ENTRY, before onBegin — so every
    // phase clears the NEXT phase's end-flag in its own onEnd. A phase entered
    // with a stale flag would be skipped (and the whole cycle would collapse).
    phases: {
      vendor: {
        start: true,
        next: 'negotiation',
        turn: { order: TurnOrder.CUSTOM([DEPLOYER]) },
        onBegin: ({ G }) => beginRound(G),
        onEnd: ({ G }) => { G.negotiationClosed = false; },
        moves: { vendorChoose },
        endIf: ({ G }) => G.vendorDone,
      },
      negotiation: {
        next: 'event',
        turn: {
          order: TurnOrder.CUSTOM([COMMUNITY]),
          activePlayers: { value: { [COMMUNITY]: 'act' } },
          stages: {
            act: {
              moves: {
                askQuestion, revealContext, proposeForum,
                oversightInspect, contestDiscardBacklash, communityPass,
              },
            },
            respond: {
              moves: { answerQuestion, deflect, playRedesign, fundForum, deployerDone },
            },
          },
        },
        endIf: ({ G }) => G.negotiationClosed && !G.pending.question,
        onEnd: ({ G }) => { G.eventAcked = false; },
      },
      event: {
        next: 'upkeep',
        turn: {
          order: TurnOrder.CUSTOM([COMMUNITY]),
          activePlayers: { value: { [COMMUNITY]: 'react' } },
          stages: {
            react: { moves: { reactionReveal, passReaction } },
            councilPick: { moves: { councilPick } },
            ack: { moves: { acknowledgeEvent } },
          },
        },
        onBegin: ({ G }) => drawEvent(G),
        onEnd: ({ G }) => { G.upkeepDone = false; },
        endIf: ({ G }) => G.eventAcked,
      },
      upkeep: {
        next: 'vendor',
        turn: { order: TurnOrder.CUSTOM([DEPLOYER]) },
        moves: { endRound },
        onEnd: ({ G }) => { G.vendorDone = false; },
        endIf: ({ G }) => G.upkeepDone,
      },
    },
  };
}

export const PowerFlow = createGame();
