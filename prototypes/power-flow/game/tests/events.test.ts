import { describe, expect, it } from 'vitest';
import { EVENT_DEFS } from '../src/content/events';
import { makeView } from '../src/logic/selectors';
import { applyForumFilters, resolveAndApply } from '../src/logic/resolveEvent';
import type { GState } from '../src/state';
import type { EventId, ResolvedLine } from '../src/content/types';
import { pureG } from './helpers';

const noShuffle = { Shuffle: <T,>(a: T[]) => a };

const fired = (g: GState, id: EventId, extra?: { councilPick?: never }) =>
  EVENT_DEFS[id].resolve(makeView(g), extra).filter((l) => l.fired);

/** Run the full pipeline on a staged pending event and return the fired lines. */
function pipeline(g: GState, id: EventId, councilPick?: string): ResolvedLine[] {
  g.pending.event = {
    id, isBacklash: EVENT_DEFS[id].isBacklash, eligibleReveals: [],
    awaitingCouncilPick: false, dialsBefore: null, resolution: null,
  };
  resolveAndApply(g, noShuffle, councilPick ? { councilPick: councilPick as never } : undefined);
  return (g.pending.event!.resolution ?? []).filter((l) => l.fired);
}

describe('breach at the vendor', () => {
  it('cloud + 7 years leaks: −4', () => {
    const g = pureG();
    const lines = fired(g, 'breach');
    expect(lines).toHaveLength(1);
    expect(lines[0].deltas?.legitimacy).toBe(-4);
  });
  it('leaving quietly adds −2 while the movement log exists', () => {
    const g = pureG();
    g.contexts.leavingQuietly.revealed = true;
    const extra = fired(g, 'breach').find((l) => l.cond.startsWith('Leaving'));
    expect(extra?.deltas?.legitimacy).toBe(-2);
  });
  it('no location log defuses the leaving-quietly rider', () => {
    const g = pureG();
    g.contexts.leavingQuietly.revealed = true;
    g.values.outputLog = 'passOnly';
    expect(fired(g, 'breach').some((l) => l.cond.startsWith('Leaving'))).toBe(false);
  });
  it('24h purge flips it to the told-you-so bonus (+2)', () => {
    const g = pureG();
    g.values.retention = 'hours24';
    const lines = fired(g, 'breach');
    expect(lines).toHaveLength(1);
    expect(lines[0].deltas?.legitimacy).toBe(2);
  });
  it('on-device is also safe', () => {
    const g = pureG();
    g.values.storage = 'onDevice';
    expect(fired(g, 'breach')[0].deltas?.legitimacy).toBe(2);
  });
});

describe('the FOIA', () => {
  it('nothing fires with no deflects and a part-hidden board', () => {
    expect(fired(pureG(), 'foia')).toHaveLength(0);
  });
  it('charges −1 per prior deflect', () => {
    const g = pureG();
    g.counters.deflects = 3;
    expect(fired(g, 'foia')[0].deltas?.legitimacy).toBe(-3);
  });
  it('surfaces the quiet protest handover (−3) and clears the pin', () => {
    const g = pureG();
    g.modifiers.protestUnsurfaced = true;
    const lines = pipeline(g, 'foia');
    expect(lines[0].deltas?.legitimacy).toBe(-3);
    expect(g.modifiers.protestUnsurfaced).toBe(false);
    expect(g.legitimacy).toBe(2); // 5 − 3; floor breach not hit
  });
  it('all-9-faceup bonus requires the seal opened', () => {
    const g = pureG();
    for (const id of Object.keys(g.system) as (keyof GState['system'])[]) g.system[id].faceup = true;
    g.system.error.sealed = false;
    expect(fired(g, 'foia')[0].deltas?.legitimacy).toBe(1);
    // one card back down: no bonus
    g.system.makes.faceup = false;
    expect(fired(g, 'foia')).toHaveLength(0);
  });
});

