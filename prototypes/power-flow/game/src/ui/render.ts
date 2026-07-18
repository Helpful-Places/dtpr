/**
 * Hot-seat render loop: full innerHTML re-render on every state change, one
 * delegated click listener reading data-move / data-args / data-ui. Local UI
 * state (view seat, modal step, log drawer) lives here, never in G.
 */
import type { Ctx } from 'boardgame.io';
import type { _ClientImpl } from 'boardgame.io/dist/types/src/client/client';
import type { GState } from '../state';
import type { Seat } from '../content/types';
import { COMMUNITY } from '../content/types';
import { actingSeat } from '../logic/selectors';
import { board } from './board';
import { actionBar, header } from './panels';
import { logDrawer } from './log';
import { modal, resolutionKey, type UiState } from './modal';
import { installIconFallback } from './icons';

type PowerClient = _ClientImpl<GState>;

interface LocalUi extends UiState {
  viewSeat: Seat | null; // null = follow the acting seat
  logOpen: boolean;
}

export function mount(root: HTMLElement, client: PowerClient): void {
  const ui: LocalUi = { viewSeat: null, logOpen: false, step: 0, resolutionKey: null };
  installIconFallback();

  function render(): void {
    const state = client.getState();
    if (!state) return;
    const G = state.G as GState;
    const ctx = state.ctx as Ctx;

    // keep the client's playerID pinned to whoever must act (the hot-seat pattern)
    const seat = actingSeat(ctx);
    if (client.playerID !== seat) client.updatePlayerID(seat);

    // a new resolution resets the stepper
    const rk = resolutionKey(G);
    if (rk !== ui.resolutionKey) { ui.resolutionKey = rk; ui.step = 0; }

    const viewSeat = ui.viewSeat ?? seat;
    const modalHtml = modal(G, ctx, ui);
    root.innerHTML = `
      ${header(G, ctx, viewSeat)}
      <main class="wrap">
        ${board(G, ctx, viewSeat)}
        ${logDrawer(G, ui.logOpen)}
        <footer style="font-size:.72rem;color:var(--muted);max-width:72ch;padding-bottom:8px">
          Hot-seat prototype — visibility is an honor system: pass the laptop with the seat toggle.
          End of a session, the system cards are a datachain; the seated forum cards are its edges.
        </footer>
      </main>
      ${actionBar(G, ctx, !!modalHtml)}
      ${modalHtml}
    `;
  }

  root.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-move],[data-ui]');
    if (!btn || (btn as HTMLButtonElement).disabled) return;

    const uiAction = btn.dataset.ui;
    if (uiAction === 'seat') { ui.viewSeat = btn.dataset.arg as Seat; render(); return; }
    if (uiAction === 'log') { ui.logOpen = !ui.logOpen; render(); return; }
    if (uiAction === 'step') { ui.step += 1; render(); return; }
    if (uiAction === 'rematch') { window.location.reload(); return; }

    const move = btn.dataset.move;
    if (!move) return;
    const args = btn.dataset.args ? (JSON.parse(btn.dataset.args) as unknown[]) : [];
    ui.viewSeat = null; // moves hand the camera back to whoever acts next
    (client.moves as Record<string, (...a: unknown[]) => void>)[move](...args);
  });

  client.subscribe(() => render());
  render();
}
