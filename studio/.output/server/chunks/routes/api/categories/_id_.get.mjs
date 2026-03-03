import { d as defineEventHandler, g as getRouterParam, c as createError } from '../../../nitro/nitro.mjs';
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
import 'path';
import 'gray-matter';
import '../../../_/paths.mjs';

const _id__get = defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "Missing category id" });
  const provider = getProvider();
  const result = { id, locales: {} };
  for (const locale of LOCALES) {
    try {
      const file = await provider.readFile("categories", locale, id);
      result.locales[locale] = {
        ...file.frontmatter,
        content: file.content
      };
      if (!result.datachain_type) {
        result.datachain_type = file.frontmatter.datachain_type;
        result.order = file.frontmatter.order;
        result.required = file.frontmatter.required;
        result.element_variables = file.frontmatter.element_variables;
        result.updated_at = file.frontmatter.updated_at;
      }
    } catch {
    }
  }
  if (Object.keys(result.locales).length === 0) {
    throw createError({ statusCode: 404, message: `Category not found: ${id}` });
  }
  const elements = await provider.query("elements", { locale: "en", category: id });
  result.elements = elements.map((el) => ({
    id: el.frontmatter.id,
    name: el.frontmatter.name,
    icon: el.frontmatter.icon
  }));
  return result;
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
