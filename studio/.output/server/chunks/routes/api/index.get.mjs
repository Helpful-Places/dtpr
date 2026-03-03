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
  const datachain_type = query.datachain_type;
  const summaries = await provider.getCategorySummaries();
  if (datachain_type) {
    return summaries.filter((c) => c.datachain_type === datachain_type);
  }
  return summaries;
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
