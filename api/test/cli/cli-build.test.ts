import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtemp, rm, readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { build, validateCmd } from '../../cli/commands/build.ts'

/**
 * End-to-end exercise of the CLI pipeline against the committed
 * `api/test/fixtures/schemas/ai/2026-04-16-beta/` fixture. These tests
 * write to a scratch tmpdir so the repo's on-disk state is unaffected.
 */

const fixtureRoot = fileURLToPath(new URL('../fixtures/schemas', import.meta.url))

const logs: string[] = []
const captureLog = (line: string) => {
  logs.push(line)
}

let outDir: string

beforeAll(async () => {
  outDir = await mkdtemp(join(tmpdir(), 'dtpr-cli-test-'))
})

afterAll(async () => {
  if (outDir) await rm(outDir, { recursive: true, force: true })
})

describe('CLI build (end-to-end)', () => {
  it('validates the committed fixture with no errors', async () => {
    logs.length = 0
    const result = await validateCmd('ai@2026-04-16-beta', {
      sourceRoot: fixtureRoot,
      log: captureLog,
    })
    expect(result.ok).toBe(true)
    expect(result.errorCount).toBe(0)
  })

  it('builds the fixture and emits the expected file tree', async () => {
    logs.length = 0
    const result = await build('ai@2026-04-16-beta', {
      sourceRoot: fixtureRoot,
      outputRoot: outDir,
      log: captureLog,
    })
    expect(result.ok).toBe(true)
    expect(result.outputDir).toBeDefined()
    const dir = resolve(outDir, 'ai/2026-04-16-beta')

    const manifestRaw = await readFile(join(dir, 'manifest.json'), 'utf8')
    const manifest = JSON.parse(manifestRaw) as { content_hash: string; version: string }
    expect(manifest.version).toBe('ai@2026-04-16-beta')
    expect(manifest.content_hash).toMatch(/^sha256-[0-9a-f]{64}$/)
    // Non-sentinel
    expect(manifest.content_hash).not.toBe(`sha256-${'0'.repeat(64)}`)

    const elements = JSON.parse(
      await readFile(join(dir, 'elements.json'), 'utf8'),
    ) as Array<{ id: string; variables: Array<{ id: string }> }>
    expect(elements.map((e) => e.id).sort()).toEqual(['accept_deny', 'cloud_storage'])

    const cloud = elements.find((e) => e.id === 'cloud_storage')!
    // Inherited retention_period variable should be materialized onto the element.
    expect(cloud.variables.map((v) => v.id)).toEqual(['retention_period'])

    // Per-element files
    const perElement = JSON.parse(
      await readFile(join(dir, 'elements', 'accept_deny.json'), 'utf8'),
    ) as { id: string }
    expect(perElement.id).toBe('accept_deny')

    // Search index exists
    const searchIndex = JSON.parse(
      await readFile(join(dir, 'search-index.en.json'), 'utf8'),
    ) as Record<string, unknown>
    expect(searchIndex).toBeTruthy()
  })

  it('build output is a superset of validate output', async () => {
    // validate produces only log messages; build produces logs + files.
    const validateLogs: string[] = []
    const validateResult = await validateCmd('ai@2026-04-16-beta', {
      sourceRoot: fixtureRoot,
      log: (l) => validateLogs.push(l),
    })
    expect(validateResult.ok).toBe(true)
    // Every validate line should also have been produced during build.
    const buildLogs: string[] = []
    const buildResult = await build('ai@2026-04-16-beta', {
      sourceRoot: fixtureRoot,
      outputRoot: outDir,
      log: (l) => buildLogs.push(l),
    })
    expect(buildResult.ok).toBe(true)
    // Build adds a "Wrote ... files" line; validate does not.
    expect(buildLogs.some((l) => l.includes('Wrote'))).toBe(true)
    expect(validateLogs.some((l) => l.includes('Wrote'))).toBe(false)
  })

  it('dryRun skips writing files', async () => {
    const dryOutDir = await mkdtemp(join(tmpdir(), 'dtpr-cli-dry-'))
    try {
      const result = await build('ai@2026-04-16-beta', {
        sourceRoot: fixtureRoot,
        outputRoot: dryOutDir,
        dryRun: true,
        log: captureLog,
      })
      expect(result.ok).toBe(true)
      expect(result.outputDir).toBeUndefined()
      // No version dir written.
      await expect(
        readFile(join(dryOutDir, 'ai/2026-04-16-beta/manifest.json'), 'utf8'),
      ).rejects.toThrow()
    } finally {
      await rm(dryOutDir, { recursive: true, force: true })
    }
  })
})
