import type { Ctx } from 'boardgame.io';
import { TUNING as T } from '../tuning';
import type { GState } from '../state';
import type { EndingId, ResolvedLine, SystemCardId } from '../content/types';
import { SYSTEM_DEFS, SYSTEM_ORDER, CAT } from '../content/system';
import { CONTEXT_DEFS } from '../content/contexts';
import { VENDOR_DEFS } from '../content/vendors';
import { EVENT_DEFS } from '../content/events';
import { ENDING_INFO, type GameoverPayload } from '../logic/endings';
import { effectiveRedesignCost } from '../logic/selectors';
import { FAM_COLOR, badge } from './icons';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export interface UiState {
  step: number; // resolution stepper progress
  resolutionKey: string | null; // which resolution the step belongs to
}

function vendorOptionCost(G: GState, vendorId: string, optionId: string): number | null {
  if (vendorId === 'dataIsOurs' && optionId === 'renegotiate') {
    return effectiveRedesignCost(G, 'renegotiate') + T.RENEGOTIATE_NOW_SURCHARGE;
  }
  return null;
}

function vendorModal(G: GState): string {
  const def = VENDOR_DEFS[G.pending.vendor!];
  const opts = def.options.map((o) => {
    const cost = vendorOptionCost(G, def.id, o.id);
    const disabled = cost !== null && G.budget < cost;
    return `<button class="choice" data-move="vendorChoose" data-args='${JSON.stringify([o.id])}' ${disabled ? 'disabled' : ''}>
      <b>${o.label}${cost !== null ? ` — ${cost} budget` : ''}</b><span>${esc(o.detail)}${disabled ? ' (not enough budget)' : ''}</span>
    </button>`;
  }).join('');
  return `<div class="modal">
    <div class="mk vendor">FaceGate Inc. · the vendor squeezes — deployer decides</div>
    <h2>${def.nm}</h2>
    <p class="ds">${esc(def.ds)}</p>
    <p class="ds" style="border-top:1px dashed var(--line);padding-top:9px">${esc(def.choice)}</p>
    ${opts}
  </div>`;
}

function reactionModal(G: GState): string {
  const ev = G.pending.event!;
  const def = EVENT_DEFS[ev.id];
  const reveals = ev.eligibleReveals.map((cid) => `
    <button class="choice" data-move="reactionReveal" data-args='${JSON.stringify([cid])}'>
      <b>Reveal: ${CONTEXT_DEFS[cid].nm} (free)</b><span>${esc(CONTEXT_DEFS[cid].fx)}</span>
    </button>`).join('');
  return `<div class="modal">
    <div class="mk event">${def.isBacklash ? `Backlash · seeded by ${def.seed}` : 'Event · the world moves'} — community reacts</div>
    <h2>${def.nm}</h2>
    ${reveals.length ? `<p class="ds">Unrevealed context keys this event. Reveal before it resolves — the board is judged as it stands.</p>${reveals}` : '<p class="ds">No hidden context keys this one.</p>'}
    <div class="mfoot"><button class="act primary" data-move="passReaction">Resolve the event</button></div>
  </div>`;
}

function councilModal(G: GState): string {
  const picks = SYSTEM_ORDER.filter((id) => !G.system[id].faceup).map((id) => {
    const d = SYSTEM_DEFS[id];
    const m = CAT[d.cat];
    return `<button class="choice" data-move="councilPick" data-args='${JSON.stringify([id])}'>
      <b>${badge(m.shape, FAM_COLOR[m.fam], 14)} ${m.label}${G.system[id].sealed ? ' · sealed' : ''}</b>
      <span>${G.system[id].sealed ? 'The subpoena breaks the seal. In public.' : 'Force it face-up. In public.'}</span>
    </button>`;
  }).join('');
  return `<div class="modal">
    <div class="mk event">Backlash · The Council Hearing — community picks</div>
    <h2>Subpoena the deck</h2>
    <p class="ds">The deployer flips one face-down card of the community’s choice.</p>
    <div class="picker">${picks}</div>
  </div>`;
}

