import { d as defineEventHandler, c as createError, r as readBody, u as useRuntimeConfig } from '../../../nitro/nitro.mjs';
import { basename } from 'path';
import { t as translateElement } from '../../../_/claude-translator.mjs';
import { s as serializeFrontmatter, w as writeMarkdownFile } from '../../../_/content-writer.mjs';
import { g as getProvider } from '../../../_/provider.mjs';
import { g as getContentDir } from '../../../_/paths.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@anthropic-ai/sdk';
import 'fs/promises';
import 'gray-matter';

const batch_post = defineEventHandler(async (event) => {
  var _a;
  const config = useRuntimeConfig();
  if (!config.anthropicApiKey) {
    throw createError({ statusCode: 500, message: "ANTHROPIC_API_KEY not configured" });
  }
  const body = await readBody(event);
  const { elementIds, targetLocale, concurrency = 3 } = body;
  if (!(elementIds == null ? void 0 : elementIds.length) || !targetLocale) {
    throw createError({ statusCode: 400, message: "elementIds and targetLocale are required" });
  }
  const provider = getProvider();
  const contentDir = getContentDir();
  let translated = 0;
  const errors = [];
  for (let i = 0; i < elementIds.length; i += concurrency) {
    const batch = elementIds.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map(async (elementId) => {
        const enFile = await provider.readFile("elements", "en", elementId);
        const fm = enFile.frontmatter;
        const translation = await translateElement(config.anthropicApiKey, {
          sourceLocale: "en",
          targetLocale,
          name: fm.name,
          description: fm.description,
          prompt: fm.prompt
        });
        const fileName = basename(enFile.filePath);
        const now = (/* @__PURE__ */ new Date()).toISOString().split("T")[0] + "T00:00:00Z";
        const translatedFm = serializeFrontmatter({
          ...fm,
          name: translation.name,
          description: translation.description,
          ...translation.prompt ? { prompt: translation.prompt } : {},
          updated_at: now
        });
        await writeMarkdownFile(contentDir, "elements", targetLocale, fileName, translatedFm);
        return elementId;
      })
    );
    for (let j = 0; j < results.length; j++) {
      if (results[j].status === "fulfilled") {
        translated++;
      } else {
        errors.push({
          id: batch[j],
          error: ((_a = results[j].reason) == null ? void 0 : _a.message) || "Unknown error"
        });
      }
    }
  }
  return { translated, errors, total: elementIds.length };
});

export { batch_post as default };
//# sourceMappingURL=batch.post.mjs.map
