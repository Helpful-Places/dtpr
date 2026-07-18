import type { Ctx } from 'boardgame.io';
import type { GState } from '../state';
import type { Seat, SystemCardId } from '../content/types';
import { COMMUNITY } from '../content/types';
import { CAT, SYSTEM_DEFS, SYSTEM_ORDER, VALUE_LABELS } from '../content/system';
import { CONTEXT_DEFS, CONTEXT_ORDER, REL_LABELS } from '../content/contexts';
import { FORUM_DEFS, FORUM_ORDER } from '../content/forums';
import { QUESTION_DEFS, QUESTION_ORDER } from '../content/questions';
import { REDESIGN_DEFS, REDESIGN_ORDER } from '../content/redesigns';
import { EVENT_DEFS } from '../content/events';
import { effectiveForumCost, effectiveRedesignCost } from '../logic/selectors';
import { FAM_COLOR, badge, ic, peopleIc } from './icons';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** the values the board started with — a changed value renders struck-through */
const INITIAL: Record<string, string> = {
  autonomy: 'autonomous', retention: 'years7', storage: 'vendorCloud',
  policeAccess: 'onRequest', outputLog: 'movementLog', enrollment: 'everyRider',
  dataOwner: 'vendor',
};

function valueChips(G: GState, id: SystemCardId): string {
  const keys = SYSTEM_DEFS[id].valueKeys ?? [];
  const chips = keys.map((k) => {
    if (k === 'purposes') {
      const extra = G.values.purposes.filter((p) => p !== 'farePayment');
      return `<span class="vchip">fare payment</span>` +
        extra.map((p) => `<span class="vchip creep">+ ${p === 'emotion' ? 'emotion detection' : esc(p)}</span>`).join('');
    }
    const cur = (G.values as unknown as Record<string, string>)[k];
    const labels = VALUE_LABELS[k];
    if (!labels) return '';
    if (INITIAL[k] && cur !== INITIAL[k]) {
      return `<span class="vchip"><s>${labels[INITIAL[k]]}</s><span class="to">${labels[cur]}</span></span>`;
    }
    return `<span class="vchip">${labels[cur]}</span>`;
  });
  return chips.length ? `<div class="vchips">${chips.join('')}</div>` : '';
}

function systemCell(G: GState, id: SystemCardId, viewSeat: Seat): string {
  const def = SYSTEM_DEFS[id];
  const st = G.system[id];
  const m = CAT[def.cat];
  const catRow = `<div class="cat">${badge(m.shape, FAM_COLOR[m.fam], 15)}${m.label}</div>`;

  if (st.faceup) {
    return `<div class="syscell">
      ${catRow}
      <div style="float:right;margin:-2px 0 4px 8px">${ic(def.icon, m.shape, m.fam, 36)}</div>
      <div class="nm">${def.nm}</div>
      <div class="ds">${esc(def.ds)}</div>
      ${valueChips(G, id)}
    </div>`;
  }

  const peeked = viewSeat === COMMUNITY && G.perRound.oversightPeeked === id;
  const deployerKnows = viewSeat !== COMMUNITY && !st.sealed;
  if ((deployerKnows || peeked) && !st.sealed) {
    return `<div class="syscell down known">
      ${catRow}
      <div class="nm">${def.nm}</div>
      <div class="ds">${esc(def.ds)}</div>
      <div class="peektag">${peeked ? 'inspected privately — oversight' : 'face-down · only you can see this'}</div>
    </div>`;
  }
  return `<div class="syscell down">
    ${catRow}
    <div class="fd">${st.sealed ? 'Sealed' : 'Face down'}</div>
    <div class="hint">${st.sealed ? 'Neither player may look. Opened by Audit or an Event.' : 'Ask about it — flipping is an Answer.'}</div>
    ${st.sealed ? '<div class="wax">✕</div>' : ''}
  </div>`;
}

function redesignHand(G: GState): string {
  const chips = REDESIGN_ORDER.map((rid) => {
    const st = G.redesigns[rid];
    const def = REDESIGN_DEFS[rid];
    const cost = effectiveRedesignCost(G, rid);
    if (st === 'hand') {
      return `<span class="handchip">${def.nm} <span class="cost">· ${cost}${def.recurring ? '/rd' : ''}</span></span>`;
    }
    return `<span class="handchip spent" title="${st}">${def.nm}</span>`;
  });
  return `<div class="handrow"><span class="handlabel">Redesign hand — plays as a question response</span>${chips.join('')}</div>`;
}

