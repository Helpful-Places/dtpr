import { describe, expect, it } from 'vitest';
import { COMMUNITY, DEPLOYER } from '../src/content/types';
import { effectiveForumCost, effectiveRedesignCost } from '../src/logic/selectors';
import { G, as, ctx, makeClient, vendorChoose } from './helpers';

/** A quiet start: refuse-able vendor card first so tests control the table. */
const DECKS = {
  vendorDeck: ['referenceDiscount', 'proprietary', 'cloudOrDouble', 'emotionUpgrade', 'dataIsOurs'],
  eventDeck: ['ridership', 'foia', 'twins', 'budgetCut', 'breach'],
} as const;

function startNegotiation() {
  const c = makeClient({ vendorDeck: [...DECKS.vendorDeck], eventDeck: [...DECKS.eventDeck] });
  vendorChoose(c, 'refuse');
  expect(ctx(c).phase).toBe('negotiation');
  return c;
}

describe('phase choreography', () => {
  it('runs vendor → negotiation and pins the community in stage act', () => {
    const c = startNegotiation();
    expect(ctx(c).activePlayers).toEqual({ [COMMUNITY]: 'act' });
  });

  it('askQuestion hands control to the deployer; answering hands it back', () => {
    const c = startNegotiation();
    as(c, COMMUNITY, 'askQuestion', 'whereLives');
    expect(ctx(c).activePlayers).toEqual({ [DEPLOYER]: 'respond' });
    as(c, DEPLOYER, 'answerQuestion');
    expect(G(c).system.lives.faceup).toBe(true);
    expect(G(c).questions.whereLives).toBe('answered');
    expect(ctx(c).activePlayers).toEqual({ [COMMUNITY]: 'act' });
  });

  it('pass opens the funding window; done closes negotiation into the event phase', () => {
    const c = startNegotiation();
    as(c, COMMUNITY, 'communityPass');
    as(c, DEPLOYER, 'deployerDone');
    expect(ctx(c).phase).toBe('event');
    expect(G(c).pending.event?.id).toBe('ridership');
  });

  it('a seat outside activePlayers cannot move (stage enforcement)', () => {
    const c = startNegotiation();
    as(c, DEPLOYER, 'answerQuestion'); // nothing pending, wrong seat, wrong stage
    expect(G(c).pending.question).toBeNull();
    as(c, DEPLOYER, 'communityPass'); // deployer can't play a community move
    expect(G(c).pending.fundingWindow).toBe(false);
  });
});

describe('community move guards', () => {
  it('attention is 3 per round and gates every paid move', () => {
    const c = startNegotiation();
    as(c, COMMUNITY, 'revealContext', 'nightShift');
    as(c, COMMUNITY, 'proposeForum', 'contest');
    as(c, COMMUNITY, 'askQuestion', 'howLong');
    as(c, DEPLOYER, 'answerQuestion');
    expect(G(c).perRound.attention).toBe(0);
    as(c, COMMUNITY, 'askQuestion', 'whoCanSee'); // broke
    expect(G(c).questions.whoCanSee).toBe('hand');
    as(c, COMMUNITY, 'revealContext', 'jumpers');
    expect(G(c).contexts.jumpers.revealed).toBe(false);
  });

  it('questions are one-shot and never re-askable', () => {
    const c = startNegotiation();
    as(c, COMMUNITY, 'askQuestion', 'whereLives');
    as(c, DEPLOYER, 'answerQuestion');
    as(c, COMMUNITY, 'askQuestion', 'whereLives');
    expect(G(c).pending.question).toBeNull();
  });

  it('only one question may be pending', () => {
    const c = startNegotiation();
    as(c, COMMUNITY, 'askQuestion', 'whereLives');
    as(c, COMMUNITY, 'askQuestion', 'howLong'); // community is no longer active anyway
    expect(G(c).pending.question?.id).toBe('whereLives');
    expect(G(c).perRound.attention).toBe(2);
  });

  it('oversight inspect requires the seat, once per round, unsealed targets only', () => {
    const c = startNegotiation();
    as(c, COMMUNITY, 'oversightInspect', 'model');
    expect(G(c).perRound.oversightPeeked).toBeNull(); // no oversight seated
    as(c, COMMUNITY, 'proposeForum', 'oversight');
    as(c, COMMUNITY, 'communityPass');
    as(c, DEPLOYER, 'fundForum', 'oversight');
    expect(G(c).forums.oversight.status).toBe('seated');
    expect(G(c).budget).toBe(5);
    as(c, DEPLOYER, 'deployerDone');
    // next round
    as(c, COMMUNITY, 'passReaction');
    as(c, DEPLOYER, 'acknowledgeEvent');
    as(c, DEPLOYER, 'endRound', {});
    vendorChoose(c, 'acknowledge'); // proprietary
    as(c, COMMUNITY, 'oversightInspect', 'error'); // sealed: neither player may look
    expect(G(c).perRound.oversightPeeked).toBeNull();
    as(c, COMMUNITY, 'oversightInspect', 'model');
    expect(G(c).perRound.oversightPeeked).toBe('model');
    as(c, COMMUNITY, 'oversightInspect', 'reads'); // once per round
    expect(G(c).perRound.oversightPeeked).toBe('model');
  });
});