function deltaChips(l: ResolvedLine): string {
  const chips: string[] = [];
  const a = l.applied;
  if (a) {
    if (a.legitimacy) chips.push(`<span class="dchip ${a.legitimacy < 0 ? 'neg' : 'pos'}">Legitimacy ${a.legitimacy > 0 ? '+' : ''}${a.legitimacy}</span>`);
    if (a.utility) chips.push(`<span class="dchip ${a.utility < 0 ? 'neg' : 'pos'}">Utility ${a.utility > 0 ? '+' : ''}${a.utility}</span>`);
    if (a.budget) chips.push(`<span class="dchip ${a.budget < 0 ? 'neg' : 'pos'}">Budget ${a.budget > 0 ? '+' : ''}${a.budget}</span>`);
  }
  const d = l.deltas;
  if (d?.seedBacklash) chips.push(`<span class="dchip neg">+${d.seedBacklash} Backlash seeded</span>`);
  if (d?.flipCard) chips.push(`<span class="dchip info">${SYSTEM_DEFS[d.flipCard as SystemCardId].nm} flips</span>`);
  if (d?.freezeUtility) chips.push('<span class="dchip neg">Utility frozen</span>');
  if (d?.legitScale) chips.push(`<span class="dchip info">Legitimacy ×${d.legitScale.factor}</span>`);
  if (d?.surfaceProtest) chips.push('<span class="dchip info">−3 pinned — the FOIA surfaces it</span>');
  if (l.absorbedBy?.length) chips.push(`<span class="absorb">absorbed by ${l.absorbedBy.join(' + ')}</span>`);
  return chips.length ? `<div class="chips">${chips.join('')}</div>` : '';
}

function resolutionModal(G: GState, ui: UiState): string {
  const ev = G.pending.event!;
  const def = EVENT_DEFS[ev.id];
  const lines = ev.resolution!;
  const shown = Math.min(ui.step + 1, lines.length);
  const before = ev.dialsBefore!;
  // dial readout replays line by line from the snapshot
  let u = before.utility, l = before.legitimacy, b = before.budget;
  for (let i = 0; i < shown; i++) {
    const a = lines[i].applied;
    if (lines[i].fired && a) { u += a.utility; l += a.legitimacy; b += a.budget; }
  }
  const rows = lines.slice(0, shown).map((ln) => {
    const kind = !ln.fired ? 'mut'
      : (ln.applied && (ln.applied.legitimacy < 0 || ln.applied.utility < 0 || ln.applied.budget < 0)) || ln.deltas?.seedBacklash ? 'hit'
      : (ln.applied && (ln.applied.legitimacy > 0 || ln.applied.utility > 0)) ? 'gain' : '';
    return `<div class="resline ${kind}">
      <span class="cond">${esc(ln.cond)}</span> <span class="txt">${esc(ln.text)}</span>
      ${ln.fired ? deltaChips(ln) : ''}
    </div>`;
  }).join('');
  const done = shown >= lines.length;
  return `<div class="modal">
    <div class="mk event">${def.isBacklash ? `Backlash · seeded by ${def.seed}` : 'Event'} — resolving against the board</div>
    <h2>${def.nm}</h2>
    <div class="stepdials">
      <span>Utility <b>${before.utility}</b> → <b>${u}</b></span>
      <span>Legitimacy <b>${before.legitimacy}</b> → <b>${l}</b></span>
      <span>Budget <b>${before.budget}</b> → <b>${b}</b></span>
    </div>
    ${rows}
    <div class="mfoot">${done
      ? '<button class="act primary" data-move="acknowledgeEvent">Acknowledge — deployer</button>'
      : '<button class="act primary" data-ui="step">Next ›</button>'}</div>
  </div>`;
}

function endingModal(G: GState, payload: GameoverPayload): string {
  const info = ENDING_INFO[payload.ending as EndingId];
  return `<div class="modal ending">
    <span class="end-kind ${info.kind}">${info.kind === 'win' ? 'Shared win' : info.kind === 'solo' ? 'Someone wins' : 'Everyone loses'}</span>
    <h2>${info.title}</h2>
    <p class="ds">${esc(info.blurb)}</p>
    <div class="endstats">
      <span class="k">Utility</span><span class="v">${payload.utility} / 10</span>
      <span class="k">Legitimacy</span><span class="v">${payload.legitimacy} / 10</span>
      <span class="k">Redesigns applied</span><span class="v">${payload.redesignsApplied}</span>
      <span class="k">Backlash still in the deck</span><span class="v">${payload.backlashLeft}</span>
      ${payload.deployerScore !== null
        ? `<span class="k">Deployer score (utility − backlash left)</span><span class="v">${payload.deployerScore}</span>` : ''}
      <span class="k">Budget left on the table</span><span class="v">${G.budget}</span>
    </div>
    <div class="mfoot"><button class="act primary" data-ui="rematch">Rematch</button></div>
  </div>`;
}

export function resolutionKey(G: GState): string | null {
  return G.pending.event?.resolution ? `${G.round}:${G.pending.event.id}` : null;
}

export function modal(G: GState, ctx: Ctx, ui: UiState): string {
  let inner = '';
  if (ctx.gameover) inner = endingModal(G, ctx.gameover as GameoverPayload);
  else if (ctx.phase === 'vendor' && G.pending.vendor) inner = vendorModal(G);
  else if (ctx.phase === 'event' && G.pending.event) {
    const ev = G.pending.event;
    if (ev.resolution) inner = resolutionModal(G, ui);
    else if (ev.awaitingCouncilPick) inner = councilModal(G);
    else inner = reactionModal(G);
  }
  return inner ? `<div class="overlay">${inner}</div>` : '';
}