describe('false match at gate 7', () => {
  it('autonomous + no recourse: −3 and a backlash seed', () => {
    const g = pureG();
    const bad = fired(g, 'falseMatch').find((l) => l.deltas);
    expect(bad?.deltas).toMatchObject({ legitimacy: -3, seedBacklash: 1 });
  });
  it('night shift revealed doubles the unhandled hit', () => {
    const g = pureG();
    g.contexts.nightShift.revealed = true;
    const bad = fired(g, 'falseMatch').find((l) => l.deltas?.seedBacklash);
    expect(bad?.deltas?.legitimacy).toBe(-6);
  });
  it('human at the gate handles it: −1 then +1 back, no seed', () => {
    const g = pureG();
    g.values.autonomy = 'human_executes';
    const lines = fired(g, 'falseMatch');
    expect(lines.some((l) => l.deltas?.seedBacklash)).toBe(false);
    expect(lines.map((l) => l.deltas?.legitimacy).filter(Boolean)).toEqual([-1, 1]);
  });
  it('a seated human-review forum also handles it', () => {
    const g = pureG();
    g.forums.humanReview.status = 'seated';
    expect(fired(g, 'falseMatch').some((l) => l.deltas?.seedBacklash)).toBe(false);
  });
  it('the misread forces the sealed card open', () => {
    const g = pureG();
    g.contexts.misread.revealed = true;
    pipeline(g, 'falseMatch');
    expect(g.system.error.faceup).toBe(true);
    expect(g.system.error.sealed).toBe(false);
  });
});

describe('protest at the plaza', () => {
  it('on request + log exists: pins the −3 for the FOIA, no immediate hit', () => {
    const g = pureG();
    pipeline(g, 'protest');
    expect(g.modifiers.protestUnsurfaced).toBe(true);
    expect(g.legitimacy).toBe(5);
  });
  it('jumpers revealed adds −1 while police access stands', () => {
    const g = pureG();
    g.contexts.jumpers.revealed = true;
    pipeline(g, 'protest');
    expect(g.legitimacy).toBe(4);
  });
  it('warrant required kills the request: +2', () => {
    const g = pureG();
    g.values.policeAccess = 'warrantOnly';
    pipeline(g, 'protest');
    expect(g.legitimacy).toBe(7);
    expect(g.modifiers.protestUnsurfaced).toBe(false);
  });
  it('no location log leaves nothing to hand over', () => {
    const g = pureG();
    g.values.outputLog = 'passOnly';
    pipeline(g, 'protest');
    expect(g.modifiers.protestUnsurfaced).toBe(false);
    expect(g.legitimacy).toBe(5);
  });
});

describe('ridership report', () => {
  const cases: Array<[boolean, 'everyRider' | 'enrolledOnly', number]> = [
    [true, 'everyRider', -2], // no papers unaddressed
    [true, 'enrolledOnly', -1], // tap-to-skip defuses it
    [false, 'enrolledOnly', -1], // the slower lane still costs
    [false, 'everyRider', 1], // confirmed
  ];
  it.each(cases)('noPapers=%s enrollment=%s → utility %i', (revealed, enrollment, delta) => {
    const g = pureG();
    g.contexts.noPapers.revealed = revealed;
    g.values.enrollment = enrollment;
    const line = fired(g, 'ridership').find((l) => l.deltas);
    expect(line?.deltas?.utility).toBe(delta);
  });
});

describe('the twins & the data broker', () => {
  it('twins: contest seated fixes it (+1), else −1', () => {
    const g = pureG();
    expect(fired(g, 'twins').find((l) => l.deltas)?.deltas?.legitimacy).toBe(-1);
    g.forums.contest.status = 'seated';
    expect(fired(g, 'twins').find((l) => l.deltas)?.deltas?.legitimacy).toBe(1);
  });
  it('data broker: −3 with the log, −1 without, +1 when renegotiated', () => {
    const g = pureG();
    expect(fired(g, 'dataBroker')[0].deltas?.legitimacy).toBe(-3);
    g.values.outputLog = 'passOnly';
    expect(fired(g, 'dataBroker')[0].deltas?.legitimacy).toBe(-1);
    g.values.dataOwner = 'city';
    expect(fired(g, 'dataBroker')[0].deltas?.legitimacy).toBe(1);
  });
});