describe('deployer responses', () => {
  it('answering the sealed card is “we don’t know”: Legitimacy −1, seal intact', () => {
    const c = startNegotiation();
    as(c, COMMUNITY, 'askQuestion', 'whenWrong');
    as(c, DEPLOYER, 'answerQuestion');
    expect(G(c).legitimacy).toBe(4);
    expect(G(c).system.error.sealed).toBe(true);
    expect(G(c).system.error.faceup).toBe(false);
    expect(G(c).questions.whenWrong).toBe('answered');
  });

  it('answering “who is it used on?” grants a free context reveal', () => {
    const c = startNegotiation();
    as(c, COMMUNITY, 'askQuestion', 'usedOn');
    as(c, DEPLOYER, 'answerQuestion');
    expect(G(c).perRound.freeContextReveals).toBe(1);
    as(c, COMMUNITY, 'askQuestion', 'howLong');
    as(c, DEPLOYER, 'answerQuestion');
    as(c, COMMUNITY, 'askQuestion', 'whereLives');
    as(c, DEPLOYER, 'answerQuestion');
    expect(G(c).perRound.attention).toBe(0);
    as(c, COMMUNITY, 'revealContext', 'stationMemory'); // free reveal, no attention left
    expect(G(c).contexts.stationMemory.revealed).toBe(true);
    expect(G(c).perRound.freeContextReveals).toBe(0);
  });

  it('deflect: −1 legitimacy, 2 backlash while the table is empty, 1 with a forum', () => {
    const c = startNegotiation();
    as(c, COMMUNITY, 'askQuestion', 'whoCanSee');
    const deckBefore = G(c).eventDeck.length;
    as(c, DEPLOYER, 'deflect');
    expect(G(c).legitimacy).toBe(4);
    expect(G(c).counters.deflects).toBe(1);
    expect(G(c).eventDeck.length).toBe(deckBefore + 2); // the zero-sum lock rule
    expect(G(c).backlashPool.length).toBe(2);

    as(c, COMMUNITY, 'proposeForum', 'sunset');
    as(c, COMMUNITY, 'askQuestion', 'howLong');
    as(c, DEPLOYER, 'fundForum', 'sunset');
    as(c, DEPLOYER, 'deflect');
    expect(G(c).eventDeck.length).toBe(deckBefore + 3); // now seeds only 1
    expect(G(c).backlashPool.length).toBe(1);
  });

  it('redesigns only play as question responses and pay effective costs', () => {
    const c = startNegotiation();
    as(c, COMMUNITY, 'communityPass');
    as(c, DEPLOYER, 'playRedesign', 'purge24'); // spontaneous: not allowed
    expect(G(c).redesigns.purge24).toBe('hand');
    as(c, DEPLOYER, 'deployerDone');
    as(c, COMMUNITY, 'passReaction');
    as(c, DEPLOYER, 'acknowledgeEvent');
    as(c, DEPLOYER, 'endRound', {});
    vendorChoose(c, 'acknowledge'); // proprietary: audit +1
    as(c, COMMUNITY, 'askQuestion', 'howLong');
    as(c, DEPLOYER, 'playRedesign', 'purge24');
    expect(G(c).values.retention).toBe('hours24');
    expect(G(c).system.long.faceup).toBe(true); // the swap is public
    expect(G(c).questions.howLong).toBe('redesigned');
    expect(G(c).budget).toBe(7);
    expect(G(c).counters.redesignsApplied).toBe(1);
  });

  it('funding a proposed forum does not close the window; audit breaks the seal', () => {
    const c = startNegotiation();
    as(c, COMMUNITY, 'proposeForum', 'audit');
    as(c, COMMUNITY, 'communityPass');
    as(c, DEPLOYER, 'fundForum', 'audit');
    expect(G(c).forums.audit.status).toBe('seated');
    expect(G(c).system.error.sealed).toBe(false);
    expect(G(c).system.error.faceup).toBe(true);
    expect(ctx(c).phase).toBe('negotiation'); // window still open
    as(c, DEPLOYER, 'deployerDone');
    expect(ctx(c).phase).toBe('event');
  });

  it('fundForum rejects unproposed forums and empty budgets', () => {
    const c = startNegotiation();
    as(c, COMMUNITY, 'communityPass');
    as(c, DEPLOYER, 'fundForum', 'contest'); // never proposed
    expect(G(c).forums.contest.status).toBe('deck');
    expect(G(c).budget).toBe(8);
  });
});

