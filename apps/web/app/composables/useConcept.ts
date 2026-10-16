// The one concept dialog in the Taxonomy section. Any term with a section on the
// Concepts page (its heading id, such as `shape` or `schema-version`) can open it.
export function useConcept() {
  const term = useState<string>('taxonomy-concept-term', () => 'category')
  const open = useState('taxonomy-concept-open', () => false)
  const explain = (id: string) => {
    term.value = id
    open.value = true
  }
  return { term, open, explain }
}
