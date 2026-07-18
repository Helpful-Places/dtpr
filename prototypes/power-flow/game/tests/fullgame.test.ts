import { describe, expect, it } from 'vitest';
import { COMMUNITY, DEPLOYER } from '../src/content/types';
import type { GameoverPayload } from '../src/logic/endings';
import {
  G, as, askAndAnswer, askAndRedesign, ctx, gameover, makeClient,
  resolveEvent, skipNegotiation, upkeep, vendorChoose,
} from './helpers';

const over = (c: ReturnType<typeof makeClient>) => gameover(c) as GameoverPayload | undefined;

describe('scripted playthroughs', () => {
  /** Cooperative: fund a forum, answer questions, redesign twice → Deployed & Trusted. */
  function cooperative(fundContest: boolean) {
    const c = makeClient({
      vendorDeck: ['emotionUpgrade', 'referenceDiscount', 'proprietary', 'cloudOrDouble', 'dataIsOurs'],
      eventDeck: ['twins', 'ridership', 'breach', 'foia', 'protest'],
    });
    // R1 — the temptation card, then seat (or don't seat) Contest & Correct
    vendorChoose(c, 'accept'); // U 6→7, no contexts revealed → free
    as(c, COMMUNITY, 'proposeForum', 'contest');
    as(c, COMMUNITY, 'communityPass');
    if (fundContest) as(c, DEPLOYER, 'fundForum', 'contest');
    as(c, DEPLOYER, 'deployerDone');
    resolveEvent(c); // twins: +1 with contest, −1 without
    upkeep(c);
    // R2
    vendorChoose(c, 'refuse');
    askAndAnswer(c, 'howLong');
    skipNegotiation(c);
    resolveEvent(c); // ridership: +1 utility
    upkeep(c);
    // R3
    vendorChoose(c, 'acknowledge'); // proprietary
    askAndRedesign(c, 'whereLives', 'purge24'); // retention → 24h
    skipNegotiation(c);
    resolveEvent(c); // breach: purged → +2 legitimacy
    upkeep(c);
    // R4
    vendorChoose(c, 'acknowledge'); // cloudOrDouble
    skipNegotiation(c);
    resolveEvent(c); // foia: no deflects, board part-hidden → nothing
    upkeep(c);
    // R5
    vendorChoose(c, 'renegotiate'); // second redesign, data becomes the city's
    skipNegotiation(c);
    resolveEvent(c); // protest: complies quietly, pin never surfaces
    upkeep(c);
    return c;
  }

  it('cooperative play reaches Deployed & Trusted', () => {
    const c = cooperative(true);
    const payload = over(c);
    expect(payload?.ending).toBe('deployedTrusted');
    expect(G(c).utility).toBe(8);
    expect(G(c).legitimacy).toBe(8);
  });

  it('the same script minus forum funding is NOT deployedTrusted — the lock rule', () => {
    const c = cooperative(false);
    const payload = over(c);
    expect(payload?.ending).toBe('stalled'); // dials fine, table empty → shelved
    expect(payload?.ending).not.toBe('deployedTrusted');
  });

  it('the redesign path reaches Redesigned & Trusted', () => {
    const c = makeClient({
      vendorDeck: ['dataIsOurs', 'referenceDiscount', 'proprietary', 'cloudOrDouble', 'emotionUpgrade'],
      eventDeck: ['foia', 'budgetCut', 'ridership', 'foia', 'foia'],
    });
    // R1 — renegotiate now (4): redesign #1; then purge24 as a question response (#2); fund sunset
    vendorChoose(c, 'renegotiate');
    as(c, COMMUNITY, 'proposeForum', 'sunset');
    askAndRedesign(c, 'howLong', 'purge24');
    as(c, COMMUNITY, 'communityPass');
    as(c, DEPLOYER, 'fundForum', 'sunset');
    as(c, DEPLOYER, 'deployerDone');
    resolveEvent(c);
    upkeep(c);
    // R2–R5: quiet rounds
    for (const opt of ['refuse', 'acknowledge', 'acknowledge', 'decline']) {
      vendorChoose(c, opt);
      skipNegotiation(c);
      resolveEvent(c);
      upkeep(c);
    }
    const payload = over(c);
    expect(payload?.ending).toBe('redesignedTrusted');
    expect(payload?.redesignsApplied).toBe(2);
    expect(G(c).utility).toBe(7); // 6 + ridership
    expect(G(c).legitimacy).toBe(5); // untouched — below trusted, above the redesign bar
  });

  it('stonewalling reaches Deployed Over Objection, with double-seeding verified', () => {
    const c = makeClient({
      vendorDeck: ['referenceDiscount', 'proprietary', 'cloudOrDouble', 'emotionUpgrade', 'dataIsOurs'],
      eventDeck: ['ridership', 'budgetCut', 'ridership', 'budgetCut', 'ridership'],
      backlashPool: ['court', 'councilHearing', 'gatesHeldOpen', 'fareStrike'],
    });
    vendorChoose(c, 'refuse');
    as(c, COMMUNITY, 'askQuestion', 'whoCanSee');
    as(c, DEPLOYER, 'deflect');
    // the zero-sum lock rule: empty table → 2 backlash seeded
    expect(G(c).eventDeck.length).toBe(7);
    expect(G(c).backlashPool.length).toBe(2);
    expect(G(c).legitimacy).toBe(4);
    skipNegotiation(c);
    resolveEvent(c);
    upkeep(c);
    for (const opt of ['acknowledge', 'acknowledge', 'decline', 'letStand']) {
      vendorChoose(c, opt);
      skipNegotiation(c);
      resolveEvent(c);
      upkeep(c);
    }
    const payload = over(c)!;
    expect(payload.ending).toBe('overObjection');
    expect(payload.deployerScore).toBe(payload.utility - payload.backlashLeft);
    // 2 of the 7 deck cards were seeded backlash; 5 rounds drew 5 — whatever
    // remains undrawn is the score penalty
    expect(payload.backlashLeft).toBe(
      G(c).eventDeck.filter((id) => ['court', 'councilHearing', 'gatesHeldOpen', 'fareStrike'].includes(id)).length,
    );
  });

  it('a floor breach mid-event collapses the game immediately', () => {
    const c = makeClient({
      vendorDeck: ['referenceDiscount', 'proprietary', 'cloudOrDouble', 'emotionUpgrade', 'dataIsOurs'],
      eventDeck: ['breach', 'foia', 'foia', 'foia', 'foia'],
    });
    vendorChoose(c, 'refuse');
    skipNegotiation(c);
    as(c, COMMUNITY, 'passReaction'); // breach: 5 − 4 = 1 → floor
    const payload = over(c)!;
    expect(payload.ending).toBe('collapse');
    expect(G(c).legitimacy).toBe(1);
    expect(ctx(c).gameover).toBeTruthy(); // over before any acknowledgement
  });

  it('the same breach with a seated Sunset Clause winds down instead', () => {
    const c = makeClient({
      vendorDeck: ['referenceDiscount', 'proprietary', 'cloudOrDouble', 'emotionUpgrade', 'dataIsOurs'],
      eventDeck: ['breach', 'foia', 'foia', 'foia', 'foia'],
    });
    vendorChoose(c, 'refuse');
    as(c, COMMUNITY, 'proposeForum', 'sunset');
    as(c, COMMUNITY, 'communityPass');
    as(c, DEPLOYER, 'fundForum', 'sunset');
    as(c, DEPLOYER, 'deployerDone');
    as(c, COMMUNITY, 'passReaction');
    const payload = over(c)!;
    expect(payload.ending).toBe('woundDown');
    expect(G(c).legitimacy).toBe(3); // 1 + 2 recovery
    expect(G(c).utility).toBe(8); // 6 + 2 recovery
  });

  it('the council hearing lets the community break the seal in public', () => {
    const c = makeClient({
      vendorDeck: ['referenceDiscount', 'proprietary', 'cloudOrDouble', 'emotionUpgrade', 'dataIsOurs'],
      eventDeck: ['councilHearing', 'foia', 'foia', 'foia', 'foia'],
    });
    vendorChoose(c, 'refuse');
    skipNegotiation(c);
    as(c, COMMUNITY, 'passReaction');
    expect(G(c).pending.event?.awaitingCouncilPick).toBe(true);
    as(c, COMMUNITY, 'councilPick', 'error');
    expect(G(c).system.error.sealed).toBe(false);
    expect(G(c).system.error.faceup).toBe(true);
    expect(over(c)).toBeUndefined(); // the game goes on
    as(c, DEPLOYER, 'acknowledgeEvent');
    expect(ctx(c).phase).toBe('upkeep');
  });

  it('human at the gate: pay upkeep to keep it, lapse snaps the dial back', () => {
    const c = makeClient({
      vendorDeck: ['referenceDiscount', 'proprietary', 'cloudOrDouble', 'emotionUpgrade', 'dataIsOurs'],
      eventDeck: ['ridership', 'foia', 'foia', 'foia', 'foia'],
    });
    vendorChoose(c, 'refuse');
    askAndRedesign(c, 'decidesAlone', 'humanAtGate'); // budget 7, autonomy human, U 5
    expect(G(c).values.autonomy).toBe('human_executes');
    expect(G(c).utility).toBe(5);
    skipNegotiation(c);
    resolveEvent(c); // ridership +1 → 6
    upkeep(c, true); // pay 1 → budget 6
    expect(G(c).budget).toBe(6);
    expect(G(c).redesigns.humanAtGate).toBe('applied');

    vendorChoose(c, 'acknowledge');
    skipNegotiation(c);
    resolveEvent(c);
    upkeep(c, false); // let it lapse
    expect(G(c).redesigns.humanAtGate).toBe('lapsed');
    expect(G(c).values.autonomy).toBe('autonomous');
    expect(G(c).utility).toBe(7); // the peak-hours drag lifts
    expect(G(c).budget).toBe(6); // nothing paid
  });

  it('the same seed is fully deterministic', () => {
    const optionFor: Record<string, string> = {
      dataIsOurs: 'letStand', cloudOrDouble: 'acknowledge', proprietary: 'acknowledge',
      emotionUpgrade: 'decline', referenceDiscount: 'refuse',
    };
    const run = () => {
      const c = makeClient({ seed: 12345 });
      vendorChoose(c, optionFor[G(c).pending.vendor!]);
      as(c, COMMUNITY, 'askQuestion', 'whoCanSee');
      as(c, DEPLOYER, 'deflect'); // seeded shuffle
      return c;
    };
    const a = run();
    const b = run();
    expect(JSON.stringify(G(a))).toBe(JSON.stringify(G(b)));
  });
});