describe('vendor squeezes', () => {
  it('cloud-or-double raises the on-device price; proprietary taxes the audit until renegotiated', () => {
    const c = makeClient({
      vendorDeck: ['cloudOrDouble', 'proprietary', 'dataIsOurs', 'emotionUpgrade', 'referenceDiscount'],
      eventDeck: [...DECKS.eventDeck],
    });
    expect(effectiveRedesignCost(G(c), 'onDevice')).toBe(3);
    vendorChoose(c, 'acknowledge');
    expect(effectiveRedesignCost(G(c), 'onDevice')).toBe(5);

    // round 2: proprietary
    as(c, COMMUNITY, 'communityPass');
    as(c, DEPLOYER, 'deployerDone');
    as(c, COMMUNITY, 'passReaction');
    as(c, DEPLOYER, 'acknowledgeEvent');
    as(c, DEPLOYER, 'endRound', {});
    expect(effectiveForumCost(G(c), 'audit')).toBe(2);
    vendorChoose(c, 'acknowledge');
    expect(effectiveForumCost(G(c), 'audit')).toBe(3);

    // round 3: renegotiate now (3 + 1 surcharge) voids the proprietary tax
    as(c, COMMUNITY, 'communityPass');
    as(c, DEPLOYER, 'deployerDone');
    as(c, COMMUNITY, 'passReaction');
    as(c, DEPLOYER, 'acknowledgeEvent');
    as(c, DEPLOYER, 'endRound', {});
    vendorChoose(c, 'renegotiate');
    expect(G(c).values.dataOwner).toBe('city');
    expect(G(c).budget).toBe(4); // 8 − 4
    expect(effectiveForumCost(G(c), 'audit')).toBe(2);
  });

  it('the reference discount pays 2 and taxes every future deflect', () => {
    const c = startNegotiation(); // referenceDiscount was refused
    expect(G(c).budget).toBe(8);
    expect(G(c).modifiers.deflectExtraLegit).toBe(0);

    const c2 = makeClient({ vendorDeck: [...DECKS.vendorDeck], eventDeck: [...DECKS.eventDeck] });
    vendorChoose(c2, 'take');
    expect(G(c2).budget).toBe(10);
    as(c2, COMMUNITY, 'askQuestion', 'whoCanSee');
    as(c2, DEPLOYER, 'deflect');
    expect(G(c2).legitimacy).toBe(3); // −1 −1 surcharge → floor!? no: 5−2=3 → collapse
  });

  it('accepting the emotion upgrade lands scope creep against revealed contexts', () => {
    const c = makeClient({
      vendorDeck: ['referenceDiscount', 'emotionUpgrade', 'cloudOrDouble', 'proprietary', 'dataIsOurs'],
      eventDeck: [...DECKS.eventDeck],
    });
    vendorChoose(c, 'refuse');
    as(c, COMMUNITY, 'revealContext', 'plazaRegulars');
    as(c, COMMUNITY, 'revealContext', 'stationMemory');
    as(c, COMMUNITY, 'communityPass');
    as(c, DEPLOYER, 'deployerDone');
    as(c, COMMUNITY, 'passReaction');
    as(c, DEPLOYER, 'acknowledgeEvent');
    as(c, DEPLOYER, 'endRound', {});
    // round 2: accept — plaza −2, doubled by station memory (no sunset) → −4
    vendorChoose(c, 'accept');
    expect(G(c).utility).toBe(8); // 6 +1 ridership +1 upgrade
    expect(G(c).legitimacy).toBe(1); // 5 − 4 → floor → collapse
    expect(G(c).ending).toBe('collapse');
    expect(G(c).values.purposes).toContain('emotion');
  });

  it('vendorChoose rejects unknown options and unaffordable renegotiation', () => {
    const c = makeClient({ vendorDeck: [...DECKS.vendorDeck], eventDeck: [...DECKS.eventDeck] });
    vendorChoose(c, 'nonsense');
    expect(G(c).pending.vendor).toBe('referenceDiscount');
  });
});
