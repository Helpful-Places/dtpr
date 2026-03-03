import { d as defineEventHandler, g as getRouterParam, c as createError } from '../../../nitro/nitro.mjs';
import { basename } from 'path';
import { g as getProvider, L as LOCALES } from '../../../_/provider.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'fs/promises';
import 'gray-matter';
import '../../../_/paths.mjs';

const _id__get = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Missing element id" });
  const provider = getProvider();
  const result = { id, locales: {} };
  for (const locale of LOCALES) {
    try {
      const file = await provider.readFile("elements", locale, id);
      result.locales[locale] = {
        ...file.frontmatter,
        content: file.content
      };
      if (!result.category) {
        result.category = file.frontmatter.category;
        result.icon = file.frontmatter.icon;
        result.updated_at = file.frontmatter.updated_at;
        result.fileName = basename(file.filePath);
      }
    } catch {
    }
  }
  if (Object.keys(result.locales).length === 0) {
    throw createError({ statusCode: 404, message: `Element not found: ${id}` });
  }
  return result;
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
