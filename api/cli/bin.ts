#!/usr/bin/env -S tsx
import { build, validateCmd } from './commands/build.ts'

/**
 * DTPR API CLI entry point. Single binary (`pnpm api <command>`) with
 * subcommands for the schema authoring workflow.
 */

interface CommonFlags {
  sourceRoot?: string
  outputRoot?: string
}

function parseCommonFlags(args: string[]): { positional: string[]; flags: CommonFlags } {
  const positional: string[] = []
  const flags: CommonFlags = {}
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!
    if (arg === '--source-root' && args[i + 1]) {
      flags.sourceRoot = args[++i]
    } else if (arg === '--output-root' && args[i + 1]) {
      flags.outputRoot = args[++i]
    } else {
      positional.push(arg)
    }
  }
  return { positional, flags }
}

type Command = (args: string[]) => Promise<number>

const commands: Record<string, Command> = {
  build: async (args) => {
    const { positional, flags } = parseCommonFlags(args)
    const version = positional[0]
    if (!version) {
      console.error('usage: api build <version> [--source-root DIR] [--output-root DIR]')
      return 2
    }
    const result = await build(version, flags)
    return result.ok ? 0 : 1
  },
  validate: async (args) => {
    const { positional, flags } = parseCommonFlags(args)
    const version = positional[0]
    if (!version) {
      console.error('usage: api validate <version> [--source-root DIR]')
      return 2
    }
    const result = await validateCmd(version, flags)
    return result.ok ? 0 : 1
  },
  new: async () => {
    console.error('api new: not yet implemented (Unit 13)')
    return 2
  },
  promote: async () => {
    console.error('api promote: not yet implemented (Unit 13)')
    return 2
  },
  '--help': async () => {
    printHelp()
    return 0
  },
  '-h': async () => {
    printHelp()
    return 0
  },
  help: async () => {
    printHelp()
    return 0
  },
}

function printHelp(): void {
  console.log(`DTPR API CLI

Usage: api <command> [args...]

Commands:
  build <version>     Validate and emit JSON bundles for a schema version
  validate <version>  Validate a schema version (no emit)
  new                 Draft a new beta version (Unit 13 — not yet implemented)
  promote             Promote a beta version to stable (Unit 13 — not yet implemented)

Version strings: '<type>@<YYYY-MM-DD>[-beta]' (e.g. 'ai@2026-04-16-beta')
`)
}

async function main() {
  const [, , command, ...rest] = process.argv
  const runner = command ? commands[command] : undefined
  if (!runner) {
    printHelp()
    process.exit(command ? 2 : 0)
  }
  const exitCode = await runner(rest)
  process.exit(exitCode)
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e))
  process.exit(1)
})
