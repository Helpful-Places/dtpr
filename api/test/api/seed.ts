/**
 * Helpers for seeding Miniflare's R2 binding from a vitest test file.
 * Used by REST + MCP API tests so each suite can stand up a small,
 * focused schema version inside one beforeAll.
 */

import { env } from 'cloudflare:test'
import type { Category } from '../../src/schema/category.ts'
import type { DatachainType } from '../../src/schema/datachain-type.ts'
import type { Element } from '../../src/schema/element.ts'
import type { LocaleCode } from '../../src/schema/locale.ts'
import type { SchemaManifest } from '../../src/schema/manifest.ts'
import type { ParsedVersion } from '../../cli/lib/version-parser.ts'
import {
  categoriesKey,
  datachainTypeKey,
  elementKey,
  elementsKey,
  manifestKey,
  schemaJsonKey,
  searchIndexKey,
  INDEX_KEY,
} from '../../src/store/keys.ts'
import { buildSearchIndexesByLocale } from '../../cli/lib/search-index-builder.ts'
import type { SchemaIndex } from '../../src/store/index.ts'

const loc = (locale: LocaleCode, value: string) => ({ locale, value })

export const SAMPLE_VERSION: ParsedVersion = {
  type: 'ai',
  date: '2026-04-16',
  beta: false,
  canonical: 'ai@2026-04-16',
  dir: 'ai/2026-04-16',
}

export const SAMPLE_BETA_VERSION: ParsedVersion = {
  type: 'ai',
  date: '2026-04-16',
  beta: true,
  canonical: 'ai@2026-04-16-beta',
  dir: 'ai/2026-04-16-beta',
}

export function makeManifest(version: ParsedVersion): SchemaManifest {
  return {
    version: version.canonical,
    status: version.beta ? 'beta' : 'stable',
    created_at: '2026-04-16T00:00:00.000Z',
    notes: '',
    content_hash: `sha256-${'a'.repeat(64)}`,
    locales: ['en', 'fr'],
  }
}

export function makeDatachainType(): DatachainType {
  return {
    id: 'ai',
    name: [loc('en', 'AI'), loc('fr', 'IA')],
    description: [loc('en', 'AI datachain'), loc('fr', 'Chaîne IA')],
    categories: ['ai__decision'],
    locales: ['en', 'fr'],
  }
}

export function makeCategories(): Category[] {
  return [
    {
      id: 'ai__decision',
      name: [loc('en', 'Decision'), loc('fr', 'Décision')],
      description: [
        loc('en', 'How decisions get made.'),
        loc('fr', 'Comment les décisions sont prises.'),
      ],
      prompt: [],
      required: true,
      order: 1,
      datachain_type: 'ai',
      shape: 'hexagon',
      element_variables: [],
    },
  ]
}

export function makeElements(): Element[] {
  return [
    {
      id: 'accept_deny',
      category_id: 'ai__decision',
      title: [loc('en', 'Accept / Deny'), loc('fr', 'Accepter / Refuser')],
      description: [
        loc('en', 'Binary outcome: yes or no.'),
        loc('fr', 'Résultat binaire: oui ou non.'),
      ],
      citation: [],
      symbol_id: 'accept_deny',
      variables: [],
    },
    {
      id: 'identifiable_video',
      category_id: 'ai__decision',
      title: [loc('en', 'Identifiable video'), loc('fr', 'Vidéo identifiable')],
      description: [
        loc('en', 'Video that can identify a person.'),
        loc('fr', 'Vidéo qui peut identifier une personne.'),
      ],
      citation: [],
      symbol_id: 'identifiable_video',
      variables: [],
    },
    {
      id: 'anomaly_detection',
      category_id: 'ai__decision',
      title: [loc('en', 'Anomaly detection'), loc('fr', 'Détection d\'anomalies')],
      description: [
        loc('en', 'Flagging unusual patterns.'),
        loc('fr', 'Signaler des modèles inhabituels.'),
      ],
      citation: [],
      symbol_id: 'anomaly',
      variables: [],
    },
  ]
}

async function putJson(key: string, value: unknown): Promise<void> {
  await env.CONTENT.put(key, JSON.stringify(value))
}

async function clearBucket(): Promise<void> {
  let cursor: string | undefined
  do {
    const list = await env.CONTENT.list({ cursor, limit: 1000 })
    if (list.objects.length > 0) {
      await env.CONTENT.delete(list.objects.map((o) => o.key))
    }
    cursor = list.truncated ? list.cursor : undefined
  } while (cursor)
}

export interface SeedOptions {
  version?: ParsedVersion
  manifest?: SchemaManifest
  datachainType?: DatachainType
  categories?: Category[]
  elements?: Element[]
  /** When true, also write `schemas/index.json` so the version is discoverable. */
  registerInIndex?: boolean
}

/**
 * Wipe the bucket and seed a single version's worth of objects.
 * Returns the seed payload so tests can assert against the exact
 * shapes that landed in R2.
 */
export async function seedVersion(opts: SeedOptions = {}) {
  await clearBucket()
  const version = opts.version ?? SAMPLE_VERSION
  const manifest = opts.manifest ?? makeManifest(version)
  const datachainType = opts.datachainType ?? makeDatachainType()
  const categories = opts.categories ?? makeCategories()
  const elements = opts.elements ?? makeElements()

  await putJson(manifestKey(version), manifest)
  await putJson(datachainTypeKey(version), datachainType)
  await putJson(categoriesKey(version), categories)
  await putJson(elementsKey(version), elements)
  await putJson(schemaJsonKey(version), { Element: { type: 'object' } })
  for (const el of elements) {
    await putJson(elementKey(version, el.id), el)
  }

  const indexes = buildSearchIndexesByLocale(elements, manifest.locales)
  for (const [locale, serialized] of Object.entries(indexes)) {
    await env.CONTENT.put(searchIndexKey(version, locale as LocaleCode), serialized)
  }

  if (opts.registerInIndex !== false) {
    const idx: SchemaIndex = {
      versions: [
        {
          id: manifest.version,
          status: manifest.status,
          created_at: manifest.created_at,
          content_hash: manifest.content_hash,
        },
      ],
    }
    await putJson(INDEX_KEY, idx)
  }

  return { version, manifest, datachainType, categories, elements }
}

export { clearBucket }
