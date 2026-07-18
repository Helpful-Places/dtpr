import { TUNING } from '../tuning';
import type { GState } from '../state';
import { logLine } from '../state';

const clamp = (n: number) => Math.max(TUNING.DIAL_MIN, Math.min(TUNING.DIAL_MAX, n));

/** Election-year scaling: doubled exactly; halving truncates toward zero (−3 → −1). */
export function scaleLegit(G: GState, delta: number): number {
  const s = G.modifiers.legitScale;
  if (!s || delta === 0) return delta;
  return Math.trunc(delta * s.factor) || 0; // || 0 normalizes −0
}

export interface DialDeltas {
  utility?: number;
  legitimacy?: number;
  budget?: number;
}

export interface AppliedDeltas {
  utility: number;
  legitimacy: number;
  budget: number;
}

/**
 * The single gate every dial change passes through:
 * legitimacy scaling → utility freeze → clamp 0–10 → floor check sets G.ending.
 * Returns what actually moved (for the resolution stepper and tests).
 */
export function applyDelta(G: GState, d: DialDeltas): AppliedDeltas {
  const applied: AppliedDeltas = { utility: 0, legitimacy: 0, budget: 0 };

  if (d.legitimacy) {
    const scaled = scaleLegit(G, d.legitimacy);
    const next = clamp(G.legitimacy + scaled);
    applied.legitimacy = next - G.legitimacy;
    G.legitimacy = next;
  }
  if (d.utility) {
    if (G.round <= G.modifiers.utilityFrozenUntilRound) {
      applied.utility = 0; // injunction: the dial is frozen, both directions
    } else {
      const next = clamp(G.utility + d.utility);
      applied.utility = next - G.utility;
      G.utility = next;
    }
  }
  if (d.budget) {
    const next = Math.max(0, G.budget + d.budget);
    applied.budget = next - G.budget;
    G.budget = next;
  }

  checkFloors(G);
  return applied;
}

/** Either dial at or below the floor ends the game immediately — even mid-event. */
export function checkFloors(G: GState): void {
  if (G.ending) return;
  if (G.utility <= TUNING.FLOOR || G.legitimacy <= TUNING.FLOOR) {
    if (G.forums.sunset.status === 'seated') {
      G.ending = 'woundDown';
      G.utility = clamp(G.utility + TUNING.WOUND_DOWN_RECOVERY);
      G.legitimacy = clamp(G.legitimacy + TUNING.WOUND_DOWN_RECOVERY);
      logLine(G, 'system', 'A dial hit the floor — the Sunset Clause winds the system down. Both sides recover +2.');
    } else {
      G.ending = 'collapse';
      logLine(G, 'system', 'A dial hit the floor. Collapse: the project is dead, and the community loses the service too.');
    }
  }
}
