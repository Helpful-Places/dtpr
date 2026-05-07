import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bundleSkills } from '../lib/skill-bundler.ts'

const API_ROOT = fileURLToPath(new URL('../..', import.meta.url))
const REPO_ROOT = resolve(API_ROOT, '..')

export interface BundleSkillsCmdOptions {
  pluginRoot?: string
  outputPath?: string
  log?: (line: string) => void
}

export interface BundleSkillsCmdResult {
  ok: boolean
  promptCount: number
  outputPath: string
  outputBytes: number
}

/** CLI wrapper around `bundleSkills` — emits the generated TS module
 * the MCP `prompts/list` + `prompts/get` handlers consume. */
export async function bundleSkillsCmd(
  options: BundleSkillsCmdOptions = {},
): Promise<BundleSkillsCmdResult> {
  const log = options.log ?? ((line: string) => console.log(line))
  const pluginRoot = resolve(options.pluginRoot ?? join(REPO_ROOT, 'plugin', 'dtpr'))
  const outputPath = resolve(
    options.outputPath ?? join(API_ROOT, 'src', 'mcp', 'prompts', 'skills.generated.ts'),
  )
  log(`Bundling skills from ${pluginRoot}`)
  const result = await bundleSkills({ pluginRoot, outputPath })
  log(`  wrote ${result.prompts.length} prompts to ${outputPath} (${result.outputBytes} bytes)`)
  for (const p of result.prompts) {
    log(`  - ${p.name}`)
  }
  return {
    ok: true,
    promptCount: result.prompts.length,
    outputPath: result.outputPath,
    outputBytes: result.outputBytes,
  }
}
