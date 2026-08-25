/**
 * UI iframe entry point.
 *
 * Runs in a real browser context, so this is where every network call
 * lives. Fetches the schema, paces itself against the API's rate
 * limit, and streams icons to the sandbox in batches.
 */

import {
  CLIENT_HEADER,
  CLIENT_ID,
  DEFAULT_API_BASE,
  READ_LIMIT_PER_MINUTE,
  categoriesUrl,
  elementsUrl,
  iconUrl,
  localized,
  versionsUrl,
  type Category,
  type Element,
  type SchemaVersionSummary,
} from '../api.ts'
import { parseVariantToken } from '../variants.ts'
import type {
  CodeToUi,
  ElementMeta,
  GenerateSettings,
  IconPayload,
  UiToCode,
} from '../messages.ts'
import { RateLimiter, get, mapPool } from './net.ts'

/**
 * Stay under the API's 300/min so a normal build never trips the
 * limiter. The margin absorbs the metadata requests and any retry.
 */
const REQUEST_BUDGET_PER_MINUTE = READ_LIMIT_PER_MINUTE - 20
const CONCURRENCY = 6
const BATCH_SIZE = 24

const HEADERS: Record<string, string> = { [CLIENT_HEADER]: CLIENT_ID }

const DEFAULT_SETTINGS: GenerateSettings = {
  version: '',
  locale: 'en',
  defaultContextOnly: false,
  lightThemeOnly: false,
  includeLabels: true,
}

let versions: SchemaVersionSummary[] = []
let running = false
let cancelled = false

const el = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id)
  if (!node) throw new Error(`Missing #${id} in ui.html`)
  return node as T
}

const versionSelect = el<HTMLSelectElement>('version')
const localeInput = el<HTMLInputElement>('locale')
const defaultContextOnly = el<HTMLInputElement>('defaultContextOnly')
const lightThemeOnly = el<HTMLInputElement>('lightThemeOnly')
const includeLabels = el<HTMLInputElement>('includeLabels')
const generateButton = el<HTMLButtonElement>('generate')
const cancelButton = el<HTMLButtonElement>('cancel')
const statusLine = el<HTMLParagraphElement>('status')
const progressBar = el<HTMLDivElement>('progressBar')
const estimateLine = el<HTMLParagraphElement>('estimate')

function toCode(message: UiToCode): void {
  parent.postMessage({ pluginMessage: message }, '*')
}

function readSettings(): GenerateSettings {
  return {
    version: versionSelect.value,
    locale: localeInput.value.trim() || 'en',
    defaultContextOnly: defaultContextOnly.checked,
    lightThemeOnly: lightThemeOnly.checked,
    includeLabels: includeLabels.checked,
  }
}

function applySettings(settings: GenerateSettings): void {
  localeInput.value = settings.locale
  defaultContextOnly.checked = settings.defaultContextOnly
  lightThemeOnly.checked = settings.lightThemeOnly
  includeLabels.checked = settings.includeLabels
  if (settings.version && versions.some((v) => v.id === settings.version)) {
    versionSelect.value = settings.version
  }
}

function setStatus(text: string, tone: 'idle' | 'busy' | 'ok' | 'error' = 'idle'): void {
  statusLine.textContent = text
  statusLine.dataset.tone = tone
}

function setProgress(done: number, total: number): void {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  progressBar.style.width = `${pct}%`
}

function setRunning(next: boolean): void {
  running = next
  generateButton.disabled = next
  cancelButton.hidden = !next
  versionSelect.disabled = next
  localeInput.disabled = next
  defaultContextOnly.disabled = next
  lightThemeOnly.disabled = next
  includeLabels.disabled = next
}

/** Which of an element's variant tokens this run should fetch. */
function selectTokens(tokens: readonly string[], settings: GenerateSettings): string[] {
  return tokens.filter((token) => {
    const axes = parseVariantToken(token)
    if (!axes) return false
    if (settings.defaultContextOnly && axes.context !== 'default') return false
    if (settings.lightThemeOnly && axes.theme === 'dark') return false
    return true
  })
}

async function fetchJson<T>(url: string, limiter: RateLimiter): Promise<T> {
  const response = await get(url, { limiter, headers: HEADERS, signal: () => cancelled })
  return (await response.json()) as T
}

async function loadVersions(): Promise<void> {
  const limiter = new RateLimiter(REQUEST_BUDGET_PER_MINUTE)
  setStatus('Loading schema versions…', 'busy')
  const body = await fetchJson<{ versions: SchemaVersionSummary[] }>(
    versionsUrl(DEFAULT_API_BASE),
    limiter,
  )
  // Newest last in the API response; show newest first.
  versions = body.versions.slice().reverse()
  versionSelect.innerHTML = ''
  for (const version of versions) {
    const option = document.createElement('option')
    option.value = version.id
    option.textContent = `${version.id}  (${version.status})`
    versionSelect.appendChild(option)
  }
  setStatus(`${versions.length} versions available.`)
}

async function loadElements(
  version: string,
  locale: string,
  limiter: RateLimiter,
): Promise<Element[]> {
  const all: Element[] = []
  let cursor: string | undefined
  for (;;) {
    const body = await fetchJson<{
      elements: Element[]
      meta: { next_cursor: string | null }
    }>(elementsUrl(DEFAULT_API_BASE, version, locale, cursor), limiter)
    all.push(...body.elements)
    if (!body.meta.next_cursor) break
    cursor = body.meta.next_cursor
  }
  return all
}

interface IconTask {
  elementId: string
  token: string
}

