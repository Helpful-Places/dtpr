import { d as defineEventHandler, g as getRouterParam, c as createError, r as readBody } from '../../../nitro/nitro.mjs';
import { readFile } from 'fs/promises';
import { basename, join } from 'path';
import matter from 'gray-matter';
import { g as getContentDir } from '../../../_/paths.mjs';
import { s as serializeFrontmatter, w as writeMarkdownFile } from '../../../_/content-writer.mjs';
import { g as getProvider } from '../../../_/provider.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const _id__put = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Missing element id" });
  const body = await readBody(event);
  const { locale, name, description } = body;
  if (!locale) throw createError({ statusCode: 400, message: "locale is required" });
  const contentDir = getContentDir();
  const provider = getProvider();
  let existingFile;
  try {
    existingFile = await provider.readFile("elements", "en", id);
  } catch {
    existingFile = await provider.readFile("elements", locale, id);
  }
  const fileName = basename(existingFile.filePath);
  let currentFrontmatter;
  let currentBody = "";
  try {
    const localeFilePath = join(contentDir, "elements", locale, fileName);
    const raw = await readFile(localeFilePath, "utf-8");
    const parsed = matter(raw);
    currentFrontmatter = parsed.data;
    currentBody = parsed.content.trim();
  } catch {
    currentFrontmatter = { ...existingFile.frontmatter };
  }
  if (name !== void 0) currentFrontmatter.name = name;
  if (description !== void 0) currentFrontmatter.description = description;
  currentFrontmatter.updated_at = (/* @__PURE__ */ new Date()).toISOString().split("T")[0] + "T00:00:00Z";
  const ordered = serializeFrontmatter(currentFrontmatter);
  await writeMarkdownFile(contentDir, "elements", locale, fileName, ordered, currentBody);
  return { success: true, locale, id };
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
