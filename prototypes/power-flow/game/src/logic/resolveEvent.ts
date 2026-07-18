import type { RandomAPI } from 'boardgame.io/dist/types/src/plugins/random/random';
import { TUNING as T } from '../tuning';
import type { GState } from '../state';
import { logLine } from '../state';
import type { Deltas, ResolvedLine, SystemCardId } from '../content/types';
import { EVENT_DEFS } from '../content/events';
import { FORUM_DEFS } from '../content/forums';
import { applyDelta } from './dials';
import { makeView, type BoardView } from './selectors';

/** Halve toward zero: −3 → −1, −1 → 0. Generosity is a knob (see tuning). */
const halve = (n: number, factor: number) => Math.trunc(n * factor) || 0; // || 0 normalizes −0
/** One step milder: move a penalty toward zero by `step`, never past it. */
const soften = (n: number, step: number) => (n < 0 ? Math.min(0, n + step) : n);

/**
 * Forum absorption, centralized. Only fired lines with legitimacy penalties are touched:
 * Notice halves publicDiscovers; Human Review halves falseMatch; Audit softens accuracy.
 * (Contest & Correct's court/fareStrike special cases live in those resolvers — they
 * change which branch fires, not the size of a penalty.)
 */
export function applyForumFilters(view: BoardView, lines: ResolvedLine[]): ResolvedLine[] {
  for (const ln of lines) {
    if (!ln.fired || !ln.deltas?.legitimacy || ln.deltas.legitimacy >= 0) continue;
    let legit = ln.deltas.legitimacy;
    const absorbedBy: string[] = [];
    if (view.seated('notice') && ln.tags?.includes('publicDiscovers')) {
      legit = halve(legit, T.NOTICE_DISCOVERS_FACTOR);
      absorbedBy.push(FORUM_DEFS.notice.nm);
    }
    if (view.seated('humanReview') && ln.tags?.includes('falseMatch')) {
      legit = halve(legit, T.HUMAN_REVIEW_FALSEMATCH_FACTOR);
      absorbedBy.push(FORUM_DEFS.humanReview.nm);
    }
    if (view.seated('audit') && ln.tags?.includes('accuracy')) {
      legit = soften(legit, T.AUDIT_ACCURACY_SOFTEN);
      absorbedBy.push(FORUM_DEFS.audit.nm);
    }
    if (absorbedBy.length) {
      ln.deltas = { ...ln.deltas, legitimacy: legit };
      ln.absorbedBy = absorbedBy;
    }
  }
  return lines;
}

export function forceFlip(G: GState, id: SystemCardId): void {
  const card = G.system[id];
  if (card.sealed) {
    card.sealed = false;
    logLine(G, 'event', 'The seal breaks.');
  }
  card.faceup = true;
}

/** Shuffle up to n cards from the backlash pool into the remaining event deck. */
export function seedBacklash(G: GState, random: Pick<RandomAPI, 'Shuffle'>, n: number): number {
  const seeded = G.backlashPool.splice(0, n);
  if (seeded.length) {
    G.eventDeck = random.Shuffle([...G.eventDeck, ...seeded]);
    logLine(G, 'event', `${seeded.length} Backlash card${seeded.length > 1 ? 's' : ''} shuffled into the Event deck.`);
  }
  return seeded.length;
}

function applyLineDeltas(G: GState, random: Pick<RandomAPI, 'Shuffle'>, d: Deltas) {
  const applied = applyDelta(G, { utility: d.utility, legitimacy: d.legitimacy, budget: d.budget });
  if (d.seedBacklash) seedBacklash(G, random, d.seedBacklash);
  if (d.flipCard) forceFlip(G, d.flipCard);
  if (d.freezeUtility) {
    // "frozen one round" = the rest of this round plus the next one
    G.modifiers.utilityFrozenUntilRound = Math.max(G.modifiers.utilityFrozenUntilRound, G.round + d.freezeUtility);
  }
  if (d.legitScale) G.modifiers.legitScale = { factor: d.legitScale.factor, roundsLeft: d.legitScale.rounds };
  if (d.surfaceProtest) G.modifiers.protestUnsurfaced = true;
  if (d.clearProtest) G.modifiers.protestUnsurfaced = false;
  if (d.defuseFareStrike) G.modifiers.fareStrikeDefused = true;
  return applied;
}

/**
 * The pipeline: resolve → forum filters → snapshot dials → apply line by line.
 * Annotated lines land on pending.event.resolution for the modal stepper.
 */
export function resolveAndApply(
  G: GState,
  random: Pick<RandomAPI, 'Shuffle'>,
  extra?: { councilPick?: SystemCardId },
): void {
  const ev = G.pending.event;
  if (!ev || ev.resolution) return;
  const view = makeView(G);
  const def = EVENT_DEFS[ev.id];
  const lines: ResolvedLine[] = applyForumFilters(view, def.resolve(view, extra));

  ev.dialsBefore = { utility: G.utility, legitimacy: G.legitimacy, budget: G.budget };
  logLine(G, 'event', `${def.isBacklash ? 'Backlash' : 'Event'}: ${def.nm}`);
  for (const ln of lines) {
    if (ln.fired && ln.deltas) ln.applied = applyLineDeltas(G, random, ln.deltas);
    if (ln.fired) {
      const suffix = ln.absorbedBy?.length ? ` (absorbed by ${ln.absorbedBy.join(', ')})` : '';
      logLine(G, 'event', `${ln.cond} ${ln.text}${suffix}`.trim());
    }
    if (G.ending) break; // a floor breach ends the game mid-resolution
  }
  ev.resolution = lines;
}
