// Rights / escalation action links (ported from v6, localized). Shared by
// the canvas board (`CanvasBoard`) and the compare matrix (`CanvasMatrix`)
// so both compose the same mailto / tel / url hrefs from a system's content.

import { tr, type Loc, type RightAction, type SystemContent } from '~/canvas-data'

/** Pre-filled body for an `email` action, addressed on the rider's behalf. */
export function mailBody(sy: SystemContent, right: string, loc: Loc): string {
  const name = tr(sy.name, loc)
  const runby = tr(sy.runby.name, loc)
  return loc === 'fr'
    ? `Madame, Monsieur,\n\nJe fais valoir mon « ${right} » au titre de la divulgation DTPR pour :\n\n  Système : ${name} (réf ${sy.ref})\n  Exploité par : ${runby}\n\nDétails de ma demande :\n\n`
    : `To whom it may concern,\n\nI am exercising my "${right}" under the DTPR disclosure for:\n\n  System: ${name} (ref ${sy.ref})\n  Operated by: ${runby}\n\nDetails of my request:\n\n`
}

/** Resolve an action to its href: mailto (with subject + body), tel, or a
 *  plain url/form target. */
export function actHref(a: RightAction, sy: SystemContent, right: string, loc: Loc): string {
  if (a.type === 'email') {
    return `mailto:${a.target}?subject=${encodeURIComponent(`[${sy.ref}] ${right} — ${tr(sy.name, loc)}`)}&body=${encodeURIComponent(mailBody(sy, right, loc))}`
  }
  if (a.type === 'phone') return `tel:${a.target}`
  return a.target
}

/** Actions that open a new tab (url / form) rather than a mail/phone client. */
export const externalAct = (a: RightAction): boolean => a.type === 'url' || a.type === 'form'
