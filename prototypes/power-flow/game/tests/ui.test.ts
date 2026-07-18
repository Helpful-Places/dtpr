// @vitest-environment happy-dom
/**
 * Full-round click-through of the real UI: mounts the hot-seat client and
 * drives a complete round (vendor modal → negotiation action bar → event
 * reaction + resolution stepper → upkeep) purely by clicking rendered buttons.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { Client } from 'boardgame.io/client';
import { createGame } from '../src/game';
import type { GState } from '../src/state';
import { mount } from '../src/ui/render';

function makeUi() {
  const client = Client({
    game: createGame({
      seed: 'ui-test',
      vendorDeck: ['referenceDiscount', 'proprietary', 'cloudOrDouble', 'emotionUpgrade', 'dataIsOurs'],
      eventDeck: ['falseMatch', 'ridership', 'twins', 'budgetCut', 'breach'],
    }),
    numPlayers: 2,
    debug: false,
  });
  client.start();
  const root = document.createElement('div');
  document.body.appendChild(root);
  mount(root, client);
  const G = () => client.getState()!.G as GState;
  const click = (selector: string) => {
    const el = root.querySelector<HTMLElement>(selector);
    if (!el) throw new Error(`no element for ${selector}\n${root.innerHTML.slice(0, 400)}`);
    el.click();
  };
  return { client, root, G, click };
}

describe('UI full round', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('plays a complete round through rendered buttons only', () => {
    const { client, root, G, click } = makeUi();

    // vendor modal is up: refuse the reference discount
    expect(root.innerHTML).toContain('Reference customer discount');
    click(`[data-move="vendorChoose"][data-args='["refuse"]']`);
    expect(client.getState()!.ctx.phase).toBe('negotiation');

    // community: reveal a context, ask a question from the action bar
    click(`[data-move="revealContext"][data-args='["nightShift"]']`);
    expect(G().contexts.nightShift.revealed).toBe(true);
    click(`[data-move="askQuestion"][data-args='["decidesAlone"]']`);
    expect(root.innerHTML).toContain('Deployer · Metro Transit acts');

    // deployer responds with a redesign (human at the gate)
    click(`[data-move="playRedesign"][data-args='["humanAtGate"]']`);
    expect(G().values.autonomy).toBe('human_executes');
    // the model card is now face-up and shows the struck-through swap
    expect(root.innerHTML).toContain('<s>Autonomous</s>');

    // community passes; deployer closes the window
    click('[data-move="communityPass"]');
    click('[data-move="deployerDone"]');
    expect(client.getState()!.ctx.phase).toBe('event');

    // event modal: false match — resolve, step through, acknowledge
    expect(root.innerHTML).toContain('False Match at Gate 7');
    click('[data-move="passReaction"]');
    expect(G().pending.event?.resolution).toBeTruthy();
    // handled branch (human at the gate): −1 then +1 back
    let guard = 20;
    while (root.querySelector('[data-ui="step"]') && guard--) click('[data-ui="step"]');
    click('[data-move="acknowledgeEvent"]');
    expect(client.getState()!.ctx.phase).toBe('upkeep');

    // upkeep: pay the human at the gate
    click('[data-move="endRound"]');
    expect(G().round).toBe(2);
    expect(G().budget).toBe(6); // 8 − 1 redesign − 1 upkeep
    expect(root.innerHTML).toContain('That’s proprietary'); // round 2 vendor modal is up
  });

  it('shows the ending screen with a rematch button at gameover', () => {
    const { root, G, click } = makeUi();
    click(`[data-move="vendorChoose"][data-args='["refuse"]']`);
    // stonewall twice → legitimacy 3 → collapse
    click(`[data-move="askQuestion"][data-args='["whoCanSee"]']`);
    click('[data-move="deflect"]');
    click(`[data-move="askQuestion"][data-args='["howLong"]']`);
    click('[data-move="deflect"]');
    expect(G().ending).toBe('collapse');
    expect(root.innerHTML).toContain('Collapse');
    expect(root.querySelector('[data-ui="rematch"]')).toBeTruthy();
  });
});
