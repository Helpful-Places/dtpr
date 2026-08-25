/**
 * Plugin sandbox entry point.
 *
 * Owns everything that touches the Figma document. Does no network
 * work of its own — the UI iframe fetches from api.dtpr.io and streams
 * icons across in batches (see `messages.ts` for why the split exists).
 */

import { ICON_SIZE, flowWrap, type Box } from './layout.ts'
import { localized, type Category } from './api.ts'
import { planVariants } from './variants.ts'
import type { CodeToUi, ElementMeta, GenerateSettings, UiToCode } from './messages.ts'

const SETTINGS_KEY = 'dtpr.generate-settings'

const CONTENT_WIDTH = 1440
const PAGE_PADDING = 80
const SECTION_GAP = 96
const TITLE_SIZE = 28
const DESC_SIZE = 14
const TITLE_TO_DESC = 10
const HEADER_TO_GRID = 28
const GRID_GAP_X = 40
const GRID_GAP_Y = 40
const LABEL_WIDTH = 104
const LABEL_GAP = 10
const LABEL_SIZE = 11

/** Yield to the event loop every N elements so the UI can repaint. */
const YIELD_EVERY = 20

interface Fonts {
  regular: FontName
  bold: FontName
}

interface BuildState {
  settings: GenerateSettings
  contentHash: string
  categories: Category[]
  /** Canonical element order, fixed by the UI before any icon arrives. */
  elements: ElementMeta[]
  /** elementId -> (variant token -> SVG). Filled by out-of-order batches. */
  svgs: Map<string, Map<string, string>>
}

let state: BuildState | null = null

/**
 * Set by a `build-cancel` while `build()` is running. The build reads it
 * at its yield points, so cancellation lands between elements rather
 * than halfway through a component set.
 */
let cancelRequested = false

/** Status text for a user-cancelled build; matches the fetch phase. */
const CANCELLED_MESSAGE = 'Cancelled.'

figma.showUI(__html__, { width: 400, height: 560, themeColors: true })

function post(message: CodeToUi): void {
  figma.ui.postMessage(message)
}

