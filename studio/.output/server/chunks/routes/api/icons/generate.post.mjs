import { d as defineEventHandler, c as createError, r as readBody, u as useRuntimeConfig } from '../../../nitro/nitro.mjs';
import OpenAI from 'openai';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { g as getProvider } from '../../../_/provider.mjs';
import { a as getIconsDir } from '../../../_/paths.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'gray-matter';

async function generateIcon(apiKey, iconsDir, request) {
  var _a;
  const client = new OpenAI({
    apiKey,
    baseURL: "https://external.api.recraft.ai/v1"
  });
  const prompt = `Simple line icon of "${request.elementName}": ${request.elementDescription}. Style: minimal line art, 36x36 viewBox, black stroke on transparent background, rounded rectangle border, clean simple lines, matching DTPR icon style.`;
  const response = await client.images.generate({
    model: "recraftv3",
    prompt,
    n: 1,
    response_format: "url",
    style: "vector_illustration",
    // @ts-expect-error - Recraft-specific parameter
    substyle: "line_art",
    // @ts-expect-error - Recraft-specific parameter
    size: "1024x1024"
  });
  const imageUrl = (_a = response.data[0]) == null ? void 0 : _a.url;
  if (!imageUrl) {
    throw new Error("No image returned from Recraft API");
  }
  const svgResponse = await fetch(imageUrl);
  const svg = await svgResponse.text();
  const fileName = `${request.elementId}.svg`;
  const filePath = join(iconsDir, fileName);
  await writeFile(filePath, svg, "utf-8");
  return { svg, filePath };
}

const generate_post = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  if (!config.recraftApiKey) {
    throw createError({ statusCode: 500, message: "RECRAFT_API_KEY not configured" });
  }
  const body = await readBody(event);
  const { elementId } = body;
  if (!elementId) {
    throw createError({ statusCode: 400, message: "elementId is required" });
  }
  const provider = getProvider();
  const iconsDir = getIconsDir();
  const element = await provider.readFile("elements", "en", elementId);
  const fm = element.frontmatter;
  const result = await generateIcon(config.recraftApiKey, iconsDir, {
    elementId: fm.id,
    elementName: fm.name,
    elementDescription: fm.description
  });
  return {
    success: true,
    elementId,
    filePath: result.filePath,
    svgLength: result.svg.length
  };
});

export { generate_post as default };
//# sourceMappingURL=generate.post.mjs.map
