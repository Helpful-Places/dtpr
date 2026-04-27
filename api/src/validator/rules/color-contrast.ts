import { contrastRatio, innerColorForShape, parseHex } from '../../icons/color.ts'
import type { SchemaVersionSource, SemanticError } from '../types.ts'
import { warn } from '../types.ts'

/**
 * Minimum WCAG AA contrast for normal text. We apply it conservatively
 * to every context-value color against the inner icon color the
 * compositor will pick.
 */
const AA_CONTRAST_MIN = 4.5

/**
 * `innerColorForShape` returns the short hex form (`#000` / `#FFF`) to
 * match the compositor's attribute output. `contrastRatio` requires the
 * full 6-digit form, so we expand here before computing.
 */
function expandShortHex(hex: '#000' | '#FFF'): '#000000' | '#FFFFFF' {
  return hex === '#000' ? '#000000' : '#FFFFFF'
}

/**
 * Warning rule: every non-null `ContextValue.color` must produce enough
 * contrast with the compositor's chosen inner color (`#000` or `#FFF`)
 * to meet WCAG AA (4.5:1). Rule 13 already rejects non-hex colors and
 * permits null (tag rendering); we skip both rather than double-reporting.
 *
 * In practice `innerColorForShape` picks the optimal inner color, so
 * the computed ratio will almost always clear 4.5:1 — this warning is
 * a defensive guard against future threshold tweaks and exotic colors
 * that land near the luminance boundary.
 */
export function checkColorContrast(source: SchemaVersionSource): SemanticError[] {
  const findings: SemanticError[] = []

  for (const [ci, cat] of source.categories.entries()) {
    if (!cat.context) continue
    for (const [vi, v] of cat.context.values.entries()) {
      if (v.color === null) continue
      if (!parseHex(v.color)) continue // Rule 13 reports this as an error.
      const innerShort = innerColorForShape(v.color)
      const innerFull = expandShortHex(innerShort)
      const ratio = contrastRatio(v.color, innerFull)
      if (Number.isFinite(ratio) && ratio < AA_CONTRAST_MIN) {
        findings.push(
          warn(
            'LOW_CONTRAST_CONTEXT_COLOR',
            `Context value '${v.id}' color ${v.color} has low contrast (${ratio.toFixed(2)}:1) against its composed inner color ${innerShort}`,
            {
              path: `categories[${ci}].context.values[${vi}].color`,
              fix_hint: `Choose a darker or lighter color so the 4.5:1 WCAG AA ratio is met against ${innerShort}. Current ratio ${ratio.toFixed(2)}:1 is below 4.5:1.`,
            },
          ),
        )
      }
    }
  }

  for (const [ei, el] of source.elements.entries()) {
    if (!el.context) continue
    for (const [vi, v] of el.context.values.entries()) {
      if (v.color === null) continue
      if (!parseHex(v.color)) continue
      const innerShort = innerColorForShape(v.color)
      const innerFull = expandShortHex(innerShort)
      const ratio = contrastRatio(v.color, innerFull)
      if (Number.isFinite(ratio) && ratio < AA_CONTRAST_MIN) {
        findings.push(
          warn(
            'LOW_CONTRAST_CONTEXT_COLOR',
            `Element '${el.id}' context value '${v.id}' color ${v.color} has low contrast (${ratio.toFixed(2)}:1) against its composed inner color ${innerShort}`,
            {
              path: `elements[${ei}].context.values[${vi}].color`,
              fix_hint: `Choose a darker or lighter color so the 4.5:1 WCAG AA ratio is met against ${innerShort}. Current ratio ${ratio.toFixed(2)}:1 is below 4.5:1.`,
            },
          ),
        )
      }
    }
  }

  return findings
}
