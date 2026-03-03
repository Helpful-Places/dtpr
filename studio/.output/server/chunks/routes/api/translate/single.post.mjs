import { d as defineEventHandler, c as createError, r as readBody, u as useRuntimeConfig } from '../../../nitro/nitro.mjs';
import { t as translateElement } from '../../../_/claude-translator.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@anthropic-ai/sdk';

const single_post = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  if (!config.anthropicApiKey) {
    throw createError({ statusCode: 500, message: "ANTHROPIC_API_KEY not configured" });
  }
  const body = await readBody(event);
  const { sourceLocale = "en", targetLocale, name, description, prompt, context } = body;
  if (!targetLocale || !name) {
    throw createError({ statusCode: 400, message: "targetLocale and name are required" });
  }
  const result = await translateElement(config.anthropicApiKey, {
    sourceLocale,
    targetLocale,
    name,
    description,
    prompt,
    context
  });
  return result;
});

export { single_post as default };
//# sourceMappingURL=single.post.mjs.map