async function generate(): Promise<void> {
  const settings = readSettings()
  if (!settings.version) {
    setStatus('Pick a schema version first.', 'error')
    return
  }

  cancelled = false
  setRunning(true)
  setProgress(0, 1)
  toCode({ type: 'save-settings', settings })

  const limiter = new RateLimiter(REQUEST_BUDGET_PER_MINUTE)

  try {
    setStatus('Loading categories and elements…', 'busy')
    const [categoriesBody, elements] = await Promise.all([
      fetchJson<{ categories: Category[] }>(
        categoriesUrl(DEFAULT_API_BASE, settings.version, settings.locale),
        limiter,
      ),
      loadElements(settings.version, settings.locale, limiter),
    ])

    const metas: ElementMeta[] = []
    const tasks: IconTask[] = []
    for (const element of elements) {
      const tokens = selectTokens(element.icon_variants ?? [], settings)
      if (tokens.length === 0) continue
      metas.push({
        id: element.id,
        categoryId: element.category_id,
        title: localized(element.title, settings.locale),
        description: localized(element.description, settings.locale),
        variantTokens: tokens,
      })
      for (const token of tokens) tasks.push({ elementId: element.id, token })
    }

    if (tasks.length === 0) {
      setStatus('Nothing to build with those options.', 'error')
      setRunning(false)
      return
    }

    const contentHash =
      versions.find((v) => v.id === settings.version)?.content_hash ?? ''

    toCode({
      type: 'build-start',
      settings,
      contentHash,
      categories: categoriesBody.categories,
      elements: metas,
    })

    let done = 0
    let failed = 0
    let batch: IconPayload[] = []

    const flush = (): void => {
      if (batch.length === 0) return
      toCode({ type: 'build-batch', icons: batch })
      batch = []
    }

    await mapPool<IconTask, IconPayload | null>(
      tasks,
      CONCURRENCY,
      async (task) => {
        if (cancelled) return null
        try {
          const response = await get(
            iconUrl(DEFAULT_API_BASE, settings.version, task.elementId, task.token),
            { limiter, headers: HEADERS, signal: () => cancelled },
          )
          return {
            elementId: task.elementId,
            variantToken: task.token,
            svg: await response.text(),
          }
        } catch (error) {
          if (cancelled) return null
          // One bad icon shouldn't sink a 470-request build. Count it,
          // report it at the end, and let the element keep its other
          // variants.
          failed += 1
          console.warn(`DTPR: ${task.elementId}/${task.token} failed`, error)
          return null
        }
      },
      (result) => {
        done += 1
        if (result) batch.push(result)
        if (batch.length >= BATCH_SIZE) flush()
        setProgress(done, tasks.length)
        if (done % 10 === 0 || done === tasks.length) {
          setStatus(`Fetching icons… ${done} / ${tasks.length}`, 'busy')
        }
      },
    )

    if (cancelled) {
      toCode({ type: 'build-abort', message: 'Cancelled' })
      setStatus('Cancelled.', 'error')
      setRunning(false)
      return
    }

    flush()
    setStatus(
      failed > 0
        ? `Building in Figma… (${failed} icons failed to download)`
        : 'Building components in Figma…',
      'busy',
    )
    toCode({ type: 'build-end' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    toCode({ type: 'build-abort', message })
    setStatus(message, 'error')
    setRunning(false)
  }
}

/** Rough "how long will this take" hint, driven by the rate limit. */
function updateEstimate(): void {
  const settings = readSettings()
  // 137 elements: 104 with light+dark only, 33 with context variants.
  const approxIcons = settings.defaultContextOnly
    ? 137 * (settings.lightThemeOnly ? 1 : 2)
    : settings.lightThemeOnly ? 234 : 468
  const minutes = approxIcons / REQUEST_BUDGET_PER_MINUTE
  const label = minutes < 1 ? 'under a minute' : `about ${Math.ceil(minutes)} min`
  estimateLine.textContent = `~${approxIcons} icons · ${label} (API allows ${READ_LIMIT_PER_MINUTE} requests/min)`
}

generateButton.addEventListener('click', () => {
  if (!running) void generate()
})

cancelButton.addEventListener('click', () => {
  cancelled = true
  // The local flag only stops the fetch phase. Once `build-end` has been
  // sent the sandbox owns the work, so it has to be told separately —
  // otherwise cancelling mid-build still ends in "Done".
  toCode({ type: 'build-cancel' })
  setStatus('Cancelling…', 'busy')
})

for (const input of [defaultContextOnly, lightThemeOnly]) {
  input.addEventListener('change', updateEstimate)
}

window.addEventListener('message', (event: MessageEvent) => {
  const message = (event.data as { pluginMessage?: CodeToUi } | null)?.pluginMessage
  if (!message) return

  switch (message.type) {
    case 'code-ready':
      applySettings(message.settings ?? DEFAULT_SETTINGS)
      updateEstimate()
      break
    case 'build-progress':
      setStatus(`Building… ${message.done} / ${message.total} elements`, 'busy')
      break
    case 'build-done':
      setProgress(1, 1)
      setStatus(
        `Done — ${message.components} components (${message.sets} sets) on "${message.pageName}".`,
        'ok',
      )
      setRunning(false)
      break
    case 'build-failed':
      setStatus(message.message, 'error')
      setRunning(false)
      break
  }
})

async function boot(): Promise<void> {
  try {
    await loadVersions()
    toCode({ type: 'ui-ready' })
    updateEstimate()
  } catch (error) {
    setStatus(
      `Could not reach api.dtpr.io — ${error instanceof Error ? error.message : String(error)}`,
      'error',
    )
  }
}

void boot()
