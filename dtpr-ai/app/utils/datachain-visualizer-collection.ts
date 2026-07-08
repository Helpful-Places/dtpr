// Personal localStorage collection for saved datachain visualizer
// entries. Single key, single JSON array, versioned schema. The cap is
// enforced *before* writing so a too-large save never corrupts the
// prior state. Every storage access is wrapped because Safari private
// mode and disabled-storage browsers throw on `localStorage` access.

const STORAGE_KEY = 'dtpr-ai.datachain-visualizer.collection.v1'
const MAX_SERIALIZED_BYTES = 4 * 1024 * 1024 // ~4 MB; below the ~5 MB origin cap with margin
const SCHEMA_VERSION = 1

export interface CollectionEntry {
  id: string
  name: string
  savedAt: string
  json: string
}

export interface Collection {
  entries: CollectionEntry[]
  schemaVersion: typeof SCHEMA_VERSION
}

export class CollectionFullError extends Error {
  constructor(
    public readonly attemptedBytes: number,
    public readonly limitBytes: number = MAX_SERIALIZED_BYTES,
  ) {
    super(
      `Saving this entry would push the collection to ${attemptedBytes} bytes, ` +
        `which exceeds the ${limitBytes}-byte localStorage cap. Delete an entry to make room.`,
    )
    this.name = 'CollectionFullError'
  }
}

export class CollectionUnavailableError extends Error {
  constructor(cause?: unknown) {
    super(
      'localStorage is not available in this browser context (private-mode Safari or disabled storage). ' +
        'The collection cannot be loaded or saved here.',
    )
    this.name = 'CollectionUnavailableError'
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause
  }
}

const EMPTY_COLLECTION: Collection = { entries: [], schemaVersion: SCHEMA_VERSION }

function getStorage(): Storage {
  if (typeof window === 'undefined') {
    throw new CollectionUnavailableError(new Error('window is undefined (SSR context)'))
  }
  try {
    const storage = window.localStorage
    // Touching the property may throw in Safari private mode.
    void storage.length
    return storage
  } catch (err) {
    throw new CollectionUnavailableError(err)
  }
}

function readRaw(storage: Storage): string | null {
  try {
    return storage.getItem(STORAGE_KEY)
  } catch (err) {
    throw new CollectionUnavailableError(err)
  }
}

function writeRaw(storage: Storage, raw: string): void {
  try {
    storage.setItem(STORAGE_KEY, raw)
  } catch (err) {
    throw new CollectionUnavailableError(err)
  }
}

function parseCollection(raw: string | null): Collection {
  if (raw === null) return { ...EMPTY_COLLECTION, entries: [] }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[datachain visualizer] discarding corrupt collection JSON', err)
    return { ...EMPTY_COLLECTION, entries: [] }
  }
  if (!parsed || typeof parsed !== 'object') return { ...EMPTY_COLLECTION, entries: [] }
  const rec = parsed as Record<string, unknown>
  if (rec.schemaVersion !== SCHEMA_VERSION) {
    // Forward-compat: a future version may write a different shape.
    // Don't throw — just decline to deserialize entries we don't know.
    return { ...EMPTY_COLLECTION, entries: [] }
  }
  if (!Array.isArray(rec.entries)) return { ...EMPTY_COLLECTION, entries: [] }
  const entries: CollectionEntry[] = []
  for (const item of rec.entries) {
    if (!item || typeof item !== 'object') continue
    const e = item as Record<string, unknown>
    if (
      typeof e.id !== 'string' ||
      typeof e.name !== 'string' ||
      typeof e.savedAt !== 'string' ||
      typeof e.json !== 'string'
    )
      continue
    entries.push({ id: e.id, name: e.name, savedAt: e.savedAt, json: e.json })
  }
  return { entries, schemaVersion: SCHEMA_VERSION }
}

function byteLengthOf(value: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).byteLength
  }
  // Fallback — overcounts for multibyte strings, undercounts for surrogate pairs,
  // but `TextEncoder` is universal in our supported browsers.
  return value.length
}

function serialize(collection: Collection): string {
  return JSON.stringify(collection)
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `entry-${Date.now()}-${Math.floor(Math.random() * 1e9)}`
}

/** Load the personal collection, returning the empty state on missing/corrupt data. */
export function loadCollection(): Collection {
  const storage = getStorage()
  const raw = readRaw(storage)
  return parseCollection(raw)
}

/** Append a new entry. Throws CollectionFullError when the cap would be exceeded. */
export function saveEntry(input: { name: string; json: string }): CollectionEntry {
  const storage = getStorage()
  const current = parseCollection(readRaw(storage))
  const entry: CollectionEntry = {
    id: generateId(),
    name: input.name.trim().length > 0 ? input.name.trim() : 'Untitled chain',
    savedAt: new Date().toISOString(),
    json: input.json,
  }
  const next: Collection = {
    schemaVersion: SCHEMA_VERSION,
    entries: [entry, ...current.entries],
  }
  const serialized = serialize(next)
  const size = byteLengthOf(serialized)
  if (size > MAX_SERIALIZED_BYTES) {
    throw new CollectionFullError(size)
  }
  writeRaw(storage, serialized)
  return entry
}

export function renameEntry(id: string, name: string): Collection {
  const storage = getStorage()
  const current = parseCollection(readRaw(storage))
  const trimmed = name.trim()
  const next: Collection = {
    schemaVersion: SCHEMA_VERSION,
    entries: current.entries.map((e) =>
      e.id === id ? { ...e, name: trimmed.length > 0 ? trimmed : e.name } : e,
    ),
  }
  writeRaw(storage, serialize(next))
  return next
}

export function deleteEntry(id: string): Collection {
  const storage = getStorage()
  const current = parseCollection(readRaw(storage))
  const next: Collection = {
    schemaVersion: SCHEMA_VERSION,
    entries: current.entries.filter((e) => e.id !== id),
  }
  writeRaw(storage, serialize(next))
  return next
}

