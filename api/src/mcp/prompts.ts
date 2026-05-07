import { BUNDLED_PROMPTS, type BundledPrompt } from './prompts/skills.generated.ts'

/**
 * MCP `prompts/list` and `prompts/get` registry.
 *
 * Each registered prompt is one DTPR Agent Skill (or one of the
 * reference documents skills cite). Bodies come from
 * `prompts/skills.generated.ts`, which is regenerated from
 * `plugin/dtpr/` by `pnpm --filter ./api bundle:skills`.
 *
 * v1 ships zero-argument prompts. The full SKILL.md body is returned
 * as a single `user` message; the MCP host injects it into the
 * conversation, exactly the way Claude Code's skill subsystem does
 * when the plugin is installed.
 */

/** Descriptor shape returned by `prompts/list`. */
export interface PromptDescriptor {
  name: string
  description: string
}

/** One message in a `prompts/get` response. The 2025-06-18 MCP spec
 * allows `user` and `assistant` roles only — no `system`. */
export interface PromptMessage {
  role: 'user' | 'assistant'
  content: { type: 'text'; text: string }
}

/** `prompts/get` result shape. */
export interface PromptResult {
  description: string
  messages: PromptMessage[]
}

export interface PromptDef {
  descriptor: PromptDescriptor
  body: string
}

export interface PromptRegistry {
  list(): PromptDescriptor[]
  get(name: string): PromptDef | undefined
}

function toDef(p: BundledPrompt): PromptDef {
  return {
    descriptor: { name: p.name, description: p.description },
    body: p.body,
  }
}

/** Build a registry over the bundled prompts. Stateless — the same
 * registry is safe to share across requests in a Worker isolate. */
export function buildPromptRegistry(): PromptRegistry {
  const defs = BUNDLED_PROMPTS.map(toDef)
  const byName = new Map(defs.map((d) => [d.descriptor.name, d]))
  return {
    list: () => defs.map((d) => d.descriptor),
    get: (name) => byName.get(name),
  }
}

/** Compose the `prompts/get` result envelope from a registry hit. */
export function toPromptResult(def: PromptDef): PromptResult {
  return {
    description: def.descriptor.description,
    messages: [{ role: 'user', content: { type: 'text', text: def.body } }],
  }
}
