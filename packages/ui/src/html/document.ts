import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import type { ElementDisplay } from '../core/types.js'
import DtprDatachain from '../vue/DtprDatachain.vue'
import DtprElementDetail from '../vue/DtprElementDetail.vue'
import DtprElementGrid from '../vue/DtprElementGrid.vue'
import { stylesCss } from './styles.js'
import { accordionScript } from './script.js'

// Nominal brand for HTML strings the caller has vouched for as safe to
// inject raw. Any API boundary that embeds unescaped HTML requires
// `SafeHtml`, so passing a plain string fails type-checking — callers
// must opt in via `trustAsHtml(...)`. This surfaces the trust decision
// at every call site instead of hiding it behind a prose contract.
declare const __dtpr_safe_html: unique symbol
export type SafeHtml = string & { readonly [__dtpr_safe_html]: true }

// Wrap a string the caller has already sanitized (or knows is safe —
// e.g. a static constant) for insertion as raw HTML. Use this at the
// boundary where sanitization happens; do NOT call on user input that
// has not passed through a sanitizer.
export function trustAsHtml(html: string): SafeHtml {
  return html as SafeHtml
}

export interface RenderedSection {
  id: string
  title: string
  elements: readonly ElementDisplay[]
}

export interface RenderDatachainOptions {
  locale?: string
  // Fallback for the HTML `<title>` tag when no `title` is supplied.
  // Defaults to "DTPR datachain". When `title` is set, the document
  // <title> uses it instead of `pageTitle`.
  pageTitle?: string
  // The datachain instance's title resolved into the requested locale
  // (e.g. "Worcester license plate reader"). Renders as the `<h1>`
  // headline of the document body and replaces the HTML `<title>` tag
  // when set. Matches `DatachainInstance.title`. When omitted, no
  // header block is rendered.
  title?: string
  // The datachain instance's description (one or two sentences, or
  // longer prose) resolved into the requested locale. Renders as the
  // body's lead paragraph below the title. Matches
  // `DatachainInstance.description`.
  description?: string
  // Optional HTML for the empty state, inserted unescaped. Declare trust
  // via `trustAsHtml(...)` — the brand prevents raw user input from
  // reaching the v-html boundary. When omitted and no sections are
  // passed, the body contains an empty
  // `<p class="dtpr-empty" role="status">` placeholder.
  emptyHtml?: SafeHtml
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
  // The instance title (when supplied) becomes the HTML <title>;
  // otherwise fall back to `pageTitle` and finally the generic default.
  const docTitle = options.title ?? options.pageTitle ?? 'DTPR datachain'
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

  // The Vue `<DtprDatachain>` component owns the title/description
  // header rendering — the SSR path passes them through as props so
  // the same DOM shape (and the same Vue-level XSS escaping) holds
  // for both server-rendered docs and client-side consumers.
  const datachainProps: Record<string, unknown> = { sections: datachainSections }
  if (options.title !== undefined) datachainProps.title = options.title
  if (options.description !== undefined) datachainProps.description = options.description

  const Root = defineComponent({
    setup() {
      return () =>
        h(
          DtprDatachain,
          datachainProps,
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
    `<title>${escapeHtml(docTitle)}</title>` +
    `<style>${stylesCss}</style>` +
    `</head>` +
    `<body>${body}<script>${accordionScript}</script></body>` +
    `</html>`
  )
}
