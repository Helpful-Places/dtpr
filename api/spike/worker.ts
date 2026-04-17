import { defineComponent, h, createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server'
import { StreamableHTTPTransport } from '@hono/mcp'
import { Hono } from 'hono'
import { z } from 'zod'

const DtprElement = defineComponent({
  props: {
    title: { type: String, required: true },
    iconAlt: { type: String, required: true },
  },
  setup(props) {
    return () =>
      h('figure', { class: 'dtpr-element' }, [
        h('img', { class: 'dtpr-element__icon', alt: props.iconAlt }),
        h('figcaption', { class: 'dtpr-element__title' }, props.title),
      ])
  },
})

const DtprCategorySection = defineComponent({
  props: {
    id: { type: String, required: true },
    title: { type: String, required: true },
    elements: {
      type: Array as () => Array<{ id: string; title: string; iconAlt: string }>,
      required: true,
    },
    expanded: { type: Boolean, default: false },
  },
  setup(props) {
    return () =>
      h('section', { class: 'dtpr-category', id: props.id }, [
        h(
          'button',
          {
            class: 'dtpr-category__header',
            'aria-expanded': String(props.expanded),
            'aria-controls': `${props.id}__panel`,
            'data-dtpr-collapsible': '',
          },
          props.title,
        ),
        h(
          'div',
          {
            id: `${props.id}__panel`,
            role: 'region',
            hidden: !props.expanded,
          },
          [
            h(
              'ul',
              { class: 'dtpr-category__elements' },
              props.elements.map((el) =>
                h('li', { key: el.id }, [h(DtprElement, { title: el.title, iconAlt: el.iconAlt })]),
              ),
            ),
          ],
        ),
      ])
  },
})

const DtprDatachain = defineComponent({
  props: {
    sections: {
      type: Array as () => Array<{
        id: string
        title: string
        elements: Array<{ id: string; title: string; iconAlt: string }>
      }>,
      required: true,
    },
  },
  setup(props) {
    return () =>
      h(
        'div',
        { class: 'dtpr-datachain' },
        props.sections.map((s) =>
          h(DtprCategorySection, { id: s.id, title: s.title, elements: s.elements }),
        ),
      )
  },
})

const FIXTURE_SECTIONS = Array.from({ length: 10 }).map((_, i) => ({
  id: `ai__cat_${i}`,
  title: `Category ${i}`,
  elements: Array.from({ length: 3 }).map((_, j) => ({
    id: `el_${i}_${j}`,
    title: `Element ${i}.${j}`,
    iconAlt: `icon for element ${i}.${j}`,
  })),
}))

async function renderDatachainDocument(
  sections: typeof FIXTURE_SECTIONS,
): Promise<string> {
  const app = createSSRApp(DtprDatachain, { sections })
  const body = await renderToString(app)
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>DTPR datachain</title><style>/* tokens + @layer dtpr go here */</style></head><body>${body}<script>/* vanilla accordion handler */</script></body></html>`
}

// Shared state: the most recently rendered datachain by session/call.
// In production this would be scoped to session; spike uses a module-level slot.
let lastRenderedHtml: string | null = null

function createMcp(): McpServer {
  const server = new McpServer({ name: 'dtpr-spike', version: '0.0.1' })

  registerAppResource(
    server,
    'DTPR Datachain View',
    'ui://dtpr/datachain/view.html',
    { description: 'Rendered datachain HTML' },
    async () => ({
      contents: [
        {
          uri: 'ui://dtpr/datachain/view.html',
          mimeType: RESOURCE_MIME_TYPE,
          text:
            lastRenderedHtml ??
            (await renderDatachainDocument(FIXTURE_SECTIONS)),
        },
      ],
    }),
  )

  registerAppTool(
    server,
    'render_datachain',
    {
      description: 'Render a DTPR datachain as an interactive MCP App iframe',
      inputSchema: {
        sectionCount: z.number().int().min(0).max(50).default(10),
      },
      _meta: { ui: { resourceUri: 'ui://dtpr/datachain/view.html' } },
    },
    async ({ sectionCount }) => {
      const sections = FIXTURE_SECTIONS.slice(0, sectionCount)
      lastRenderedHtml = await renderDatachainDocument(sections)
      return {
        content: [
          {
            type: 'text',
            text: `Rendered ${sections.length} categories. UI available via ui://dtpr/datachain/view.html`,
          },
        ],
      }
    },
  )

  return server
}

const app = new Hono()

app.get('/', async (c) => {
  const html = await renderDatachainDocument(FIXTURE_SECTIONS)
  return c.html(html)
})

app.get('/bench', async (c) => {
  const iterations = Number(c.req.query('n') ?? '50')
  const times: number[] = []
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now()
    await renderDatachainDocument(FIXTURE_SECTIONS)
    times.push(performance.now() - t0)
  }
  times.sort((a, b) => a - b)
  const p50 = times[Math.floor(times.length * 0.5)]
  const p99 = times[Math.floor(times.length * 0.99)] ?? times[times.length - 1]
  return c.json({ iterations, p50_ms: p50, p99_ms: p99 })
})

app.all('/mcp', async (c) => {
  const server = createMcp()
  const transport = new StreamableHTTPTransport()
  await server.connect(transport)
  return transport.handleRequest(c)
})

export default {
  fetch: app.fetch,
} satisfies ExportedHandler
