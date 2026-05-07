import { beforeAll, describe, expect, it } from 'vitest'
import { BUNDLED_PROMPTS } from '../../src/mcp/prompts/skills.generated.ts'
import { createMcpClient } from './mcp-client.ts'
import { seedVersion } from './seed.ts'

beforeAll(async () => {
  await seedVersion()
})

describe('MCP: prompts capability', () => {
  it('declares prompts capability on initialize', async () => {
    const client = createMcpClient()
    const res = await client.initialize()
    const result = res.result as { capabilities?: Record<string, unknown> } | undefined
    expect(result?.capabilities).toBeDefined()
    expect(result?.capabilities?.['prompts']).toBeDefined()
  })

  it('prompts/list returns one entry per bundled prompt', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.listPrompts()
    expect(res.error).toBeUndefined()
    const prompts = res.result?.prompts ?? []
    expect(prompts.length).toBe(BUNDLED_PROMPTS.length)
    const expected = new Set(BUNDLED_PROMPTS.map((p) => p.name))
    for (const p of prompts) {
      expect(expected.has(p.name)).toBe(true)
      expect(p.description?.length).toBeGreaterThan(0)
      // Description cap keeps client pickers usable.
      expect(p.description!.length).toBeLessThanOrEqual(280)
    }
  })

  it('prompts/list includes every skill plus reference prompts', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.listPrompts()
    const names = new Set((res.result?.prompts ?? []).map((p) => p.name))
    // Skills.
    expect(names.has('dtpr-describe-system')).toBe(true)
    expect(names.has('dtpr-element-design')).toBe(true)
    expect(names.has('dtpr-symbol-design')).toBe(true)
    expect(names.has('dtpr-translate')).toBe(true)
    expect(names.has('dtpr-comprehension-audit')).toBe(true)
    expect(names.has('dtpr-category-audit')).toBe(true)
    expect(names.has('dtpr-datachain-structure')).toBe(true)
    // References.
    expect(names.has('dtpr-references-comprehension-rubric')).toBe(true)
    expect(names.has('dtpr-references-comprehension-block-template')).toBe(true)
  })

  it('prompts/get returns a single user message with the SKILL.md body', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.getPrompt('dtpr-describe-system')
    expect(res.error).toBeUndefined()
    const result = res.result
    expect(result?.description).toMatch(/.+/)
    expect(result?.messages).toHaveLength(1)
    expect(result?.messages[0]!.role).toBe('user')
    expect(result?.messages[0]!.content.type).toBe('text')
    const text = result!.messages[0]!.content.text
    // Frontmatter is preserved so consumers see the same dispatch
    // metadata Claude Code's skill subsystem reads.
    expect(text).toMatch(/^---\nname: dtpr-describe-system\n/)
    expect(text).toContain('# Describe an AI system')
  })

  it('rewrites plugin/dtpr/references/*.md citations to MCP prompt names', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.getPrompt('dtpr-element-design')
    const text = res.result!.messages[0]!.content.text
    // No path-style citation should survive the bundling rewrite.
    expect(text).not.toContain('plugin/dtpr/references/')
    // The rewritten reference should appear as the prompt name.
    expect(text).toContain('`dtpr-references-comprehension-rubric`')
  })

  it('prompts/get with an unknown name returns METHOD_NOT_FOUND', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.getPrompt('does-not-exist')
    expect(res.error?.code).toBe(-32601)
    expect(res.error?.message).toMatch(/Prompt not found/)
  })

  it('prompts/get without a name returns INVALID_PARAMS', async () => {
    const client = createMcpClient()
    await client.initialize()
    const { SELF } = (await import('cloudflare:test')) as typeof import('cloudflare:test')
    const sid = client.sessionId()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    }
    if (sid) headers['mcp-session-id'] = sid
    const httpRes = await SELF.fetch('https://example.com/mcp', {
      method: 'POST',
      headers,
      body: JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'prompts/get', params: {} }),
    })
    const body = (await httpRes.json()) as { error?: { code: number; message: string } }
    expect(body.error?.code).toBe(-32602)
    expect(body.error?.message).toMatch(/name/i)
  })

  it('reference prompts are retrievable and contain rubric content', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.getPrompt('dtpr-references-comprehension-rubric')
    expect(res.error).toBeUndefined()
    const text = res.result!.messages[0]!.content.text
    expect(text).toMatch(/rubric_version/)
    expect(text).toContain('Comprehension rubric')
  })
})
