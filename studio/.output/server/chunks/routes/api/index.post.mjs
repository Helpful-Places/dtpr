import { d as defineEventHandler, r as readBody, c as createError } from '../../nitro/nitro.mjs';
import { g as getContentDir } from '../../_/paths.mjs';
import { b as buildElementFileName, s as serializeFrontmatter, w as writeMarkdownFile } from '../../_/content-writer.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'path';
import 'fs/promises';
import 'gray-matter';

const index_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, name, description, category, icon } = body;
  if (!id || !name || !(category == null ? void 0 : category.length)) {
    throw createError({ statusCode: 400, message: "id, name, and category are required" });
  }
  const contentDir = getContentDir();
  const fileName = buildElementFileName(id, category);
  const now = (/* @__PURE__ */ new Date()).toISOString().split("T")[0] + "T00:00:00Z";
  const frontmatter = serializeFrontmatter({
    category,
    name,
    id,
    description: description || "",
    icon: icon || `/dtpr-icons/${id}.svg`,
    updated_at: now
  });
  const filePath = await writeMarkdownFile(contentDir, "elements", "en", fileName, frontmatter);
  return { success: true, filePath, fileName };
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
