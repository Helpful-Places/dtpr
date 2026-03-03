import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import matter from 'gray-matter';

async function writeMarkdownFile(contentDir, collection, locale, fileName, frontmatter, body = "") {
  const filePath = join(contentDir, collection, locale, fileName);
  await mkdir(dirname(filePath), { recursive: true });
  const content = matter.stringify(body ? `
${body}` : "", frontmatter);
  await writeFile(filePath, content, "utf-8");
  return filePath;
}
function buildElementFileName(id, categories) {
  const primaryCat = categories[0] || "";
  const parts = primaryCat.split("__");
  if (parts.length >= 2) {
    const aiListCategories = ["ai__decision", "ai__processing", "ai__rights", "ai__risks_mitigation", "ai__storage"];
    if (aiListCategories.includes(primaryCat)) {
      return `list-${parts[0]}__${parts[1]}__${id}.md`;
    }
    return `${parts[1]}__${id}.md`;
  }
  return `${id}.md`;
}
function serializeFrontmatter(data) {
  const ordered = {};
  if (data.category) ordered.category = data.category;
  if (data.name !== void 0) ordered.name = data.name;
  if (data.id) ordered.id = data.id;
  if (data.description !== void 0) ordered.description = data.description;
  if (data.prompt !== void 0) ordered.prompt = data.prompt;
  if (data.icon) ordered.icon = data.icon;
  if (data.required !== void 0) ordered.required = data.required;
  if (data.order !== void 0) ordered.order = data.order;
  if (data.datachain_type) ordered.datachain_type = data.datachain_type;
  if (data.element_variables) ordered.element_variables = data.element_variables;
  if (data.updated_at) ordered.updated_at = data.updated_at;
  return ordered;
}

export { buildElementFileName as b, serializeFrontmatter as s, writeMarkdownFile as w };
//# sourceMappingURL=content-writer.mjs.map
