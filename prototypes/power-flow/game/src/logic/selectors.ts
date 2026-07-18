import type { Ctx } from 'boardgame.io';
import { TUNING } from '../tuning';
import type { GState } from '../state';
import type {
  ContextId, ForumId, RedesignId, Seat, SystemCardId, SystemValues,
} from '../content/types';
import { DEPLOYER, COMMUNITY } from '../content/types';
import { SYSTEM_ORDER } from '../content/system';
import { FORUM_DEFS, FORUM_ORDER } from '../content/forums';
import { REDESIGN_DEFS, REDESIGN_ORDER } from '../content/redesigns';
import { QUESTION_DEFS, QUESTION_ORDER } from '../content/questions';
import { CONTEXT_ORDER } from '../content/contexts';
import { BACKLASH_IDS } from '../state';

/** Read-only projection events resolve against. Built fresh per resolution; never stored in G. */
export interface BoardView {
  values: SystemValues;
  seated: (id: ForumId) => boolean;
  revealed: (id: ContextId) => boolean;
  faceup: (id: SystemCardId) => boolean;
  sealedIntact: boolean;
  allFaceup: boolean;
  deflects: number;
  protestUnsurfaced: boolean;
  fareStrikeDefused: boolean;
  humanAtGateApplied: boolean;
}

export function makeView(G: GState): BoardView {
  return {
    values: G.values,
    seated: (id) => G.forums[id].status === 'seated',
    revealed: (id) => G.contexts[id].revealed,
    faceup: (id) => G.system[id].faceup,
    sealedIntact: G.system.error.sealed,
    allFaceup: SYSTEM_ORDER.every((id) => G.system[id].faceup),
    deflects: G.counters.deflects,
    protestUnsurfaced: G.modifiers.protestUnsurfaced,
    fareStrikeDefused: G.modifiers.fareStrikeDefused,
    humanAtGateApplied: G.redesigns.humanAtGate === 'applied',
  };
}

export const anyForumSeated = (G: GState): boolean =>
  FORUM_ORDER.some((id) => G.forums[id].status === 'seated');

export const effectiveRedesignCost = (G: GState, id: RedesignId): number =>
  REDESIGN_DEFS[id].cost + (id === 'onDevice' ? G.modifiers.onDeviceCostDelta : 0);

export const effectiveForumCost = (G: GState, id: ForumId): number =>
  FORUM_DEFS[id].cost +
  (id === 'audit' && G.modifiers.proprietaryActive && G.values.dataOwner !== 'city'
    ? TUNING.PROPRIETARY_AUDIT_DELTA
    : 0);

export const deflectLegitCost = (G: GState): number =>
  (G.forums.oversight.status === 'seated' ? TUNING.DEFLECT_LEGIT_OVERSIGHT : TUNING.DEFLECT_LEGIT) -
  G.modifiers.deflectExtraLegit;

export const deflectSeedCount = (G: GState): number =>
  anyForumSeated(G) ? TUNING.DEFLECT_SEEDS : TUNING.DEFLECT_SEEDS_NO_FORUM;

export const backlashLeftInDeck = (G: GState): number =>
  G.eventDeck.filter((id) => (BACKLASH_IDS as string[]).includes(id)).length;

/** The seat whose input the game is waiting on. */
export function actingSeat(ctx: Ctx): Seat {
  const ap = ctx.activePlayers;
  if (ap) {
    const keys = Object.keys(ap);
    if (keys.length === 1) return keys[0] as Seat;
  }
  return ctx.currentPlayer as Seat;
}

export interface LegalMove {
  move: string;
  args?: unknown[];
  label: string;
  detail?: string;
  disabled?: boolean;
  reason?: string;
}

