import { d as defineEventHandler, a as getQuery } from '../../nitro/nitro.mjs';
import { g as getProvider } from '../../_/provider.mjs';
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
import '../../_/paths.mjs';

const index_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const provider = getProvider();
  const locale = query.locale;
  const category = query.category;
  const search = query.search;
  const datachain_type = query.datachain_type;
  const hasIcon = query.hasIcon !== void 0 ? query.hasIcon === "true" : void 0;
  if (locale || category || search || datachain_type || hasIcon !== void 0) {
    const elements = await provider.query("elements", {
      locale,
      category,
      datachain_type,
      search,
      hasIcon
    });
    return elements.map((el) => ({
      ...el.frontmatter,
      locale: el.locale,
      fileName: el.filePath.split("/").pop()
    }));
  }
  const summaries = await provider.getElementSummaries();
  return summaries;
});

export { index_get as default };
//# sourceMappingURL=index.get2.mjs.map
