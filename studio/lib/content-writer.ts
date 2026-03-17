import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import matter from 'gray-matter'
import type { Collection, Locale } from './types'

export async function writeMarkdownFile(
  contentDir: string,
  collection: Collection,
  locale: Locale,
  fileName: string,
  frontmatter: Record<string, any>,
  body: string = '',
): Promise<string> {
  const filePath = join(contentDir, collection, locale, fileName)
  await mkdir(dirname(filePath), { recursive: true })

  const content = matter.stringify(body ? `\n${body}` : '', frontmatter)
  await writeFile(filePath, content, 'utf-8')
  return filePath
}

export function buildElementFileName(id: string, categories: string[]): string {
  // Determine filename pattern from categories
  // List elements: list-{category}__{sub_category}__{id}.md
  // Regular elements: {category}__{id}.md

  // Find the primary category (first one)
  const primaryCat = categories[0] || ''
  const parts = primaryCat.split('__')

  if (parts.length >= 2) {
    // Check if this should be a list element (sub-category of an AI category)
    const aiListCategories = ['ai__decision', 'ai__processing', 'ai__rights', 'ai__risks_mitigation', 'ai__storage']
    if (aiListCategories.includes(primaryCat)) {
      return `list-${parts[0]}__${parts[1]}__${id}.md`
    }
    // Regular element: use the sub-part as prefix
    return `${parts[1]}__${id}.md`
  }

  return `${id}.md`
}

export function serializeFrontmatter(data: Record<string, any>): Record<string, any> {
  // Ensure consistent field ordering and clean data
  const ordered: Record<string, any> = {}

  // Elements
  if (data.category) ordered.category = data.category
  if (data.name !== undefined) ordered.name = data.name
  if (data.id) ordered.id = data.id
  if (data.description !== undefined) ordered.description = data.description
  if (data.prompt !== undefined) ordered.prompt = data.prompt
  if (data.icon) ordered.icon = data.icon
  if (data.required !== undefined) ordered.required = data.required
  if (data.order !== undefined) ordered.order = data.order
  if (data.datachain_type) ordered.datachain_type = data.datachain_type
  if (data.element_variables) ordered.element_variables = data.element_variables
  if (data.updated_at) ordered.updated_at = data.updated_at

  return ordered
}