function questionHand(G: GState): string {
  const chips = QUESTION_ORDER.map((qid) => {
    const st = G.questions[qid];
    const q = QUESTION_DEFS[qid];
    return st === 'hand'
      ? `<span class="handchip">${esc(q.q)}</span>`
      : `<span class="handchip spent" title="${st}">${esc(q.q)}</span>`;
  });
  return `<div class="handrow"><span class="handlabel">Question hand — 1 attention each</span>${chips.join('')}</div>`;
}

export function deployerMat(G: GState, viewSeat: Seat): string {
  const facedown = SYSTEM_ORDER.filter((id) => !G.system[id].faceup).length;
  return `<section class="mat">
    <div class="mat-head">
      <span class="zl deployer">Deployer’s hand · Metro Transit — the system cards</span>
      <span class="note">${facedown} face-down — every flip is an Answer</span>
    </div>
    <div class="sysgrid">${SYSTEM_ORDER.map((id) => systemCell(G, id, viewSeat)).join('')}</div>
    ${viewSeat !== COMMUNITY ? redesignHand(G) : ''}
  </section>`;
}

export function tableStrip(G: GState, viewSeat: Seat): string {
  const seated = FORUM_ORDER.filter((f) => G.forums[f].status === 'seated');
  const proposed = FORUM_ORDER.filter((f) => G.forums[f].status === 'proposed');
  let inner: string;
  if (!seated.length && !proposed.length) {
    inner = `<div class="zerosum">◇ The table is empty — the game is zero-sum. Shared endings locked; every Deflect seeds <b>&nbsp;two&nbsp;</b> Backlash.</div>`;
  } else {
    inner = `<div class="plates">${
      seated.map((f) => `<span class="plate seated">${FORUM_DEFS[f].nm} <span class="sub">seated</span></span>`).join('')
    }${
      proposed.map((f) => `<span class="plate proposed">${FORUM_DEFS[f].nm} <span class="cost">fund: ${effectiveForumCost(G, f)}</span></span>`).join('')
    }</div>`;
    if (!seated.length) {
      inner += `<div class="noticepeek" style="color:var(--signal)">Proposed but unfunded — the endings stay locked until the deployer pays.</div>`;
    }
  }
  let peek = '';
  if (G.forums.notice.status === 'seated' && viewSeat === COMMUNITY && G.eventDeck.length && !G.pending.event) {
    const top = EVENT_DEFS[G.eventDeck[0]];
    peek = `<div class="noticepeek">Notice at the Gate — next event: <b>${top.nm}</b>${top.isBacklash ? ' (Backlash)' : ''}</div>`;
  }
  return `<section class="tablestrip">
    <div class="zl">The table · forum cards in play — each one an accountable_to edge</div>
    ${inner}${peek}
  </section>`;
}

function contextCard(G: GState, id: (typeof CONTEXT_ORDER)[number], viewSeat: Seat): string {
  const def = CONTEXT_DEFS[id];
  const revealed = G.contexts[id].revealed;
  if (!revealed && viewSeat !== COMMUNITY) {
    return `<div class="ctxcard hidden-back">${peopleIc(22)} Context — hidden until revealed</div>`;
  }
  return `<div class="ctxcard ${revealed ? 'revealed' : ''}">
    <div class="nm">${peopleIc(20)} ${def.nm}${revealed ? '' : ' <span style="font-weight:500;color:var(--muted);font-size:.68rem">(in hand)</span>'}</div>
    <div class="ds">${esc(def.ds)}</div>
    <div class="fx">${esc(def.fx)}</div>
    <div class="rel-tag"><span style="opacity:.65;font-family:var(--mono);font-size:.58em">${def.rel}</span> ${REL_LABELS[def.rel]}</div>
  </div>`;
}

export function communityMat(G: GState, viewSeat: Seat): string {
  return `<section class="mat community">
    <div class="mat-head">
      <span class="zl">Community’s hand — the context cards · the affected seat</span>
      <span class="note">hidden from the deployer until revealed</span>
    </div>
    <div class="ctxgrid">${CONTEXT_ORDER.map((id) => contextCard(G, id, viewSeat)).join('')}</div>
    ${viewSeat === COMMUNITY ? questionHand(G) : ''}
  </section>`;
}

export function board(G: GState, _ctx: Ctx, viewSeat: Seat): string {
  return deployerMat(G, viewSeat) + tableStrip(G, viewSeat) + communityMat(G, viewSeat);
}
