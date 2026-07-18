import type { GState } from '../state';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/** collapsible session log — the account, kept */
export function logDrawer(G: GState, open: boolean): string {
  const lines = [...G.log].reverse().map((l) =>
    `<div class="logline"><span class="src src-${l.source}">R${l.round} · ${l.source}</span> ${esc(l.text)}</div>`,
  ).join('');
  return `<div class="logwrap">
    <button class="logtoggle" data-ui="log">${open ? '▾' : '▸'} The account — session log (${G.log.length})</button>
    ${open ? `<div class="loglines">${lines}</div>` : ''}
  </div>`;
}