/** Drives the bottom action bar. Cheap to compute; UI calls it on every render. */
export function legalMoves(G: GState, ctx: Ctx): LegalMove[] {
  if (ctx.gameover || G.ending) return [];
  const seat = actingSeat(ctx);
  const stage = ctx.activePlayers?.[seat] ?? null;
  const out: LegalMove[] = [];

  if (ctx.phase === 'vendor' && seat === DEPLOYER && G.pending.vendor) {
    // options are rendered by the vendor modal, not the action bar
    return out;
  }

  if (ctx.phase === 'negotiation' && seat === COMMUNITY && stage === 'act') {
    const att = G.perRound.attention;
    for (const qid of QUESTION_ORDER) {
      if (G.questions[qid] !== 'hand') continue;
      out.push({
        move: 'askQuestion', args: [qid], label: `Ask: ${QUESTION_DEFS[qid].q}`,
        disabled: att < TUNING.COST_QUESTION, reason: 'no attention left',
      });
    }
    for (const cid of CONTEXT_ORDER) {
      if (G.contexts[cid].revealed) continue;
      const free = G.perRound.freeContextReveals > 0;
      out.push({
        move: 'revealContext', args: [cid], label: `Reveal context`,
        detail: cid, disabled: !free && att < TUNING.COST_REVEAL_CONTEXT, reason: 'no attention left',
      });
    }
    for (const fid of FORUM_ORDER) {
      if (G.forums[fid].status !== 'deck') continue;
      out.push({
        move: 'proposeForum', args: [fid], label: `Propose: ${FORUM_DEFS[fid].nm}`,
        disabled: att < TUNING.COST_PROPOSE_FORUM, reason: 'no attention left',
      });
    }
    if (G.forums.oversight.status === 'seated' && !G.perRound.oversightUsed) {
      for (const sid of SYSTEM_ORDER) {
        if (G.system[sid].faceup || G.system[sid].sealed) continue;
        out.push({ move: 'oversightInspect', args: [sid], label: 'Oversight: inspect', detail: sid });
      }
    }
    if (G.forums.contest.status === 'seated' && !G.perRound.contestUsed && backlashLeftInDeck(G) > 0) {
      out.push({ move: 'contestDiscardBacklash', label: 'Contest & Correct: discard a Backlash' });
    }
    out.push({ move: 'communityPass', label: 'Pass — hand the table to the deployer' });
    return out;
  }

  if (ctx.phase === 'negotiation' && seat === DEPLOYER && stage === 'respond') {
    if (G.pending.question) {
      out.push({ move: 'answerQuestion', label: 'Answer — flip the card' });
      out.push({
        move: 'deflect',
        label: `Deflect (Legitimacy ${deflectLegitCost(G)}, seed ${deflectSeedCount(G)} Backlash)`,
      });
      for (const rid of REDESIGN_ORDER) {
        if (G.redesigns[rid] !== 'hand') continue;
        const cost = effectiveRedesignCost(G, rid);
        out.push({
          move: 'playRedesign', args: [rid], label: `Redesign: ${REDESIGN_DEFS[rid].nm} (${cost})`,
          disabled: G.budget < cost, reason: 'not enough budget',
        });
      }
    }
    for (const fid of FORUM_ORDER) {
      if (G.forums[fid].status !== 'proposed') continue;
      const cost = effectiveForumCost(G, fid);
      out.push({
        move: 'fundForum', args: [fid], label: `Fund: ${FORUM_DEFS[fid].nm} (${cost})`,
        disabled: G.budget < cost, reason: 'not enough budget',
      });
    }
    if (!G.pending.question && G.pending.fundingWindow) {
      out.push({ move: 'deployerDone', label: 'Done — close negotiation' });
    }
    return out;
  }

  if (ctx.phase === 'event' && G.pending.event) {
    const ev = G.pending.event;
    if (seat === COMMUNITY && stage === 'react' && !ev.resolution) {
      for (const cid of ev.eligibleReveals) {
        out.push({ move: 'reactionReveal', args: [cid], label: 'Reveal context (free)', detail: cid });
      }
      out.push({ move: 'passReaction', label: ev.eligibleReveals.length ? 'Resolve without revealing' : 'Resolve the event' });
      return out;
    }
    if (seat === COMMUNITY && stage === 'councilPick') {
      for (const sid of SYSTEM_ORDER) {
        if (G.system[sid].faceup) continue;
        out.push({ move: 'councilPick', args: [sid], label: 'Subpoena: force-flip', detail: sid });
      }
      return out;
    }
    if (seat === DEPLOYER && stage === 'ack') {
      out.push({ move: 'acknowledgeEvent', label: 'Acknowledge' });
      return out;
    }
  }

  if (ctx.phase === 'upkeep' && seat === DEPLOYER && !G.upkeepDone) {
    if (G.redesigns.humanAtGate === 'applied') {
      out.push({
        move: 'endRound', args: [{ payHumanAtGate: true }],
        label: `End round — pay Human at the Gate (${TUNING.HUMAN_AT_GATE_UPKEEP})`,
        disabled: G.budget < TUNING.HUMAN_AT_GATE_UPKEEP, reason: 'not enough budget',
      });
      out.push({ move: 'endRound', args: [{ payHumanAtGate: false }], label: 'End round — let it lapse' });
    } else {
      out.push({ move: 'endRound', args: [{}], label: 'End round' });
    }
    return out;
  }

  return out;
}
