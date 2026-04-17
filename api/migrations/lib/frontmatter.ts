import yaml from 'js-yaml'

/**
 * Parse YAML frontmatter from a markdown file. The DTPR v1 content tree
 * uses frontmatter-only markdown (bodies are empty), so we return the
 * parsed frontmatter as-is. Empty files produce `null` so callers can
 * decide whether to skip or error.
 */
export function parseFrontmatter(raw: string): Record<string, unknown> | null {
  const trimmed = raw.replace(/^\uFEFF/, '')
  if (trimmed.trim().length === 0) return null

  // DTPR v1 files start with `---\n<yaml>\n---\n` and an empty body.
  const match = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---\s*([\s\S]*)$/)
  if (!match) return null
  const yamlBlock = match[1] ?? ''
  try {
    const parsed = yaml.load(yamlBlock, { schema: yaml.JSON_SCHEMA })
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}
