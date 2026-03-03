import Anthropic from '@anthropic-ai/sdk';

const LOCALE_NAMES = {
  en: "English",
  es: "Spanish",
  fr: "French",
  km: "Khmer",
  pt: "Portuguese",
  tl: "Tagalog"
};
async function translateElement(apiKey, request) {
  const client = new Anthropic({ apiKey });
  const fields = [`name: "${request.name}"`, `description: "${request.description}"`];
  if (request.prompt) {
    fields.push(`prompt: "${request.prompt}"`);
  }
  const systemPrompt = `You are a professional translator for the DTPR (Digital Trust for Places & Routines) project. DTPR is a taxonomy standard for digital transparency in public spaces. Translate the provided fields from ${LOCALE_NAMES[request.sourceLocale]} to ${LOCALE_NAMES[request.targetLocale]}.

Rules:
- Maintain technical accuracy and consistent terminology
- Keep the same tone and level of formality as the source
- Do not translate proper nouns or acronyms (e.g., "DTPR", "AI", "LLM")
- Return ONLY a JSON object with the translated fields, no explanation`;
  const userMessage = `Translate these fields to ${LOCALE_NAMES[request.targetLocale]}:

${fields.join("\n")}${request.context ? `

Context: ${request.context}` : ""}`;
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }]
  });
  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse translation response");
  }
  return JSON.parse(jsonMatch[0]);
}

export { translateElement as t };
//# sourceMappingURL=claude-translator.mjs.map
