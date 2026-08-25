/**
 * Pure layout math.
 *
 * The generated page is positioned absolutely rather than with Figma
 * auto-layout. Auto-layout wrapping depends on resize/sizing-mode
 * ordering that is awkward to get right without running in Figma;
 * absolute placement is deterministic, unit-testable here, and gives
 * the same visual result for a static generated artboard.
 */

/** Native size of a composed DTPR icon (`viewBox="0 0 36 36"`). */
export const ICON_SIZE = 36

export interface Box {
  width: number
  height: number
}

export interface Placement {
  x: number
  y: number
}

export interface FlowOptions {
  /** Wrap to a new row once a box would exceed this width. */
  maxWidth: number
  gapX: number
  gapY: number
}

export interface FlowResult {
  /** One placement per input box, in input order. */
  placements: Placement[]
  /** Bounding width of the packed rows (never exceeds the widest row). */
  width: number
  /** Bounding height of the packed rows. */
  height: number
}

/**
 * Left-to-right wrapping flow, top-aligned within each row.
 *
 * A box wider than `maxWidth` still gets placed — on a row of its own
 * — rather than being dropped or shrunk. Rows are as tall as their
 * tallest box, which matters here because component sets vary in
 * height with their variant count.
 */
export function flowWrap(boxes: readonly Box[], opts: FlowOptions): FlowResult {
  const { maxWidth, gapX, gapY } = opts
  const placements: Placement[] = []

  let cursorX = 0
  let rowTop = 0
  let rowHeight = 0
  let rowCount = 0
  let widest = 0

  for (const box of boxes) {
    const wrapsHere = rowCount > 0 && cursorX + box.width > maxWidth
    if (wrapsHere) {
      widest = Math.max(widest, cursorX - gapX)
      rowTop += rowHeight + gapY
      cursorX = 0
      rowHeight = 0
      rowCount = 0
    }

    placements.push({ x: cursorX, y: rowTop })
    cursorX += box.width + gapX
    rowHeight = Math.max(rowHeight, box.height)
    rowCount += 1
  }

  if (rowCount > 0) widest = Math.max(widest, cursorX - gapX)

  return {
    placements,
    width: Math.max(0, widest),
    height: rowCount > 0 || placements.length > 0 ? rowTop + rowHeight : 0,
  }
}
