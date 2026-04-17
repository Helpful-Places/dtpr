import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import type { ElementDisplay } from '../core/types.js'
import DtprDatachain from '../vue/DtprDatachain.vue'
import DtprElementDetail from '../vue/DtprElementDetail.vue'
import DtprElementGrid from '../vue/DtprElementGrid.vue'
import { stylesCss } from './styles.js'
import { accordionScript } from './script.js'

export interface RenderedSection {
  id: string
  title: string
  elements: readonly ElementDisplay[]
}

export interface RenderDatachainOptions {
  locale?: string
  title?: string
  // Optional sanitized HTML for the empty state. When omitted and no sections
  // are passed, the body contains an empty `<p class="dtpr-empty" role="status">`
  // placeholder.
  emptyHtml?: string
}

const ATTR_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (c) => ATTR_ESCAPES[c] ?? c)
}

export async function renderDatachainDocument(
  sections: readonly RenderedSection[],
  options: RenderDatachainOptions = {},
): Promise<string> {
  const locale = options.locale ?? 'en'
  const title = options.title ?? 'DTPR datachain'
  const datachainSections = sections.map((s) => ({ id: s.id, title: s.title }))

  const sectionSlots: Record<string, () => unknown> = {}
  for (const s of sections) {
    sectionSlots[`section-${s.id}`] = () =>
      h(
        DtprElementGrid,
        {},
        {
          default: () =>
            s.elements.map((display) =>
              h(DtprElementDetail, { display, locale, key: display.title }),
            ),
        },
      )
  }

  const emptySlot = () =>
    options.emptyHtml !== undefined
      ? h('div', { class: 'dtpr-empty', role: 'status', innerHTML: options.emptyHtml })
      : h('p', { class: 'dtpr-empty', role: 'status' })

  const Root = defineComponent({
    setup() {
      return () =>
        h(
          DtprDatachain,
          { sections: datachainSections },
          { empty: emptySlot, ...sectionSlots },
        )
    },
  })

  const app = createSSRApp(Root)
  const body = await renderToString(app)

  return (
    `<!doctype html><html lang="${escapeHtml(locale)}">` +
    `<head>` +
    `<meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>${escapeHtml(title)}</title>` +
    `<style>${stylesCss}</style>` +
    `</head>` +
    `<body>${body}<script>${accordionScript}</script></body>` +
    `</html>`
  )
}