describe('backlash', () => {
  it('fare strike hits −2/−1 without contest', () => {
    const g = pureG();
    pipeline(g, 'fareStrike');
    expect(g.utility).toBe(4);
    expect(g.legitimacy).toBe(4);
  });
  it('contest defuses the fare strike exactly once', () => {
    const g = pureG();
    g.forums.contest.status = 'seated';
    pipeline(g, 'fareStrike');
    expect(g.utility).toBe(6);
    expect(g.modifiers.fareStrikeDefused).toBe(true);
    g.pending.event = null;
    pipeline(g, 'fareStrike'); // the second strike is not absorbed
    expect(g.utility).toBe(4);
  });
  it('court freezes utility without contest, settles for budget −1 with it', () => {
    const g = pureG();
    pipeline(g, 'court');
    expect(g.modifiers.utilityFrozenUntilRound).toBe(2); // rest of round 1 + round 2
    const g2 = pureG();
    g2.forums.contest.status = 'seated';
    pipeline(g2, 'court');
    expect(g2.budget).toBe(7);
    expect(g2.modifiers.utilityFrozenUntilRound).toBe(0);
  });
  it('council hearing flips the community’s pick and breaks the seal', () => {
    const g = pureG();
    pipeline(g, 'councilHearing', 'error');
    expect(g.system.error.faceup).toBe(true);
    expect(g.system.error.sealed).toBe(false);
  });
  it('gates held open: utility −2', () => {
    const g = pureG();
    pipeline(g, 'gatesHeldOpen');
    expect(g.utility).toBe(4);
  });
});

describe('election year', () => {
  it('sets the ×2 scale, halved with oversight', () => {
    const g = pureG();
    pipeline(g, 'electionYear');
    expect(g.modifiers.legitScale).toMatchObject({ factor: 2 });
    const g2 = pureG();
    g2.forums.oversight.status = 'seated';
    pipeline(g2, 'electionYear');
    expect(g2.modifiers.legitScale).toMatchObject({ factor: 0.5 });
  });
});

describe('forum absorption (applyForumFilters)', () => {
  it('notice halves publicDiscovers penalties', () => {
    const g = pureG();
    g.forums.notice.status = 'seated';
    g.counters.deflects = 3;
    const lines = applyForumFilters(makeView(g), EVENT_DEFS.foia.resolve(makeView(g)));
    const receipt = lines.find((l) => l.fired);
    expect(receipt?.deltas?.legitimacy).toBe(-1); // trunc(−3 / 2)
    expect(receipt?.absorbedBy).toContain('Notice at the Gate');
  });
  it('audit softens accuracy penalties one step', () => {
    const g = pureG();
    g.forums.audit.status = 'seated';
    const lines = applyForumFilters(makeView(g), EVENT_DEFS.twins.resolve(makeView(g)));
    expect(lines.find((l) => l.fired && l.deltas)?.deltas?.legitimacy).toBe(0); // −1 → 0
  });
  it('human review halves falseMatch-tagged penalties (twins)', () => {
    const g = pureG();
    g.forums.humanReview.status = 'seated';
    const lines = applyForumFilters(makeView(g), EVENT_DEFS.twins.resolve(makeView(g)));
    expect(lines.find((l) => l.fired && l.deltas)?.deltas?.legitimacy).toBe(0); // trunc(−0.5)
  });
  it('bonuses are never absorbed', () => {
    const g = pureG();
    g.forums.notice.status = 'seated';
    g.values.retention = 'hours24';
    const lines = applyForumFilters(makeView(g), EVENT_DEFS.breach.resolve(makeView(g)));
    expect(lines.find((l) => l.fired)?.deltas?.legitimacy).toBe(2);
  });
});
