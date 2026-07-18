import { describe, expect, it } from 'vitest';
import { applyDelta, scaleLegit } from '../src/logic/dials';
import { pureG } from './helpers';

describe('applyDelta', () => {
  it('clamps to 0–10', () => {
    const g = pureG();
    g.legitimacy = 9;
    const applied = applyDelta(g, { legitimacy: 5 });
    expect(g.legitimacy).toBe(10);
    expect(applied.legitimacy).toBe(1); // reports actual movement, not the request
    g.forums.sunset.status = 'seated'; // avoid collapse noise below the floor
  });

  it('budget floors at 0 and never ends the game', () => {
    const g = pureG();
    g.budget = 1;
    const applied = applyDelta(g, { budget: -3 });
    expect(g.budget).toBe(0);
    expect(applied.budget).toBe(-1);
    expect(g.ending).toBeNull();
  });

  it('either dial at the floor sets collapse', () => {
    const g = pureG();
    applyDelta(g, { legitimacy: -2 }); // 5 → 3
    expect(g.ending).toBe('collapse');

    const g2 = pureG();
    applyDelta(g2, { utility: -3 }); // 6 → 3
    expect(g2.ending).toBe('collapse');
  });

  it('sunset clause turns collapse into woundDown with +2 recovery', () => {
    const g = pureG();
    g.forums.sunset.status = 'seated';
    applyDelta(g, { legitimacy: -4 }); // 5 → 1 → floor
    expect(g.ending).toBe('woundDown');
    expect(g.legitimacy).toBe(3); // 1 + 2
    expect(g.utility).toBe(8); // 6 + 2
  });

  it('election scaling doubles exactly and halves toward zero', () => {
    const g = pureG();
    g.modifiers.legitScale = { factor: 2, roundsLeft: 1 };
    expect(scaleLegit(g, -2)).toBe(-4);
    expect(scaleLegit(g, 1)).toBe(2);
    g.modifiers.legitScale = { factor: 0.5, roundsLeft: 1 };
    expect(scaleLegit(g, -3)).toBe(-1); // trunc toward zero
    expect(scaleLegit(g, -1)).toBe(0);
    expect(scaleLegit(g, 2)).toBe(1);
  });

  it('scaling applies inside applyDelta', () => {
    const g = pureG();
    g.modifiers.legitScale = { factor: 2, roundsLeft: 1 };
    g.legitimacy = 8;
    applyDelta(g, { legitimacy: -1 });
    expect(g.legitimacy).toBe(6);
  });

  it('utility freeze blocks both directions until the round passes', () => {
    const g = pureG();
    g.modifiers.utilityFrozenUntilRound = 2; // frozen through round 2
    const a1 = applyDelta(g, { utility: -2 });
    const a2 = applyDelta(g, { utility: 3 });
    expect(g.utility).toBe(6);
    expect(a1.utility).toBe(0);
    expect(a2.utility).toBe(0);
    g.round = 3; // the injunction has run out
    applyDelta(g, { utility: 2 });
    expect(g.utility).toBe(8);
  });
});
