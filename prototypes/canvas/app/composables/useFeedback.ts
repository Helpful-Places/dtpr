import { ref, toValue, type MaybeRefOrGetter } from 'vue'
import { useRespondent } from '~/composables/useRespondent'

// Feedback submission + self-tag gating shared by the seat popover and the
// canvas clarity control. The reaction vocabulary here is the client mirror
// of the server's authoritative list (server/utils/db.ts validates).

export type Reaction = 'clear' | 'confusing' | 'unsure'
export const REACTIONS: Reaction[] = ['clear', 'confusing', 'unsure']

export interface CanvasCoords {
  system: string
  variant: string
  version: string
}

interface Pending {
  seat: string | null
  scope: 'seat' | 'canvas'
  reaction: Reaction
  note: string | null
}

export function useFeedback(coords: MaybeRefOrGetter<CanvasCoords>) {
  const respondent = useRespondent()
  const toast = useToast()
  const { t } = useI18n()

  const selfTagOpen = ref(false)
  const busy = ref(false)
  let pending: Pending | null = null

  async function post(p: Pending) {
    const c = toValue(coords)
    const r = respondent.forSubmit()
    if (!r) return
    busy.value = true
    try {
      await $fetch('/api/feedback', {
        method: 'POST',
        body: {
          system: c.system,
          variant: c.variant,
          version: c.version,
          seat: p.seat,
          scope: p.scope,
          reaction: p.reaction,
          note: p.note,
          respondent: r,
        },
      })
      toast.add({ title: t('feedback.sent'), color: 'success' })
    } catch {
      toast.add({ title: t('feedback.error'), color: 'error' })
    } finally {
      busy.value = false
    }
  }

  /** Record a reaction. If the respondent hasn't self-tagged yet, hold it
   *  and open the self-tag prompt first (R12); otherwise post immediately. */
  async function submit(
    reaction: Reaction,
    opts: { seat?: string | null, scope: 'seat' | 'canvas', note?: string | null },
  ) {
    const p: Pending = { seat: opts.seat ?? null, scope: opts.scope, reaction, note: opts.note ?? null }
    if (!respondent.tagged.value) {
      pending = p
      selfTagOpen.value = true
      return
    }
    await post(p)
  }

  /** Called after the self-tag modal completes — flush the held reaction. */
  async function onTagged() {
    selfTagOpen.value = false
    if (pending) {
      const p = pending
      pending = null
      await post(p)
    }
  }

  return { selfTagOpen, busy, submit, onTagged }
}
