import type { Ctx } from 'boardgame.io';
import { TUNING as T } from '../tuning';
import type { GState } from '../state';
import type { Seat } from '../content/types';
import { COMMUNITY, DEPLOYER } from '../content/types';
import { actingSeat, legalMoves } from '../logic/selectors';

const PHASE_LABEL: Record<string, string> = {
  vendor: '1 · The Squeeze — vendor draws',
  negotiation: '2–3 · Questions & the Account',
  event: '4 · The World moves',
  upkeep: '5 · Consequences',
};

export const SEAT_NAME: Record<Seat, string> = {
  '0': 'Deployer · Metro Transit',
  '1': 'Community',
};
export const SEAT_CLASS: Record<Seat, string> = { '0': 'deployer', '1': 'community' };

function track(val: number, fillClass: string, label: string, who: string): string {
  let cells = '';
  for (let i = 1; i <= T.DIAL_MAX; i++) {
    let cls = 'cell10';
    if (i <= val) cls += ` ${fillClass}`;
    if (i === T.FLOOR) cls += ' floor';
    if (i === T.TRUSTED) cls += ' goal';
    cells += `<div class="${cls}"></div>`;
  }
  return `<div class="track">
    <div class="tl"><span>${label} <span style="font-weight:500">· ${who}</span></span><span class="val">${val} / ${T.DIAL_MAX}</span></div>
    <div class="cells">${cells}</div>
  </div>`;
}

export function header(G: GState, ctx: Ctx, viewSeat: Seat): string {
  const pips = Array.from({ length: T.ATTENTION_PER_ROUND },
    (_, i) => `<span class="pip ${i < G.perRound.attention ? 'full' : ''}"></span>`).join('');
  return `<header class="hdr"><div class="wrap" style="padding-bottom:0">
    <div class="hdr-row">
      <span class="eyebrow">Power Flow · Face Value</span>
      <span class="roundphase">Round <b>${G.round}</b> / ${T.ROUNDS} — <b>${PHASE_LABEL[ctx.phase ?? ''] ?? '—'}</b></span>
      <span class="hdr-spacer"></span>
      <div class="seatbtns">
        <button class="seatbtn ${viewSeat === DEPLOYER ? 'on-deployer' : ''}" data-ui="seat" data-arg="${DEPLOYER}">Deployer view</button>
        <button class="seatbtn ${viewSeat === COMMUNITY ? 'on-community' : ''}" data-ui="seat" data-arg="${COMMUNITY}">Community view</button>
      </div>
    </div>
    <div class="dials">
      ${track(G.utility, 'fill-u', 'Utility', 'deployer weights this')}
      ${track(G.legitimacy, 'fill-l', 'Legitimacy', 'community weights this')}
      <div class="resources">
        <span><span class="coin"></span> budget <b>${G.budget}</b></span>
        <span>${pips} attention</span>
        <span>backlash pool <b>${G.backlashPool.length}</b></span>
        ${G.modifiers.legitScale ? `<span style="color:var(--alarm);font-weight:600">legitimacy ×${G.modifiers.legitScale.factor}</span>` : ''}
        ${G.round <= G.modifiers.utilityFrozenUntilRound ? '<span style="color:var(--alarm);font-weight:600">utility frozen</span>' : ''}
      </div>
    </div>
  </div></header>`;
}

/** bottom bar rendered straight from legalMoves() */
export function actionBar(G: GState, ctx: Ctx, modalOpen: boolean): string {
  if (ctx.gameover || modalOpen) return '';
  const seat = actingSeat(ctx);
  const moves = legalMoves(G, ctx);
  if (!moves.length) return '';
  const btns = moves.map((m) => {
    const args = m.args ? ` data-args='${JSON.stringify(m.args)}'` : '';
    const cls = m.move === 'deflect' ? 'act danger'
      : (m.move === 'communityPass' || m.move === 'deployerDone' || m.move === 'endRound' || m.move === 'passReaction') ? 'act primary' : 'act';
    return `<button class="${cls}" data-move="${m.move}"${args} ${m.disabled ? `disabled title="${m.reason ?? ''}"` : ''}>` +
      `${m.label}${m.detail ? ` <span class="sub">· ${m.detail}</span>` : ''}</button>`;
  }).join('');
  return `<div class="actionbar"><div class="actionbar-inner">
    <span class="seat-cue ${SEAT_CLASS[seat]}">${SEAT_NAME[seat]} acts</span>${btns}
  </div></div>`;
}
