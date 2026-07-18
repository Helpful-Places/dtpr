import { Client } from 'boardgame.io/client';
import type { Ctx } from 'boardgame.io';
import { createGame, type GameOpts } from '../src/game';
import type { GState } from '../src/state';
import { initialState } from '../src/state';
import { COMMUNITY, DEPLOYER, type Seat } from '../src/content/types';

export type TestClient = ReturnType<typeof makeClient>;

export function makeClient(opts: GameOpts = {}) {
  const client = Client({
    game: createGame({ seed: 'power-flow-test', ...opts }),
    numPlayers: 2,
    debug: false, // the debug panel touches document
  });
  client.start();
  return client;
}

export const G = (c: TestClient): GState => c.getState()!.G;
export const ctx = (c: TestClient): Ctx => c.getState()!.ctx;
export const gameover = (c: TestClient) => c.getState()!.ctx.gameover;

/** Dispatch a move as a given seat (the hot-seat pattern). */
export function as(c: TestClient, seat: Seat, move: string, ...args: unknown[]): void {
  c.updatePlayerID(seat);
  (c.moves as Record<string, (...a: unknown[]) => void>)[move](...args);
}

/** Pure G for resolver/dial tests — identity shuffle keeps content order. */
export const pureG = (): GState => initialState(<T,>(a: T[]) => a);

/* ---- phase drivers for scripted playthroughs ---- */

/** Answer the pending vendor card (defaults to its least eventful option). */
export function vendorChoose(c: TestClient, optionId: string): void {
  as(c, DEPLOYER, 'vendorChoose', optionId);
}

/** Community passes, deployer closes — an empty negotiation. */
export function skipNegotiation(c: TestClient): void {
  as(c, COMMUNITY, 'communityPass');
  as(c, DEPLOYER, 'deployerDone');
}

/** Ask a question and have the deployer answer it by flipping. */
export function askAndAnswer(c: TestClient, qid: string): void {
  as(c, COMMUNITY, 'askQuestion', qid);
  as(c, DEPLOYER, 'answerQuestion');
}

/** Ask a question and have the deployer respond with a redesign. */
export function askAndRedesign(c: TestClient, qid: string, rid: string): void {
  as(c, COMMUNITY, 'askQuestion', qid);
  as(c, DEPLOYER, 'playRedesign', rid);
}

/** Resolve the event phase: pass reaction (council-pick if asked), then ack. */
export function resolveEvent(c: TestClient, councilPick?: string): void {
  as(c, COMMUNITY, 'passReaction');
  if (gameover(c)) return;
  if (G(c).pending.event?.awaitingCouncilPick) {
    as(c, COMMUNITY, 'councilPick', councilPick ?? firstFacedown(c));
  }
  if (gameover(c)) return;
  as(c, DEPLOYER, 'acknowledgeEvent');
}

export function firstFacedown(c: TestClient): string {
  const g = G(c);
  return (Object.keys(g.system) as (keyof GState['system'])[]).find((id) => !g.system[id].faceup)! as string;
}

export function upkeep(c: TestClient, payHumanAtGate = true): void {
  as(c, DEPLOYER, 'endRound', { payHumanAtGate });
}
