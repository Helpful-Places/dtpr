import type { CanvasSystem, CanvasVariant, ResolvedCanvas } from './types'
import { faceGates } from './systems/face-gates'
import { benefitsScoring } from './systems/benefits-scoring'
import { peopleCounting } from './systems/people-counting'
import { patrolAllocation } from './systems/patrol-allocation'

/** The register: the four v6 systems as versioned in-repo canvas data. */
export const SYSTEMS: CanvasSystem[] = [faceGates, benefitsScoring, peopleCounting, patrolAllocation]

export function listSystems(): CanvasSystem[] {
  return SYSTEMS
}

export function getSystem(systemKey: string): CanvasSystem | undefined {
  return SYSTEMS.find(s => s.systemKey === systemKey)
}

/** The current (newest) version of a variant. */
export function currentVersion(variant: CanvasVariant) {
  return variant.versions[variant.versions.length - 1]
}

/** The variant to show by default for a system: the first live one, else
 *  the first variant (compare still sees paused variants — R16). */
export function defaultVariant(system: CanvasSystem): CanvasVariant | undefined {
  return system.variants.find(v => v.live) ?? system.variants[0]
}

/**
 * Resolve `(system, variant?, version?)` coordinates to a canvas.
 * Omitting the variant falls back to the default (live) variant; omitting
 * the version falls back to that variant's current version. Returns `null`
 * for unknown keys (drives the canvas page's 404 — R15 / U7).
 */
export function resolveCanvas(
  systemKey: string,
  variantKey?: string,
  versionKey?: string,
): ResolvedCanvas | null {
  const system = getSystem(systemKey)
  if (!system) return null

  const variant = variantKey
    ? system.variants.find(v => v.variantKey === variantKey)
    : defaultVariant(system)
  if (!variant) return null

  const version = versionKey
    ? variant.versions.find(v => v.versionKey === versionKey)
    : currentVersion(variant)
  if (!version) return null

  return {
    systemKey: system.systemKey,
    variantKey: variant.variantKey,
    versionKey: version.versionKey,
    live: variant.live,
    variantLabel: variant.label,
    content: version.content,
  }
}

/** One entry per live variant, resolved to its current version — the
 *  register surfaces only these (R16). */
export function liveCanvases(): ResolvedCanvas[] {
  const out: ResolvedCanvas[] = []
  for (const system of SYSTEMS) {
    for (const variant of system.variants) {
      if (!variant.live) continue
      const version = currentVersion(variant)
      out.push({
        systemKey: system.systemKey,
        variantKey: variant.variantKey,
        versionKey: version.versionKey,
        live: true,
        variantLabel: variant.label,
        content: version.content,
      })
    }
  }
  return out
}

export * from './types'
export * from './loc'
