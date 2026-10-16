// Why a category is required or optional, and what its shape signals, read from
// the tables under "Required category" and "Shape" on the Concepts page. The
// explorer quotes the docs, so the two never give different answers.
type MinimarkNode = string | [string, Record<string, unknown>, ...MinimarkNode[]]

const text = (node: MinimarkNode): string => (typeof node === 'string' ? node : node.slice(2).map((n) => text(n as MinimarkNode)).join(''))

// The first table in a term's section, as a map from its first column to its last.
function reasons(body: MinimarkNode[], term: string): Record<string, string> {
  const start = body.findIndex((node) => Array.isArray(node) && node[0] === 'h3' && node[1].id === term)
  const isHeading = (node: MinimarkNode) => Array.isArray(node) && /^h[23]$/.test(node[0])
  const end = body.findIndex((node, i) => i > start && isHeading(node))
  const table = body.slice(start + 1, end < 0 ? undefined : end).find((node) => Array.isArray(node) && node[0] === 'table')
  if (start < 0 || !Array.isArray(table)) return {}
  const tbody = table.slice(2).find((node) => Array.isArray(node) && node[0] === 'tbody') as MinimarkNode[] | undefined
  const rows = (tbody?.slice(2) ?? []).filter(Array.isArray) as MinimarkNode[][]
  return Object.fromEntries(rows.map((row) => {
    const cells = row.slice(2).map((cell) => text(cell).trim())
    return [cells[0]!.toLowerCase(), cells.at(-1)!]
  }))
}

export function useConceptReasons() {
  return useAsyncData('concept-reasons', async () => {
    const page = await queryCollection('docs').path('/docs/concepts').first()
    const body = (page?.body as { value: MinimarkNode[] } | undefined)?.value ?? []
    return { required: reasons(body, 'required-category'), shape: reasons(body, 'shape') }
  })
}