figma.ui.onmessage = async (message: UiToCode) => {
  try {
    switch (message.type) {
      case 'ui-ready': {
        const saved = await figma.clientStorage.getAsync(SETTINGS_KEY)
        post({ type: 'code-ready', settings: (saved as GenerateSettings) ?? null })
        break
      }
      case 'save-settings':
        await figma.clientStorage.setAsync(SETTINGS_KEY, message.settings)
        break
      case 'build-start':
        cancelRequested = false
        state = {
          settings: message.settings,
          contentHash: message.contentHash,
          categories: message.categories,
          elements: message.elements,
          svgs: new Map(),
        }
        break
      case 'build-batch': {
        if (!state) break
        for (const icon of message.icons) {
          let bucket = state.svgs.get(icon.elementId)
          if (!bucket) {
            bucket = new Map()
            state.svgs.set(icon.elementId, bucket)
          }
          bucket.set(icon.variantToken, icon.svg)
        }
        break
      }
      case 'build-end':
        if (!state) break
        await build(state)
        state = null
        break
      case 'build-cancel':
        // Only meaningful mid-`build()`; the flag is read at its yield
        // points. Before `build-end` the UI stops on its own.
        cancelRequested = true
        break
      case 'build-abort':
        state = null
        post({ type: 'build-failed', message: message.message })
        break
      case 'close':
        figma.closePlugin()
        break
    }
  } catch (error) {
    state = null
    post({ type: 'build-failed', message: describeError(error) })
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

async function loadFonts(): Promise<Fonts> {
  const regular: FontName = { family: 'Inter', style: 'Regular' }
  await figma.loadFontAsync(regular)
  const bold: FontName = { family: 'Inter', style: 'Semi Bold' }
  try {
    await figma.loadFontAsync(bold)
    return { regular, bold }
  } catch {
    // Inter ships with Figma, but a document forced into a restricted
    // font set can still miss the weight. Headings just lose their bold.
    return { regular, bold: regular }
  }
}

async function focusPage(page: PageNode): Promise<void> {
  // `documentAccess: "dynamic-page"` in the manifest makes the
  // synchronous `figma.currentPage =` setter throw, but keep the
  // fallback so the plugin still works if that flag is ever dropped.
  if (typeof figma.setCurrentPageAsync === 'function') {
    await figma.setCurrentPageAsync(page)
  } else {
    figma.currentPage = page
  }
}

function makeText(
  characters: string,
  font: FontName,
  size: number,
  opts: { width?: number; center?: boolean } = {},
): TextNode {
  const node = figma.createText()
  node.fontName = font
  node.fontSize = size
  node.characters = characters
  if (opts.width !== undefined) {
    node.textAutoResize = 'HEIGHT'
    node.resizeWithoutConstraints(opts.width, node.height)
  } else {
    node.textAutoResize = 'WIDTH_AND_HEIGHT'
  }
  if (opts.center) node.textAlignHorizontal = 'CENTER'
  return node
}

/**
 * Turn one composed SVG into a component sized to the icon's native
 * 36×36 box. The API emits `<path>` (the category shape) followed by
 * `<g>` (the element symbol), so the two children get named to match —
 * that is what a designer sees when they expand the layer.
 */
function componentFromSvg(svg: string, name: string): ComponentNode {
  const svgFrame = figma.createNodeFromSvg(svg)
  svgFrame.name = 'icon'
  const kids = svgFrame.children
  if (kids[0]) kids[0].name = 'shape'
  if (kids[1]) kids[1].name = 'symbol'

  const component = figma.createComponent()
  component.name = name
  component.resizeWithoutConstraints(ICON_SIZE, ICON_SIZE)
  component.fills = []
  component.appendChild(svgFrame)
  svgFrame.x = 0
  svgFrame.y = 0
  return component
}

/**
 * Build one element's Figma node: a plain component when it has a
 * single icon, a multi-property component set otherwise.
 */
function buildElementNode(
  meta: ElementMeta,
  svgs: ReadonlyMap<string, string>,
  parent: FrameNode,
  setName: string,
): { node: ComponentNode | ComponentSetNode; components: number } | null {
  // Plan against the tokens that actually arrived, not the ones that
  // were requested — a single failed icon fetch should cost that one
  // variant, not the whole element.
  const present = meta.variantTokens.filter((token) => svgs.has(token))
  const plan = planVariants(present)
  if (plan.length === 0) return null

  const components: ComponentNode[] = []
  for (const entry of plan) {
    const svg = svgs.get(entry.token)
    if (!svg) continue
    components.push(componentFromSvg(svg, entry.name))
  }
  if (components.length === 0) return null

  if (components.length === 1) {
    const only = components[0] as ComponentNode
    only.name = setName
    parent.appendChild(only)
    return { node: only, components: 1 }
  }

  const set = figma.combineAsVariants(components, parent)
  set.name = setName
  return { node: set, components: components.length }
}

function boxFor(node: SceneNode, label: TextNode | null): Box {
  if (!label) return { width: node.width, height: node.height }
  return {
    width: Math.max(node.width, label.width),
    height: node.height + LABEL_GAP + label.height,
  }
}

async function build(current: BuildState): Promise<void> {
  const fonts = await loadFonts()

  const previousPage = figma.currentPage
  const page = figma.createPage()
  page.name = `DTPR Icons — ${current.settings.version}`
  await focusPage(page)

  try {
    await buildInto(page, current, fonts)
  } catch (error) {
    // Half a library is worse than none: it looks complete enough to
    // publish, and a retry would add a second page beside it rather
    // than replacing this one. Drop it and let the error propagate.
    try {
      await focusPage(previousPage)
      page.remove()
    } catch (cleanupError) {
      console.warn('DTPR: could not remove the partial page', cleanupError)
    }
    throw error
  }
}

async function buildInto(
  page: PageNode,
  current: BuildState,
  fonts: Fonts,
): Promise<void> {
  const { settings, categories, contentHash } = current
  const ordered = categories.slice().sort((a, b) => a.order - b.order)
  let cursorY = PAGE_PADDING
  let componentCount = 0
  let setCount = 0
  let processed = 0

  for (const category of ordered) {
    const members = current.elements.filter(
      (element) => element.categoryId === category.id && current.svgs.has(element.id),
    )
    if (members.length === 0) continue

    const section = figma.createFrame()
    section.name = category.id
    section.fills = []
    section.clipsContent = false
    section.x = PAGE_PADDING
    section.y = cursorY
    page.appendChild(section)

    const title = makeText(
      localized(category.name, settings.locale) || category.id,
      fonts.bold,
      TITLE_SIZE,
    )
    section.appendChild(title)
    title.x = 0
    title.y = 0

    let headerBottom = title.height
    const descriptionText = localized(category.description, settings.locale)
    if (descriptionText) {
      const description = makeText(descriptionText, fonts.regular, DESC_SIZE, {
        width: CONTENT_WIDTH,
      })
      section.appendChild(description)
      description.x = 0
      description.y = title.height + TITLE_TO_DESC
      description.opacity = 0.6
      headerBottom = description.y + description.height
    }

    const gridTop = headerBottom + HEADER_TO_GRID
    const nodes: SceneNode[] = []
    const labels: Array<TextNode | null> = []
    const boxes: Box[] = []

    for (const meta of members) {
      const svgs = current.svgs.get(meta.id)
      if (!svgs) continue

      const built = buildElementNode(meta, svgs, section, `${category.id}/${meta.id}`)
      if (!built) continue
      const { node } = built

      node.setPluginData(
        'dtpr',
        JSON.stringify({
          elementId: meta.id,
          categoryId: category.id,
          version: settings.version,
          contentHash,
        }),
      )
      // Surfaces in Figma's Assets panel and instance inspector, so a
      // designer gets the element's plain-language meaning in place.
      if (meta.description) node.description = meta.description
      componentCount += built.components
      if (node.type === 'COMPONENT_SET') setCount += 1

      let label: TextNode | null = null
      if (settings.includeLabels) {
        label = makeText(meta.title || meta.id, fonts.regular, LABEL_SIZE, {
          width: LABEL_WIDTH,
          center: true,
        })
        section.appendChild(label)
        label.opacity = 0.7
      }

      nodes.push(node)
      labels.push(label)
      boxes.push(boxFor(node, label))

      processed += 1
      if (processed % YIELD_EVERY === 0) {
        post({
          type: 'build-progress',
          done: processed,
          total: current.elements.length,
          label: `${category.id}/${meta.id}`,
        })
        // Yielding is what lets `build-cancel` reach us at all — the
        // sandbox is single-threaded, so a message queued during the
        // build is only delivered here.
        await new Promise((resolve) => setTimeout(resolve, 0))
        if (cancelRequested) throw new Error(CANCELLED_MESSAGE)
      }
    }

    const flow = flowWrap(boxes, {
      maxWidth: CONTENT_WIDTH,
      gapX: GRID_GAP_X,
      gapY: GRID_GAP_Y,
    })

    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i] as SceneNode
      const placement = flow.placements[i]
      const box = boxes[i]
      if (!placement || !box) continue
      node.x = placement.x + (box.width - node.width) / 2
      node.y = gridTop + placement.y
      const label = labels[i]
      if (label) {
        label.x = placement.x + (box.width - label.width) / 2
        label.y = node.y + node.height + LABEL_GAP
      }
    }

    section.resizeWithoutConstraints(
      Math.max(CONTENT_WIDTH, flow.width),
      gridTop + flow.height,
    )
    cursorY += section.height + SECTION_GAP
  }

  if (page.children.length > 0) {
    figma.viewport.scrollAndZoomIntoView(page.children)
  }
  post({
    type: 'build-done',
    components: componentCount,
    sets: setCount,
    pageName: page.name,
  })
  figma.notify(
    componentCount > 0
      ? `DTPR: built ${componentCount} components on "${page.name}"`
      : 'DTPR: nothing to build — no icons arrived.',
  )
}
