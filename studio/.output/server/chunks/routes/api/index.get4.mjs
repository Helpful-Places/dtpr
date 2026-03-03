import { d as defineEventHandler, a as getQuery, c as createError } from '../../nitro/nitro.mjs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { g as getProvider } from '../../_/provider.mjs';
import { a as getIconsDir } from '../../_/paths.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'gray-matter';

const index_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const provider = getProvider();
  const iconsDir = getIconsDir();
  const elements = await provider.getAllElements("en");
  const icons = await provider.listIcons();
  const iconSet = new Set(icons);
  if (query.file) {
    const fileName = query.file;
    if (!fileName.endsWith(".svg")) {
      throw createError({ statusCode: 400, message: "Only SVG files supported" });
    }
    const content = await readFile(join(iconsDir, fileName), "utf-8");
    return { fileName, content };
  }
  return elements.map((el) => {
    const iconPath = el.frontmatter.icon || "";
    const iconFileName = iconPath.split("/").pop() || "";
    return {
      id: el.frontmatter.id,
      name: el.frontmatter.name,
      icon: iconPath,
      iconFileName,
      hasIcon: iconSet.has(iconFileName)
    };
  });
});

export { index_get as default };
//# sourceMappingURL=index.get4.mjs.map
