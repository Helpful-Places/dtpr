/**
 * Day-1 spike: prove the hot-seat pattern before building on it.
 * - one transportless Client, updatePlayerID() before each dispatch
 * - stage moves are exclusive: a seat absent from activePlayers cannot move
 * - INVALID_MOVE leaves state untouched
 * - events.setActivePlayers({value}) replaces the whole map
 */
import { describe, expect, it } from 'vitest';
import { Client } from 'boardgame.io/client';
import { INVALID_MOVE, TurnOrder } from 'boardgame.io/core';
import type { Game } from 'boardgame.io';

interface SpikeG { n: number; handed: boolean }

const SpikeGame: Game<SpikeG> = {
  setup: () => ({ n: 0, handed: false }),
  phases: {
    main: {
      start: true,
      turn: {
        order: TurnOrder.CUSTOM(['1']),
        activePlayers: { value: { '1': 'act' } },
        stages: {
          act: {
            moves: {
              bump: ({ G }, amount: number) => {
                if (amount > 3) return INVALID_MOVE;
                G.n += amount;
              },
              handOff: ({ G, events }) => {
                G.handed = true;
                events.setActivePlayers({ value: { '0': 'respond' } });
              },
            },
          },
          respond: {
            moves: { ack: ({ G }) => { G.n += 100; } },
          },
        },
      },
    },
  },
};

function makeClient() {
  const client = Client({ game: SpikeGame, numPlayers: 2, debug: false });
  client.start();
  return client;
}

describe('hot-seat spike', () => {
  it('single client switches seats via updatePlayerID', () => {
    const client = makeClient();
    client.updatePlayerID('1');
    client.moves.bump(2);
    expect(client.getState()!.G.n).toBe(2);

    client.moves.handOff();
    expect(client.getState()!.ctx.activePlayers).toEqual({ '0': 'respond' });

    client.updatePlayerID('0');
    client.moves.ack();
    expect(client.getState()!.G.n).toBe(102);
  });

  it('a seat absent from activePlayers cannot move', () => {
    const client = makeClient();
    client.updatePlayerID('0'); // only '1' is active in stage act
    client.moves.bump(1);
    expect(client.getState()!.G.n).toBe(0);
  });

  it('INVALID_MOVE leaves state untouched', () => {
    const client = makeClient();
    client.updatePlayerID('1');
    client.moves.bump(99);
    expect(client.getState()!.G.n).toBe(0);
    client.moves.bump(3);
    expect(client.getState()!.G.n).toBe(3);
  });

  it('setActivePlayers replaces the whole map (old seat locked out)', () => {
    const client = makeClient();
    client.updatePlayerID('1');
    client.moves.handOff();
    client.moves.bump(1); // community no longer active
    expect(client.getState()!.G.n).toBe(0);
  });
});
